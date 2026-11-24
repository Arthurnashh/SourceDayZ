import dgram from "node:dgram";

const SERVER_IP = "3.143.228.170";
const QUERY_PORT = 2305;
const QUERY_TIMEOUT_MS = 2500;
const CACHE_MS = 15000;

const INFO_REQUEST = Buffer.from([
  0xff, 0xff, 0xff, 0xff, 0x54,
  0x53, 0x6f, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6e, 0x67, 0x69, 0x6e,
  0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00,
]);

let cachedResult = null;
let cachedAt = 0;
let pendingQuery = null;

function parseInfoPacket(packet) {
  if (packet.length < 9 || packet.readUInt32LE(0) !== 0xffffffff || packet[4] !== 0x49) {
    throw new Error("Resposta A2S_INFO inválida.");
  }

  let offset = 6;
  for (let index = 0; index < 4; index += 1) {
    const end = packet.indexOf(0, offset);
    if (end < 0) throw new Error("Resposta A2S_INFO incompleta.");
    offset = end + 1;
  }

  offset += 2;
  if (offset + 2 > packet.length) throw new Error("Resposta A2S_INFO sem contagem de jogadores.");

  const players = packet.readUInt8(offset);
  const maxPlayers = packet.readUInt8(offset + 1);
  if (maxPlayers < 1) throw new Error("O servidor não informou o limite de jogadores.");

  return {
    online: true,
    players,
    maxPlayers,
    slotsAvailable: Math.max(0, maxPlayers - players),
  };
}

function queryServer() {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let settled = false;
    let timer;

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.removeAllListeners();
      try {
        socket.close();
      } catch {
        // O socket pode já ter sido fechado após um erro de rede.
      }
      if (error) reject(error);
      else resolve(value);
    };

    const sendRequest = (payload) => {
      socket.send(payload, QUERY_PORT, SERVER_IP, (error) => {
        if (error) finish(error);
      });
    };

    socket.on("error", (error) => finish(error));
    socket.on("message", (packet) => {
      try {
        if (packet.length < 5 || packet.readUInt32LE(0) !== 0xffffffff) {
          throw new Error("Resposta do servidor inválida.");
        }

        if (packet[4] === 0x41) {
          if (packet.length < 9) throw new Error("Challenge A2S_INFO incompleto.");
          sendRequest(Buffer.concat([INFO_REQUEST, packet.subarray(5, 9)]));
          return;
        }

        finish(null, parseInfoPacket(packet));
      } catch (error) {
        finish(error);
      }
    });

    timer = setTimeout(() => finish(new Error("Tempo esgotado ao consultar o servidor.")), QUERY_TIMEOUT_MS);
    sendRequest(INFO_REQUEST);
  });
}

async function readServerStatus() {
  const now = Date.now();
  if (cachedResult && now - cachedAt < CACHE_MS) return cachedResult;
  if (pendingQuery) return pendingQuery;

  pendingQuery = queryServer()
    .catch(() => ({
      online: false,
      players: null,
      maxPlayers: null,
      slotsAvailable: null,
    }))
    .then((result) => {
      cachedResult = { ...result, checkedAt: new Date().toISOString() };
      cachedAt = Date.now();
      return cachedResult;
    })
    .finally(() => {
      pendingQuery = null;
    });

  return pendingQuery;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Método não permitido." }));
    return;
  }

  const status = await readServerStatus();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=15, stale-while-revalidate=15");
  res.statusCode = 200;
  res.end(JSON.stringify({
    ...status,
    ip: SERVER_IP,
    queryPort: QUERY_PORT,
  }));
}
