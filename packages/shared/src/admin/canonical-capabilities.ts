/**
 * Canonical Capabilities for Pandora's RBAC System
 * This file is safe to import in Client Components
 */

export const CANONICAL_CAPABILITIES = [
  { id: 'users.manage', label: 'Gestión de Usuarios (users.manage)' },
  { id: 'tenants.manage', label: 'Gestión de Tenants (tenants.manage)' },
  { id: 'finance.manage', label: 'Gestión Financiera (finance.manage)' },
  { id: 'growth.manage', label: 'Gestión de Growth OS (growth.manage)' },
  { id: 'marketing.manage', label: 'Gestión de Marketing (marketing.manage)' },
  { id: 'nexus.manage', label: 'Configuración Nexus (nexus.manage)' },
  { id: 'ecosystem', label: 'Acceso a Ecosistema (ecosystem)' },
] as const;
