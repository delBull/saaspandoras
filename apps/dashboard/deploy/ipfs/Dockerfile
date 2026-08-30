# 🌐 Pandora's Sovereign IPFS Stack — Railway / Cloud Container
FROM ipfs/kubo:v0.26.0 AS kubo_bin

FROM caddy:2-alpine

# Copy Kubo IPFS binary from official image
COPY --from=kubo_bin /usr/local/bin/ipfs /usr/local/bin/ipfs

# Install bash, curl, ca-certificates
RUN apk add --no-cache bash curl ca-certificates

WORKDIR /app

# Copy Caddy configuration and unified startup entrypoint
COPY Caddyfile /etc/caddy/Caddyfile
COPY entrypoint-railway.sh /app/entrypoint-railway.sh
RUN chmod +x /app/entrypoint-railway.sh

ENV IPFS_PATH=/data/ipfs
VOLUME /data/ipfs

EXPOSE 80 443 4001 5001 8080

ENTRYPOINT ["/app/entrypoint-railway.sh"]
