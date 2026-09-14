/**
 * ⚡ Nexus TMA — Auth Context & Hook
 * src/lib/use-nexus-auth.ts
 *
 * React hook that manages the full authentication flow:
 *  1. On mount: check sessionStorage for existing valid session
 *  2. If no session: authenticate via Telegram initData → backend
 *  3. Expose: session, capabilities, isLoading, error, hasCapability()
 */

import { useState, useEffect, useCallback } from 'react';
import { getInitData, initTelegramWebApp } from './telegram-webapp';
import { authenticateWithInitData, ApiError } from './api-client';
import { loadSession, saveSession, clearSession, hasCapability, type NexusTmaSession } from './session-store';

export interface AuthState {
  session: NexusTmaSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  errorCode: string | null;
  hasCapability: (cap: string) => boolean;
  logout: () => void;
  retry: () => void;
}

export function useNexusAuth(): AuthState {
  const [session, setSession] = useState<NexusTmaSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);

    // 1. Check existing session
    const cached = loadSession();
    if (cached) {
      setSession(cached);
      setIsLoading(false);
      return;
    }

    // 2. Get initData from Telegram WebApp
    const initData = getInitData();
    if (!initData) {
      setError(
        import.meta.env.DEV
          ? 'Dev mode: Set VITE_DEV_INIT_DATA in .env.local to test auth flow.'
          : 'No se pudo obtener la identidad de Telegram. Abre desde el bot.'
      );
      setErrorCode('NO_INIT_DATA');
      setIsLoading(false);
      return;
    }

    // 3. Authenticate with backend
    try {
      const newSession = await authenticateWithInitData(initData);
      saveSession(newSession);
      setSession(newSession);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError('Error de conexión. Revisa tu red e intenta de nuevo.');
        setErrorCode('NETWORK_ERROR');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const retry = useCallback(() => {
    clearSession();
    setSession(null);
    authenticate();
  }, [authenticate]);

  useEffect(() => {
    initTelegramWebApp();
    authenticate();
  }, [authenticate]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    error,
    errorCode,
    hasCapability: (cap) => hasCapability(session, cap),
    logout,
    retry,
  };
}
