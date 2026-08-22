import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL env var is required.');
  console.error('Usage: DATABASE_URL="postgresql://..." bun run scripts/reset-pablo-suite.mjs');
  process.exit(1);
}
const sql = neon(DATABASE_URL);

async function main() {
  // 1. Find Pablo
  console.log('\n=== 1. Buscando candidato pablosegali@gmail.com ===');
  const candidates = await sql`
    SELECT id, name, email, target_role, attendance_status, created_at
    FROM academy_candidates
    WHERE email = 'pablosegali@gmail.com'
  `;
  console.log('Candidatos encontrados:', JSON.stringify(candidates, null, 2));

  if (candidates.length === 0) {
    console.log('No se encontro ningun candidato con ese correo.');
    return;
  }

  const pablo = candidates[0];
  console.log(`Candidato encontrado: ${pablo.name} (ID: ${pablo.id})`);

  // 2. Show existing invitations
  console.log('\n=== 2. Invitaciones actuales ===');
  const invitations = await sql`
    SELECT token, status, expires_at, created_at
    FROM academy_invitations
    WHERE candidate_id = ${pablo.id}
    ORDER BY created_at DESC
  `;
  console.log('Invitaciones:', JSON.stringify(invitations, null, 2));

  // 3. Revoke all existing invitations
  console.log('\n=== 3. Revocando invitaciones anteriores ===');
  const revoked = await sql`
    UPDATE academy_invitations
    SET status = 'REVOKED'
    WHERE candidate_id = ${pablo.id} AND status = 'PENDING'
    RETURNING token
  `;
  console.log(`Revocadas: ${revoked.length} invitaciones`, revoked.map(r => r.token));

  // 4. Reset candidate to INVITED status + update target_role to ALL_TRACKS
  console.log('\n=== 4. Reseteando candidato a INVITED y target_role = ALL_TRACKS ===');
  await sql`
    UPDATE academy_candidates
    SET attendance_status = 'INVITED',
        target_role = 'ALL_TRACKS',
        updated_at = NOW()
    WHERE id = ${pablo.id}
  `;
  console.log('Candidato reseteado.');

  // 5. Generate 4 new suite invitations
  console.log('\n=== 5. Generando 4 nuevas invitaciones de Suite Ejecutiva ===');
  const SUITE_TRACKS = ['COO', 'CMO', 'CFO', 'HERMES_OPERATOR'];
  const suiteTokens = {};
  const expiresAt = new Date(Date.now() + 30 * 86400000); // 30 dias

  for (const track of SUITE_TRACKS) {
    const token = `inv_${crypto.createHash('sha256').update(`${pablo.id}_${track}_${Date.now()}_${Math.random()}`).digest('hex').substring(0, 16)}`;
    suiteTokens[track] = token;

    await sql`
      INSERT INTO academy_invitations (token, candidate_id, status, expires_at)
      VALUES (${token}, ${pablo.id}, 'PENDING', ${expiresAt})
    `;
    console.log(`  OK ${track}: ${token}`);
  }

  console.log('\n=== SUITE EJECUTIVA COMPLETA GENERADA ===');
  console.log(`\nEnlace de entrada (COO Track primer test):`);
  console.log(`  https://dash.pandoras.finance/academy/assessment/${suiteTokens['COO']}`);
  console.log(`\nTodos los tokens de la suite:`);
  for (const [track, token] of Object.entries(suiteTokens)) {
    console.log(`  ${track}: https://dash.pandoras.finance/academy/assessment/${token}`);
  }
}

main().catch(console.error);
