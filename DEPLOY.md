# Deploying this marketplace

This is a fork of the Ocean Enterprise marketplace (Next.js). It runs as one
Docker container. All configuration comes from a `.env` file that is read when
the container starts, so you build the image once and point it at your own
services through `.env`.

## What you need

- A Linux server with Docker and the Docker Compose plugin.
- A domain with a TLS reverse proxy in front (nginx, Caddy, …). The container
  listens on `127.0.0.1:8008` only.
- An **Ocean Enterprise node** reachable over HTTPS (for the catalogue,
  publishing and downloads).
- An **RPC URL** for the chain (default: Sepolia, chain id `11155111`), e.g.
  from Alchemy or Infura. This stays server-side and is never shown to browsers.
- An **IPFS** pinning service (gateway, upload/delete URLs, JWT).
- Optional: an SSI stack (policy server, wallet, OPA) and an OIDC provider
  (e.g. Authentik) for login. Without them, set `NEXT_PUBLIC_SSI_ENABLED=false`
  and `NEXT_PUBLIC_AUTH_ENABLED=false`.

## Steps

```bash
git clone -b feat/ux-ui https://github.com/Zeta-solutions-git/market.git
cd market
cp .env.template .env
chmod 600 .env
# edit .env: fill in every _FILL_ME_ and replace example.com with your domains
./deploy.sh            # builds the image (a few minutes) and starts it
```

To change the config later, edit `.env` and run `docker compose up -d
--force-recreate`. You don't need to rebuild. To update the code, run `git pull` and then `./deploy.sh`.

## Reverse proxy (nginx example)

```nginx
map $http_upgrade $connection_upgrade { default upgrade; '' close; }

server {
    listen 443 ssl;
    server_name market.example.com;
    ssl_certificate     /etc/letsencrypt/live/market.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/market.example.com/privkey.pem;

    proxy_buffer_size 32k;
    proxy_buffers 8 32k;
    proxy_busy_buffers_size 64k;

    location / {
        proxy_pass http://127.0.0.1:8008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Notes

- Never commit `.env`. It is in `.gitignore`, and `.dockerignore` keeps it out of the
  image.
- Every `NEXT_PUBLIC_*` value is sent to the browser, so never put a secret
  in one (for example, a keyed RPC URL belongs in `RPC_URL_MAP`).
- If you turn on login, also set the `NEXT_PUBLIC_OIDC_*` values and
  `OIDC_CLIENT_SECRET`. These are commented out in `.env.template`.
- Hackathon challenge folders are optional; see `hackathon/README.md`.
