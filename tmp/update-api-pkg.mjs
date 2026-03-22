import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'packages/api/package.json');
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.main = './dist/index.js';
pkg.module = './dist/index.mjs';
pkg.types = './dist/index.d.ts';

const newExports = {};
const entriesToBuild = [];

for (const [key, value] of Object.entries(pkg.exports)) {
  const absolutePath = path.join(process.cwd(), 'packages/api', value);
  if (fs.existsSync(absolutePath)) {
    const baseName = value.split('/').pop().replace('.tsx', '').replace('.ts', '').replace('.mjs', '');
    newExports[key] = {
      import: `./dist/${baseName}.mjs`,
      require: `./dist/${baseName}.js`,
      types: `./dist/${baseName}.d.ts`,
    };
    entriesToBuild.push(value.replace('./', ''));
  } else {
    console.log(`Removing phantom export: ${key} -> ${value}`);
  }
}

pkg.exports = newExports;
const entriesJoined = entriesToBuild.join(' ');

pkg.scripts.build = `tsup ${entriesJoined} --format esm,cjs --dts --clean`;
pkg.scripts.dev = `tsup ${entriesJoined} --format esm,cjs --watch`;

fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
console.log('Updated package.json exports for @saasfly/api!');
