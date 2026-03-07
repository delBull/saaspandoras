const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.resolve(__dirname, '../src/artifacts');

if (!fs.existsSync(ARTIFACTS_DIR)) {
    console.log("Artifacts directory not found, skipping prune.");
    process.exit(0);
}

const files = fs.readdirSync(ARTIFACTS_DIR).filter(f => f.endsWith('.json'));

console.log(`Pruning ${files.length} artifacts in ${ARTIFACTS_DIR}...`);

files.forEach(file => {
    const filePath = path.join(ARTIFACTS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const pruned = {
        _format: "hh-sol-artifact-1",
        contractName: content.contractName,
        sourceName: content.sourceName,
        abi: content.abi,
        bytecode: content.bytecode,
        deployedBytecode: content.deployedBytecode,
        linkReferences: content.linkReferences,
        deployedLinkReferences: content.deployedLinkReferences
    };

    const originalSize = fs.statSync(filePath).size;
    fs.writeFileSync(filePath, JSON.stringify(pruned, null, 2));
    const newSize = fs.statSync(filePath).size;

    console.log(`✅ Pruned ${file}: ${(originalSize / 1024).toFixed(2)}kb -> ${(newSize / 1024).toFixed(2)}kb`);
});
