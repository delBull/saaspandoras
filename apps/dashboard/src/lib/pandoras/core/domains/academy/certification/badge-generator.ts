/**
 * 🎖️ Pandora's Academy — Soulbound Badge SVG Generator
 * apps/dashboard/src/lib/pandoras/core/domains/academy/certification/badge-generator.ts
 *
 * Generates dynamic, high-fidelity Soulbound SVG credentials with holographic borders,
 * role-specific insignia emblems, score badges, and cryptographic SHA-256 seals.
 */

export interface BadgeParams {
  certId: string;
  candidateName: string;
  targetRole: 'COO' | 'CMO' | 'CFO' | 'HERMES_OPERATOR' | string;
  programTitle: string;
  readinessScore: number;
  certifiedAt: string;
  validUntil: string;
  certificateHash: string;
}

interface RoleTheme {
  primaryColor: string;
  secondaryColor: string;
  accentGlow: string;
  roleTitle: string;
  clearanceLevel: string;
  emblemPath: string;
}

const ROLE_THEMES: Record<string, RoleTheme> = {
  COO: {
    primaryColor: '#A855F7',
    secondaryColor: '#7C3AED',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
    roleTitle: 'CHIEF OPERATING OFFICER',
    clearanceLevel: 'TIER 1 · EXECUTIVE CLEARANCE',
    emblemPath: `
      <polygon points="250,110 310,145 310,215 250,250 190,215 190,145" fill="none" stroke="#A855F7" stroke-width="4" stroke-dasharray="6,4" />
      <polygon points="250,125 295,152 295,208 250,235 205,208 205,152" fill="url(#purpleGrad)" opacity="0.25" stroke="#D8B4FE" stroke-width="2" />
      <path d="M250,140 L275,170 L260,170 L270,205 L235,175 L250,175 Z" fill="#F3E8FF" />
      <circle cx="250" cy="180" r="45" fill="none" stroke="#A855F7" stroke-width="1.5" opacity="0.6" />
    `
  },
  CMO: {
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    roleTitle: 'CHIEF MARKETING OFFICER',
    clearanceLevel: 'TIER 2 · GROWTH CLEARANCE',
    emblemPath: `
      <circle cx="250" cy="180" r="60" fill="none" stroke="#10B981" stroke-width="3" stroke-dasharray="8,4" />
      <circle cx="250" cy="180" r="45" fill="url(#greenGrad)" opacity="0.25" stroke="#6EE7B7" stroke-width="2" />
      <path d="M230,205 L250,150 L270,205 L250,190 Z" fill="#ECFDF5" />
      <polyline points="220,195 240,165 260,175 280,145" fill="none" stroke="#34D399" stroke-width="3" />
    `
  },
  CFO: {
    primaryColor: '#F59E0B',
    secondaryColor: '#D97706',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    roleTitle: 'CHIEF FINANCIAL OFFICER',
    clearanceLevel: 'TIER 1 · FINANCIAL CLEARANCE',
    emblemPath: `
      <rect x="195" y="125" width="110" height="110" rx="20" transform="rotate(45 250 180)" fill="none" stroke="#F59E0B" stroke-width="3" stroke-dasharray="6,4" />
      <rect x="205" y="135" width="90" height="90" rx="15" transform="rotate(45 250 180)" fill="url(#goldGrad)" opacity="0.25" stroke="#FDE68A" stroke-width="2" />
      <circle cx="250" cy="180" r="28" fill="none" stroke="#FBBF24" stroke-width="3" />
      <path d="M245,160 L255,160 M250,155 L250,205 M242,170 C242,165 258,165 258,175 C258,185 242,185 242,195 C242,205 258,205 258,200" fill="none" stroke="#FFFBEB" stroke-width="3" stroke-linecap="round" />
    `
  },
  HERMES_OPERATOR: {
    primaryColor: '#06B6D4',
    secondaryColor: '#0891B2',
    accentGlow: 'rgba(6, 182, 212, 0.4)',
    roleTitle: 'HERMES AI KERNEL OPERATOR',
    clearanceLevel: 'TIER 3 · TECHNICAL CLEARANCE',
    emblemPath: `
      <circle cx="250" cy="180" r="65" fill="none" stroke="#06B6D4" stroke-width="2" stroke-dasharray="4,6" />
      <polygon points="250,120 302,150 302,210 250,240 198,210 198,150" fill="url(#cyanGrad)" opacity="0.2" stroke="#67E8F9" stroke-width="2" />
      <circle cx="250" cy="180" r="22" fill="#0E7490" stroke="#22D3EE" stroke-width="3" />
      <circle cx="250" cy="180" r="8" fill="#ECFEFF" />
      <line x1="250" y1="120" x2="250" y2="158" stroke="#22D3EE" stroke-width="2" />
      <line x1="250" y1="202" x2="250" y2="240" stroke="#22D3EE" stroke-width="2" />
      <line x1="198" y1="180" x2="228" y2="180" stroke="#22D3EE" stroke-width="2" />
      <line x1="272" y1="180" x2="302" y2="180" stroke="#22D3EE" stroke-width="2" />
    `
  }
};

export function generateSoulboundSvg(params: BadgeParams): string {
  const role = (params.targetRole || 'COO').toUpperCase();
  const theme = ROLE_THEMES[role] || ROLE_THEMES.COO!;

  const formattedDate = new Date(params.certifiedAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  const formattedValid = new Date(params.validUntil).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).toUpperCase();

  const shortHash = params.certificateHash.substring(0, 16).toUpperCase();
  const scoreFormatted = params.readinessScore.toFixed(0);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700" width="500" height="700" style="background:#08080A; font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <!-- Gradients -->
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#121217" />
      <stop offset="50%" stop-color="#0A0A0D" />
      <stop offset="100%" stop-color="#050507" />
    </linearGradient>

    <linearGradient id="holoBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.primaryColor}" />
      <stop offset="25%" stop-color="#FFFFFF" stop-opacity="0.8" />
      <stop offset="50%" stop-color="${theme.secondaryColor}" />
      <stop offset="75%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="${theme.primaryColor}" />
    </linearGradient>

    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#6B21A8" />
    </linearGradient>

    <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#0E7490" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Glow & Shadow -->
  <rect x="25" y="25" width="450" height="650" rx="32" fill="${theme.accentGlow}" filter="url(#glow)" opacity="0.3" />
  
  <!-- Outer Card Frame -->
  <rect x="20" y="20" width="460" height="660" rx="28" fill="url(#cardBg)" stroke="url(#holoBorder)" stroke-width="2" />

  <!-- Holographic Watermark & Grid Background -->
  <g opacity="0.05">
    <line x1="40" y1="100" x2="460" y2="100" stroke="#FFFFFF" stroke-width="1" />
    <line x1="40" y1="200" x2="460" y2="200" stroke="#FFFFFF" stroke-width="1" />
    <line x1="40" y1="300" x2="460" y2="300" stroke="#FFFFFF" stroke-width="1" />
    <line x1="40" y1="400" x2="460" y2="400" stroke="#FFFFFF" stroke-width="1" />
    <line x1="40" y1="500" x2="460" y2="500" stroke="#FFFFFF" stroke-width="1" />
    <line x1="40" y1="600" x2="460" y2="600" stroke="#FFFFFF" stroke-width="1" />
    <circle cx="250" cy="350" r="180" fill="none" stroke="#FFFFFF" stroke-width="1" />
  </g>

  <!-- Top Banner Header -->
  <g transform="translate(45, 55)">
    <rect x="0" y="0" width="410" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.03" stroke="#FFFFFF" stroke-opacity="0.1" />
    <circle cx="16" cy="17" r="4" fill="${theme.primaryColor}" />
    <text x="30" y="21" fill="#A1A1AA" font-size="9.5" font-family="monospace" letter-spacing="2">PANDORA'S ACADEMY · SOULBOUND CREDENTIAL</text>
    <text x="390" y="21" text-anchor="end" fill="${theme.primaryColor}" font-size="9.5" font-family="monospace" font-weight="bold">ERC-5192</text>
  </g>

  <!-- Central Emblem Insignia -->
  <g>
    ${theme.emblemPath}
  </g>

  <!-- Clearance Badge & Title -->
  <g transform="translate(250, 290)">
    <rect x="-120" y="0" width="240" height="24" rx="12" fill="${theme.primaryColor}" fill-opacity="0.12" stroke="${theme.primaryColor}" stroke-opacity="0.3" />
    <text x="0" y="16" text-anchor="middle" fill="${theme.primaryColor}" font-size="9" font-family="monospace" font-weight="bold" letter-spacing="1.5">${theme.clearanceLevel}</text>

    <!-- Role Name -->
    <text x="0" y="48" text-anchor="middle" fill="#FFFFFF" font-size="18" font-weight="800" letter-spacing="0.5">${theme.roleTitle}</text>
    
    <!-- Candidate Name -->
    <text x="0" y="72" text-anchor="middle" fill="#E4E4E7" font-size="14" font-weight="600">${params.candidateName}</text>
  </g>

  <!-- Metrics Grid Section -->
  <g transform="translate(45, 400)">
    <!-- Readiness Score Box -->
    <rect x="0" y="0" width="125" height="70" rx="16" fill="#0F0F14" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="62" y="24" text-anchor="middle" fill="#71717A" font-size="8.5" font-family="monospace" letter-spacing="1">SCORE FINAL</text>
    <text x="62" y="52" text-anchor="middle" fill="${theme.primaryColor}" font-size="22" font-weight="800" font-family="monospace">${scoreFormatted}%</text>

    <!-- Status Box -->
    <rect x="140" y="0" width="130" height="70" rx="16" fill="#0F0F14" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="205" y="24" text-anchor="middle" fill="#71717A" font-size="8.5" font-family="monospace" letter-spacing="1">STATUS ON-CHAIN</text>
    <text x="205" y="52" text-anchor="middle" fill="#10B981" font-size="14" font-weight="bold" font-family="monospace">CERTIFIED</text>

    <!-- Issue Date Box -->
    <rect x="285" y="0" width="125" height="70" rx="16" fill="#0F0F14" stroke="#FFFFFF" stroke-opacity="0.08" />
    <text x="347" y="24" text-anchor="middle" fill="#71717A" font-size="8.5" font-family="monospace" letter-spacing="1">EXPIRACIÓN</text>
    <text x="347" y="50" text-anchor="middle" fill="#D4D4D8" font-size="10" font-weight="bold" font-family="monospace">${formattedValid}</text>
  </g>

  <!-- Cryptographic Proof Footer -->
  <g transform="translate(45, 500)">
    <rect x="0" y="0" width="410" height="135" rx="18" fill="#0C0C10" stroke="#FFFFFF" stroke-opacity="0.08" />
    
    <text x="20" y="30" fill="#71717A" font-size="8" font-family="monospace" letter-spacing="1">CERTIFICATE IDENTIFIER:</text>
    <text x="20" y="46" fill="#A1A1AA" font-size="10" font-family="monospace" font-weight="bold">${params.certId}</text>

    <text x="20" y="74" fill="#71717A" font-size="8" font-family="monospace" letter-spacing="1">SHA-256 PROOF SEAL:</text>
    <text x="20" y="90" fill="${theme.primaryColor}" font-size="9.5" font-family="monospace">${shortHash}...${params.certificateHash.substring(48)}</text>

    <text x="20" y="118" fill="#52525B" font-size="7.5" font-family="monospace">ISSUER: PANDORA'S ACADEMY CORE · SOULBOUND NON-TRANSFERABLE</text>
  </g>
</svg>`;
}
