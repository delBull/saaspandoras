/**
 * Global Theme & Design Tokens for Pandoras Sovereign Email Engine
 * Optimized for cross-client resilience (Gmail, Apple Mail, Outlook Desktop, Mobile Dark Mode)
 */

export const emailTheme = {
  colors: {
    // Dark mode canvas (Primary Sovereign look)
    canvas: '#090a0f',
    cardBackground: '#11131a',
    cardBorder: '#232634',
    
    // Typography
    textPrimary: '#f4f4f7',
    textSecondary: '#a0a3b1',
    textMuted: '#6e7182',
    textFaint: '#474a58',
    
    // Accents & Brand Fallbacks
    accentDefault: '#00F0FF', // Cyan Sovereign
    accentEmerald: '#10b981', // Sucess / RWA
    accentGold: '#e4c875',    // VIP / Executive / Calendar
    accentDanger: '#ef4444',
    
    // Light Mode Support Fallback (if forced by email client)
    lightCanvas: '#f8fafc',
    lightCard: '#ffffff',
    lightBorder: '#e2e8f0',
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    monoFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  layout: {
    maxWidth: 600,
    borderRadius: '12px',
    contentPadding: '32px 24px',
  }
} as const;
