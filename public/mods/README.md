# SourceDayZ server mod manifest

The launcher reads the live server manifest from `/api/workshop/servers` when a player opens a server's join screen. DayZ's A2S server query does not report a usable mod list, so each dedicated server sends its loaded mod folders to `/api/workshop/server-heartbeat` when it starts. The site resolves those folders to published Workshop mod IDs and returns them to the launcher.

For a manually managed server, the legacy `servers.json` file accepts entries using the address and game port shown in the launcher's server list:

```json
{
  "ip": "203.0.113.10",
  "port": 2302,
  "mods": [
    {
      "id": "00000000-0000-4000-8000-000000000000",
      "folder": "@ExampleMod"
    }
  ]
}
```

- `id` is the mod ID from the SourceDayZ Workshop.
- `folder` is the exact `@FolderName` used in the server's `-mod=` startup parameter. Use the same value for each client installation.
- Store each mod as an uncompressed directory under the repository's top-level `mods/` folder, for example `mods/@Helicopteros/Addons/*.pbo`. Track PBOs with Git LFS and list their relative paths, sizes, hashes, and GitHub media URLs in that mod's `manifest.json`. Register the raw manifest URL with the full commit SHA so the launcher gets the exact published files.
- Do not commit a ZIP, 7z, or RAR containing the mod. The launcher downloads each listed file and recreates its directory structure in the game folder.
- On the DayZ server, install each mod's contents in a matching `@FolderName` directory beside the server executable and list the same folders in its startup arguments, for example `-mod=@ExampleMod;@AnotherMod`.
- On the client, the launcher installs each individual file into the selected DayZ game directory under those same `@FolderName` directories before joining.

For automatic registration, apply `supabase/workshopServers.sql` after `supabase/workshopMods.sql`. Keep each raw server token in the server host's local AppData; never commit it to GitHub or include it in a public game package.
