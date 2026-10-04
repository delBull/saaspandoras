import { Project } from 'ts-morph';
import * as path from 'path';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

const srcDir = path.join(__dirname, 'src');
const indexFile = path.join(srcDir, 'index.ts');

console.log('Building symbol map...');
const symbolMap = new Map<string, string>(); // symbolName -> full file path
const duplicateSymbols = new Set<string>();

project.getSourceFiles().forEach(file => {
    const filePath = file.getFilePath();
    if (filePath === indexFile || filePath.endsWith('.test.ts')) return;

    file.getExportedDeclarations().forEach((decls, name) => {
        if (duplicateSymbols.has(name)) return;
        if (symbolMap.has(name)) {
            duplicateSymbols.add(name);
            symbolMap.delete(name);
            console.log(`Duplicate symbol: ${name}`);
        } else {
            symbolMap.set(name, filePath);
        }
    });
});

console.log('Fixing imports...');
let filesChanged = 0;
project.getSourceFiles().forEach(file => {
    const filePath = file.getFilePath();
    if (filePath === indexFile) return;
    let changed = false;
    
    const imports = file.getImportDeclarations();
    for (const imp of imports) {
        const mod = imp.getModuleSpecifierValue();
        
        let isRootImport = false;
        if (mod === '@saasfly/hermes-core') {
            isRootImport = true;
        } else if (mod.startsWith('.')) {
            // resolve relative
            const resolved = path.resolve(path.dirname(filePath), mod);
            if (resolved === srcDir || resolved === indexFile || resolved === srcDir + '/index') {
                isRootImport = true;
            }
        }
        
        if (isRootImport) {
            const namedImports = imp.getNamedImports();
            const newImports = new Map<string, string[]>(); // targetFilePath -> [symbols]
            let allResolved = true;
            
            for (const named of namedImports) {
                const name = named.getName();
                const targetFile = symbolMap.get(name);
                if (targetFile) {
                    if (!newImports.has(targetFile)) newImports.set(targetFile, []);
                    newImports.get(targetFile)!.push(name);
                } else {
                    console.log(`Warning: Symbol ${name} not found uniquely for ${filePath}`);
                    allResolved = false;
                }
            }
            
            if (allResolved && namedImports.length > 0) {
                imp.remove();
                for (const [targetFile, symbols] of newImports.entries()) {
                    let rel = path.relative(path.dirname(filePath), targetFile).replace(/\\/g, '/');
                    rel = rel.replace(/\.tsx?$/, '');
                    if (!rel.startsWith('.')) rel = './' + rel;
                    
                    file.addImportDeclaration({
                        namedImports: symbols,
                        moduleSpecifier: rel
                    });
                }
                changed = true;
            }
        }
    }
    if (changed) {
        file.saveSync();
        filesChanged++;
    }
});
console.log(`Fixed ${filesChanged} files.`);
