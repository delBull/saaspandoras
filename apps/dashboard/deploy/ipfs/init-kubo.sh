#!/usr/bin/env bash
set -euo pipefail

echo "========================================================="
echo "🌐 Initializing Pandora's Sovereign Kubo Node Configuration"
echo "========================================================="

IPFS_DATA_DIR="./data/ipfs_data"
mkdir -p "${IPFS_DATA_DIR}" "./data/ipfs_export" "./data/caddy_data" "./data/caddy_config"

# Initialize IPFS Repo with Server Profile if not initialized
if [ ! -f "${IPFS_DATA_DIR}/config" ]; then
    echo "📦 Initializing Kubo IPFS repo with 'server' profile..."
    docker run --rm \
        -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
        ipfs/kubo:v0.26.0 init --profile server
fi

# Apply Sovereign Invariant Configurations
echo "🔒 Applying Pandora's Sovereign IPFS Configurations..."

# 1. Gateway.NoFetch = true (Serve ONLY local pinned content)
docker run --rm \
    -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
    ipfs/kubo:v0.26.0 config --json Gateway.NoFetch true

# 2. Configure Storage GC Watermarks
docker run --rm \
    -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
    ipfs/kubo:v0.26.0 config --json Datastore.StorageMax '"100GB"'

docker run --rm \
    -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
    ipfs/kubo:v0.26.0 config --json Datastore.StorageGCWatermark 90

# 3. Restrict Gateway and API binding to all interfaces inside container (Compose will isolate to loopback)
docker run --rm \
    -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
    ipfs/kubo:v0.26.0 config Addresses.API '/ip4/0.0.0.0/tcp/5001'

docker run --rm \
    -v "${PWD}/${IPFS_DATA_DIR}:/data/ipfs" \
    ipfs/kubo:v0.26.0 config Addresses.Gateway '/ip4/0.0.0.0/tcp/8080'

echo "✅ Pandora's Kubo Node initialized successfully with Gateway.NoFetch=true."
echo "🚀 Run 'docker compose up -d' to start the Sovereign IPFS daemon."
