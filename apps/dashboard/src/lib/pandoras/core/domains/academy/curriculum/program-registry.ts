/**
 * 🎓 Pandora's Academy — Program Registry
 * Central single source of truth for all active Academy certification programs.
 */

import { AcademyProgram } from '../types';
import { COO_EXECUTIVE_PROGRAM } from './coo-program';
import { CMO_EXECUTIVE_PROGRAM } from './cmo-program';
import { CFO_EXECUTIVE_PROGRAM } from './cfo-program';
import { HERMES_OPERATOR_PROGRAM } from './hermes-operator-program';

export const ALL_ACADEMY_PROGRAMS: AcademyProgram[] = [
  COO_EXECUTIVE_PROGRAM,
  CMO_EXECUTIVE_PROGRAM,
  CFO_EXECUTIVE_PROGRAM,
  HERMES_OPERATOR_PROGRAM,
];

export function getProgramByRoleOrId(roleOrId?: string): AcademyProgram {
  if (!roleOrId) return COO_EXECUTIVE_PROGRAM;

  const normalized = roleOrId.trim().toUpperCase();

  // Match by Program ID
  const byId = ALL_ACADEMY_PROGRAMS.find(p => p.id.toUpperCase() === normalized || p.code.toUpperCase() === normalized);
  if (byId) return byId;

  // Match by Target Role
  if (normalized === 'COO' || normalized.includes('OPERAT')) {
    return COO_EXECUTIVE_PROGRAM;
  }
  if (normalized === 'CMO' || normalized.includes('MARKET') || normalized.includes('DEMAND')) {
    return CMO_EXECUTIVE_PROGRAM;
  }
  if (normalized === 'CFO' || normalized.includes('FINAN') || normalized.includes('CAPITAL')) {
    return CFO_EXECUTIVE_PROGRAM;
  }
  if (normalized === 'HERMES_OPERATOR' || normalized.includes('HERMES') || normalized.includes('AI_OPERATOR')) {
    return HERMES_OPERATOR_PROGRAM;
  }

  // Default fallback
  return COO_EXECUTIVE_PROGRAM;
}
