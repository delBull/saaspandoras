/**
 * 📱 Nexus TMA — Telegram WebApp Bridge
 * src/lib/telegram-webapp.ts
 *
 * Safe wrapper around window.Telegram.WebApp with:
 *  - Type-safe access to initData and user info
 *  - Fallback for local development (outside Telegram)
 *  - Viewport expansion + dark theme configuration
 *  - Haptic feedback helpers
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    auth_date?: number;
    hash?: string;
    query_id?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText(text: string): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive: boolean): void;
    hideProgress(): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
  };
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
}

// ─── Dev Mode Flag ────────────────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV;

// ─── Mock initData for local development ─────────────────────────────────────
const DEV_INIT_DATA = IS_DEV
  ? import.meta.env.VITE_DEV_INIT_DATA || ''
  : '';

// ─── Singleton accessor ───────────────────────────────────────────────────────
let _webApp: TelegramWebApp | null = null;

function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  if (_webApp) return _webApp;
  _webApp = window.Telegram?.WebApp ?? null;
  return _webApp;
}

/**
 * Returns true if the app is running inside a Telegram WebApp context.
 */
export function isTelegramContext(): boolean {
  const twa = getTelegramWebApp();
  return !!(twa && twa.initData);
}

/**
 * Initializes the Telegram WebApp:
 *  - Calls ready() to hide the loading indicator
 *  - Expands the viewport to full height
 *  - Sets dark theme colors matching Nexus design system
 */
export function initTelegramWebApp(): void {
  const twa = getTelegramWebApp();
  if (!twa) {
    if (IS_DEV) {
      console.info('[NexusTMA] Running in dev mode — Telegram WebApp not available.');
    }
    return;
  }

  twa.ready();
  twa.expand();

  // Dark mode aligned with Nexus design system
  try {
    twa.setHeaderColor('#0a0a0f');
    twa.setBackgroundColor('#0a0a0f');
  } catch {
    // Some older Telegram clients don't support this
  }
}

/**
 * Returns the raw initData string for auth.
 * In dev mode, returns VITE_DEV_INIT_DATA env var (must be set for local testing).
 */
export function getInitData(): string {
  const twa = getTelegramWebApp();
  if (twa?.initData) return twa.initData;
  if (IS_DEV && DEV_INIT_DATA) return DEV_INIT_DATA;
  return '';
}

/**
 * Returns the Telegram user from initDataUnsafe (display only — NOT for auth).
 * Auth always goes through the backend HMAC verification.
 */
export function getTelegramUser() {
  const twa = getTelegramWebApp();
  return twa?.initDataUnsafe?.user ?? null;
}

/**
 * Haptic feedback helpers.
 */
export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'),
  success: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success'),
  error: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error'),
  warning: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning'),
};
