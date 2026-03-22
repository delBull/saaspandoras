import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'packages/db/package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.main = './dist/index.js';
pkg.module = './dist/index.mjs';
pkg.types = './dist/index.d.ts';

const newExports = {};

for (const [key, value] of Object.entries(pkg.exports)) {
  const baseName = value.split('/').pop().replace('.tsx', '').replace('.ts', '').replace('.mjs', '');
  newExports[key] = {
    import: `./dist/${baseName}.mjs`,
    require: `./dist/${baseName}.js`,
    types: `./dist/${baseName}.d.ts`,
  };
}

pkg.exports = newExports;

pkg.scripts.build = "tsup index.ts --format esm,cjs --dts --clean";
pkg.scripts.dev = "tsup index.ts --format esm,cjs --watch";

fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
console.log('Updated package.json exports for @saasfly/db!');
