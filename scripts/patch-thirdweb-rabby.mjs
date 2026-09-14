import fs from 'fs';
import path from 'path';

const patches = [
  {
    name: 'Rabby',
    files: [
      'node_modules/thirdweb/dist/esm/wallets/__generated__/wallet/io.rabby/index.js',
      'node_modules/thirdweb/dist/cjs/wallets/__generated__/wallet/io.rabby/index.js',
      'node_modules/thirdweb/src/wallets/__generated__/wallet/io.rabby/index.ts',
    ],
    native: 'rabby://',
    universal: 'https://link.rabby.io',
  },
  {
    name: 'Phantom',
    files: [
      'node_modules/thirdweb/dist/esm/wallets/__generated__/wallet/app.phantom/index.js',
      'node_modules/thirdweb/dist/cjs/wallets/__generated__/wallet/app.phantom/index.js',
      'node_modules/thirdweb/src/wallets/__generated__/wallet/app.phantom/index.ts',
    ],
    native: 'phantom://',
    universal: 'https://phantom.app/ul/v1/connect',
  },
];

for (const patch of patches) {
  for (const relPath of patch.files) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('native: null') && content.includes('universal: null')) {
        content = content.replace(
          /native:\s*null,\s*universal:\s*null/,
          `native: "${patch.native}",\n        universal: "${patch.universal}"`
        );
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Patched ${patch.name} mobile deep link in: ${relPath}`);
      } else {
        console.log(`ℹ️ ${patch.name} mobile already configured in: ${relPath}`);
      }
    }
  }
}
