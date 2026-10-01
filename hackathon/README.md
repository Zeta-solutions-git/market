# Hackathon challenge folders (temporary)

`hackathon.json` drives the challenge folders at the top of the catalogue
(`/search`) and the "Challenge N" label on asset cards. It is mounted into the
market container (`./hackathon:/app/hackathon:ro` in docker-compose.yml) and
read by `/api/hackathon` on each request (10 s cache), so edits are live
without a rebuild or restart.

- `datasets`: list of asset DIDs (`did:ope:…`, copy from the asset page URL).
- `match`: parts of asset names (case-insensitive), e.g. `"Rijnland"`; newly
  published assets appear by themselves. Only assets from `publishers` count.
- `links`: external pages (`title`, `url` https only, `description`) shown as
  cards inside the folder that open the page in a new tab.
  An asset may appear in more than one challenge.
- `description`: optional one-liner shown in the folder view.

Turn off: set `"enabled": false` or delete `hackathon.json`.
Remove completely: delete this folder, the volume line in docker-compose.yml,
and revert the "Hackathon challenge folders" commit.
