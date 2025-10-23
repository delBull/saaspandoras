const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to find all files with @saasfly/ui imports
function findFilesWithImports() {
  try {
    const result = execSync('grep -r "from.*@saasfly/ui" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".next" | grep -v "dist"', { encoding: 'utf8' });
    return result.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.log('No files found with @saasfly/ui imports');
    return [];
  }
}

// Function to get the correct cn import path for each file
function getCorrectCnImport(filePath) {
  if (filePath.includes('apps/nextjs')) {
    return '~/lib/utils';
  } else if (filePath.includes('packages/gamification')) {
    return '../utils/cn';
  } else if (filePath.includes('apps/dashboard')) {
    return '@/lib/utils';
  } else {
    return '@/lib/utils'; // default fallback
  }
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  console.log(`Processing: ${filePath}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix cn imports from @saasfly/ui
  if (content.includes('import { cn } from "@saasfly/ui"')) {
    const correctPath = getCorrectCnImport(filePath);
    content = content.replace(
      'import { cn } from "@saasfly/ui"',
      `import { cn } from "${correctPath}"`
    );
    modified = true;
    console.log(`  - Fixed cn import`);
  }

  // Fix cn imports from @saasfly/ui with semicolon
  if (content.includes('import { cn } from "@saasfly/ui";')) {
    const correctPath = getCorrectCnImport(filePath);
    content = content.replace(
      'import { cn } from "@saasfly/ui";',
      `import { cn } from "${correctPath}";`
    );
    modified = true;
    console.log(`  - Fixed cn import with semicolon`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`  - Saved changes`);
  }
}

// Main execution
console.log('Starting import fixes...\n');

const files = findFilesWithImports();
console.log(`Found ${files.length} files with @saasfly/ui imports\n`);

files.forEach(file => {
  const filePath = file.split(':')[0];
  fixImportsInFile(filePath);
});

console.log('\nImport fixes completed!');
