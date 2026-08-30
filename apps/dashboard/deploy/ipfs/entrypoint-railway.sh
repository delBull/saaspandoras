#!/usr/bin/env bash
set -euo pipefail

echo "========================================================="
echo "🌐 Starting Pandora's Sovereign IPFS Node (Railway/Production)"
echo "========================================================="

export IPFS_PATH="${IPFS_PATH:-/data/ipfs}"
mkdir -p "${IPFS_PATH}" /data/caddy_data /data/caddy_config

# 1. Initialize IPFS repository if not present
if [ ! -f "${IPFS_PATH}/config" ]; then
    echo "📦 Initializing Kubo IPFS repo with 'server' profile..."
    ipfs init --profile server
fi

echo "🔒 Applying Pandora's Sovereign IPFS Configurations..."
ipfs config --json Gateway.NoFetch true
ipfs config --json Datastore.StorageMax '"100GB"'
ipfs config --json Datastore.StorageGCWatermark 90
ipfs config Addresses.API '/ip4/127.0.0.1/tcp/5001'
ipfs config Addresses.Gateway '/ip4/127.0.0.1/tcp/8082'

# 2. Start Kubo daemon in the background
echo "🚀 Starting Kubo IPFS Daemon..."
ipfs daemon --migrate=true &
KUBO_PID=$!

# 3. Wait for Kubo RPC to be ready on loopback
echo "⏳ Waiting for Kubo RPC to be ready..."
for i in {1..30}; do
    if curl -s -X POST http://127.0.0.1:5001/api/v0/version > /dev/null 2>&1; then
        echo "✅ Kubo RPC is ready and healthy!"
        break
    fi
    sleep 1
done

# 4. Start Caddy Reverse Proxy in the foreground
echo "🔒 Starting Caddy TLS & Auth Reverse Proxy on ports 80/443..."
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
