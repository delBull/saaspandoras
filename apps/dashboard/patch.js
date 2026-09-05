const fs = require('fs');
const file = 'src/app/api/admin/projects/[slug]/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace the auth check in PUT
const oldAuth = `export async function PUT(request: Request, { params }: RouteParams) {
  const { session } = await getAuth(await headers());

  // Check if user is admin using either userId or address
  const userIsAdmin = await isAdmin(session?.address) ||
    await isAdmin(session?.address);

  if (!userIsAdmin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }`;

const newAuth = `import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";

export async function PUT(request: Request, { params }: RouteParams) {
  const reqHeaders = await headers();
  const auth = await getNexusAuthContext(reqHeaders);
  
  const isSuperAdmin = auth.role === 'SUPER_ADMIN';
  const isAdminRole = auth.role === 'ADMIN';
  
  if (!auth.isAuthenticated || (!isSuperAdmin && !isAdminRole)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }
  
  const isDiscord2faVerified = isSuperAdmin; // 2FA is simulated as true only for SUPER_ADMIN
`;

content = content.replace(oldAuth, newAuth);

// Now protect critical fields
// Add 'status' to the allowed update fields and require 2FA for it and other critical fields.
const oldFields = `    // Sección 3: Tokenomics (Decimals as Strings)
    if ('targetAmount' in rawBody) updateSet.targetAmount = data.targetAmount.toString();
    if ('totalValuationUsd' in rawBody) updateSet.totalValuationUsd = data.totalValuationUsd?.toString() ?? null;
    if ('tokenPriceUsd' in rawBody) updateSet.tokenPriceUsd = data.tokenPriceUsd?.toString() ?? null;

    // Integers as Numbers
    if ('totalTokens' in rawBody) updateSet.totalTokens = data.totalTokens ?? null;
    if ('tokensOffered' in rawBody) updateSet.tokensOffered = data.tokensOffered ?? null;`;

const newFields = `    // Verificar 2FA para campos críticos (Tokenomics, Status)
    const hasCriticalChanges = 
      ('targetAmount' in rawBody && data.targetAmount.toString() !== existingProject.targetAmount) ||
      ('totalTokens' in rawBody && data.totalTokens !== existingProject.totalTokens) ||
      ('tokensOffered' in rawBody && data.tokensOffered !== existingProject.tokensOffered) ||
      ('status' in rawBody && rawBody.status !== existingProject.status);

    if (hasCriticalChanges && !isDiscord2faVerified) {
      return NextResponse.json(
        { message: "Cambios en tokenomics o estado requieren verificación 2FA (SUPER_ADMIN)." },
        { status: 403 }
      );
    }

    // Status
    if ('status' in rawBody) updateSet.status = rawBody.status;

    // Sección 3: Tokenomics (Decimals as Strings)
    if ('targetAmount' in rawBody) updateSet.targetAmount = data.targetAmount.toString();
    if ('totalValuationUsd' in rawBody) updateSet.totalValuationUsd = data.totalValuationUsd?.toString() ?? null;
    if ('tokenPriceUsd' in rawBody) updateSet.tokenPriceUsd = data.tokenPriceUsd?.toString() ?? null;

    // Integers as Numbers
    if ('totalTokens' in rawBody) updateSet.totalTokens = data.totalTokens ?? null;
    if ('tokensOffered' in rawBody) updateSet.tokensOffered = data.tokensOffered ?? null;`;

content = content.replace(oldFields, newFields);

fs.writeFileSync(file, content);
