import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const isDev = import.meta.env.DEV;
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_URL = `${BASE_URL.replace(/\/+$/, '')}/api/v1/hermes/tma`;

export const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para inyectar token de sesión autorizado (NO initData crudo para las queries)
api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Importado de forma tardía para evitar ciclos
import { useSessionStore } from '../store/useSessionStore';

export const authenticateTMA = async (targetWorkspace?: string) => {
  let initData = WebApp.initData;

  // Mock en desarrollo únicamente
  if (!initData && isDev) {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') {
      console.warn("⚠️ Usando MOCK_AUTH para desarrollo. Esto fallará en producción.");
      // NOTA: El servidor no valida mocks sintéticos en auth real sin una flag.
      // Para probar el flujo dev sin Telegram, el servidor de dashboard debe tener auth deshabilitado
      // o debemos proporcionar un initData válido exportado del bot.
    } else {
      throw new Error("InitData no encontrado. Abre la aplicación desde Telegram.");
    }
  }

  try {
    const res = await axios.post(`${API_URL}/auth`, {
      initData,
      targetWorkspace,
    });
    
    if (res.data.success) {
      useSessionStore.getState().setSession(res.data.token, res.data.session, res.data.authorizedTenants);
      return res.data;
    }
    throw new Error(res.data.error || "Fallo de autenticación");
  } catch (err: any) {
    console.error("[API] Error de Auth:", err.response?.data || err.message);
    throw err;
  }
};
