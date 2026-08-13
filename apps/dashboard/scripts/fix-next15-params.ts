import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/app/api/nexus/deals/[id]/route.ts',
  'src/app/api/nexus/deals/[id]/share/route.ts',
  'src/app/api/public/deals/[publicId]/magic/route.ts',
  'src/app/api/public/deals/[publicId]/route.ts',
  'src/app/api/public/deals/[publicId]/sign/route.ts',
];

for (const file of files) {
  const p = join(process.cwd(), file);
  let content = readFileSync(p, 'utf-8');
  content = content.replace(/\{ params \}: \{ params: \{ ([a-zA-Z]+): string \} \}/g, '{ params }: { params: Promise<{ $1: string }> }');
  
  // also need to await params
  content = content.replace(/params\.id/g, '(await params).id');
  content = content.replace(/params\.publicId/g, '(await params).publicId');
  
  writeFileSync(p, content, 'utf-8');
  console.log('Fixed', file);
}
