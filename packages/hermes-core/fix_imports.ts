import { Project, SyntaxKind } from 'ts-morph';
const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

for (const file of project.getSourceFiles()) {
    let changed = false;
    for (const imp of file.getImportDeclarations()) {
        const mod = imp.getModuleSpecifierValue();
        if (mod.startsWith('@/lib/') || mod.includes('pandoras/core')) {
            imp.setModuleSpecifier(mod + ' /* BROKEN_IMPORT */');
            changed = true;
        }
    }
    if (changed) file.saveSync();
}
