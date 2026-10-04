import { Project } from 'ts-morph';
import * as path from 'path';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const indexFile = project.getSourceFileOrThrow('src/index.ts');

const exportedSymbols = new Set<string>();

const exportDecls = indexFile.getExportDeclarations();
for (const exp of exportDecls) {
    if (exp.isModuleSpecifierRelative()) {
        const namedExports = exp.getNamedExports();
        for (const named of namedExports) {
            const name = named.getName();
            if (exportedSymbols.has(name)) {
                named.remove();
            } else {
                exportedSymbols.add(name);
            }
        }
        if (exp.getNamedExports().length === 0) {
            exp.remove();
        }
    }
}
indexFile.saveSync();
console.log('Fixed index.ts duplicate exports.');
