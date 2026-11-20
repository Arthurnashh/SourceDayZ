# SourceDayZ mods

Mod files are committed as normal folder structures. Binary `.pbo` files use Git LFS; do not package the mod as ZIP, 7z, or RAR.

`@Helicopteros/Addons` contains the PBOs. `@Helicopteros/manifest.json` lists their relative paths, sizes, SHA-256 hashes, and GitHub LFS object paths for the launcher. Use the manifest's `raw.githubusercontent.com` URL with the full commit SHA so a published Workshop version stays pinned to the exact files that were reviewed.
