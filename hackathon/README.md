# Hackathon challenge folders (temporary)

`hackathon.json` drives the challenge folders at the top of the catalogue
(`/search`) and the "Challenge N" label on asset cards. It is mounted into the
market container (`./hackathon:/app/hackathon:ro` in docker-compose.yml) and
read by `/api/hackathon` on each request (10 s cache), so edits are live
without a rebuild or restart.

- `datasets`: list of asset DIDs (`did:ope:…`, copy from the asset page URL).
  A DID may appear in more than one challenge.
- `description`: optional one-liner shown in the folder view.

Turn off: set `"enabled": false` or delete `hackathon.json`.
Remove completely: delete this folder, the volume line in docker-compose.yml,
and revert the "Hackathon challenge folders" commit.
