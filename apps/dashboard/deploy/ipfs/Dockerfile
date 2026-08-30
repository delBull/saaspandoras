# 🌐 Pandora's Sovereign IPFS Stack — Railway / Cloud Container
FROM ipfs/kubo:v0.26.0 AS kubo_bin
FROM caddy:2 AS caddy_bin

FROM debian:bookworm-slim

# Install system utilities (glibc native, bash, curl, ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Kubo IPFS and Caddy binaries
COPY --from=kubo_bin /usr/local/bin/ipfs /usr/local/bin/ipfs
COPY --from=caddy_bin /usr/bin/caddy /usr/bin/caddy

WORKDIR /app

# Copy Caddy configuration and unified startup entrypoint
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint-railway.sh /app/entrypoint-railway.sh
RUN chmod +x /app/entrypoint-railway.sh

ENV IPFS_PATH=/data/ipfs

EXPOSE 8080 80 443 5001

ENTRYPOINT ["/app/entrypoint-railway.sh"]
