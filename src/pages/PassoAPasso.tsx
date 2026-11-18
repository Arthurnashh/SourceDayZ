import passoMd from "../content/passo-a-passo.md?raw";
import { Md } from "../components/Md";
import { Stat } from "../components/ui";

export function PassoAPasso() {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <span className="kicker">animações · passo a passo técnico</span>
          <h1>Como o 1.30 entrou no 0.45</h1>
          <p>
            O porte completo, na ordem em que aconteceu: extração do PBO, leitura dos dois
            formatos de RTM, mapeamento dos nomes, validação, trim de ossos, staging,
            empacotamento e teste. Com o código real, os hexdumps de antes e depois e os
            números de cada etapa.
          </p>
        </div>
      </div>

      <section className="stats-grid">
        <Stat label="Passos" value="12" hint="do baseline ao teste em jogo" tone="blue" />
        <Stat label="RTMs no acervo" value="7.415" hint="DayZ 1.30 · origem do porte" tone="violet" />
        <Stat label="Arquivos trocados" value="1.526" hint="do manifesto de 1.527 registros" tone="lime" />
        <Stat label="Trim de ossos" value="−23,45%" hint="1.425,9 → 1.091,5 MB" tone="amber" />
      </section>

      <section className="panel article">
        <Md text={passoMd} />
      </section>
    </div>
  );
}
