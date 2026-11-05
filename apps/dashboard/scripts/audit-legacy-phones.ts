/**
 * Auditoría READ-ONLY de teléfonos de colaboradores de Nexus.
 *
 * Motivo: antes de la normalización canónica se guardaron números sin código de
 * país (p. ej. `3324158568`, `612345678`). Normalizarlos automáticamente exige
 * ADIVINAR el país, que es exactamente el defecto que se eliminó. Por eso este
 * script NO escribe nada: sólo clasifica y sugiere, para que una persona decida.
 *
 * Uso:
 *   bun apps/dashboard/scripts/audit-legacy-phones.ts
 *   bun apps/dashboard/scripts/audit-legacy-phones.ts --json
 *
 * Salida: resumen + lista de filas que requieren recaptura manual.
 */
import { db } from '@saasfly/db';
import { nexusCollaborators } from '@saasfly/db/schema';
import { isNotNull } from '@saasfly/db-core';
import { isE164Phone, normalizePhoneE164, NEXUS_DEFAULT_PHONE_COUNTRY_CODE } from '@saasfly/shared/nexus-phone';

type Verdict = 'CANONICAL' | 'ASSUMED_MX' | 'AMBIGUOUS' | 'INVALID';

interface Row {
  id: number;
  email: string | null;
  name: string | null;
  whatsappPhone: string;
  verdict: Verdict;
  suggestion: string | null;
}

function classify(raw: string): { verdict: Verdict; suggestion: string | null } {
  if (isE164Phone(raw)) return { verdict: 'CANONICAL', suggestion: null };

  const normalized = normalizePhoneE164(raw, {
    defaultCountryCode: NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  });

  if (normalized.ok) {
    // Se puede normalizar SOLO porque el valor tiene exactamente la longitud
    // nacional de México; aun así requiere confirmación humana.
    return { verdict: 'ASSUMED_MX', suggestion: normalized.value };
  }

  return {
    verdict: normalized.reason === 'AMBIGUOUS_COUNTRY_CODE' ? 'AMBIGUOUS' : 'INVALID',
    suggestion: null,
  };
}

async function main() {
  const rows = await db
    .select({
      id: nexusCollaborators.id,
      email: nexusCollaborators.email,
      name: nexusCollaborators.name,
      whatsappPhone: nexusCollaborators.whatsappPhone,
    })
    .from(nexusCollaborators)
    .where(isNotNull(nexusCollaborators.whatsappPhone));

  const classified: Row[] = rows
    .filter((r): r is typeof r & { whatsappPhone: string } => typeof r.whatsappPhone === 'string')
    .map((r) => {
      const { verdict, suggestion } = classify(r.whatsappPhone);
      return {
        id: r.id,
        email: r.email ?? null,
        name: r.name ?? null,
        whatsappPhone: r.whatsappPhone,
        verdict,
        suggestion,
      };
    });

  const summary = classified.reduce<Record<string, number>>((acc, row) => {
    acc[row.verdict] = (acc[row.verdict] ?? 0) + 1;
    return acc;
  }, {});

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows: classified }, null, 2));
    return;
  }

  console.log(`\nAuditoría de teléfonos — ${classified.length} filas con número`);
  console.log(`  CANONICAL   (E.164, sin acción):      ${summary.CANONICAL ?? 0}`);
  console.log(`  ASSUMED_MX  (10 dígitos, confirmar):  ${summary.ASSUMED_MX ?? 0}`);
  console.log(`  AMBIGUOUS   (sin país, recapturar):   ${summary.AMBIGUOUS ?? 0}`);
  console.log(`  INVALID     (formato roto):           ${summary.INVALID ?? 0}\n`);

  const requiresAction = classified.filter((r) => r.verdict !== 'CANONICAL');
  if (requiresAction.length === 0) {
    console.log('Todos los números están en E.164 canónico. Nada que corregir.\n');
    return;
  }

  console.table(
    requiresAction.map((r) => ({
      id: r.id,
      email: r.email ?? '—',
      guardado: r.whatsappPhone,
      veredicto: r.verdict,
      sugerencia: r.suggestion ?? 'pedir al operador que lo recapture',
    }))
  );

  console.log(
    '\nEste script NO modifica la base. Para cada fila: confirmar el país con el operador y actualizar por la UI o por un script puntual.\n'
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('[audit-legacy-phones] failed:', error);
    process.exit(1);
  });
