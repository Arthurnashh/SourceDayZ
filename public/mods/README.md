# SourceDayZ server mod manifest

`servers.json` connects each DayZ server address to the SourceDayZ Workshop mods it requires. The launcher reads it when the player opens a server's join screen. A2S server discovery does not report a usable mod list, so this manifest is the source of truth for the launcher.

Add one entry per server using the address and game port shown in the launcher's server list:

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
- Keep a mod's downloadable ZIP, 7z, or RAR package in the Workshop's private Supabase Storage bucket. This repository stores only the server-to-mod manifest.
- On the DayZ server, install each mod's contents in a matching `@FolderName` directory beside the server executable and list the same folders in its startup arguments, for example `-mod=@ExampleMod;@AnotherMod`.
- On the client, the launcher installs the archive into the selected DayZ game directory under those same `@FolderName` directories before joining.

After changing `servers.json`, deploy the site so launchers receive the updated server requirements.
