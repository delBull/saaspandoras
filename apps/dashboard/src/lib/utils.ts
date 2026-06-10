import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDashboardDomain() {
  if (typeof window === 'undefined') return 'dash.pandoras.finance';
  const host = window.location.host;
  const hostname = window.location.hostname;
  
  if (hostname.includes('staging')) {
    return 'staging.dash.pandoras.finance';
  }
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return host; // Includes port if present
  }
  
  return 'dash.pandoras.finance';
}

export function resolveIpfsUrl(url?: string | null): string | null {
  if (!url || url === 'null' || url === 'undefined') return null;
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    // El gateway de Thirdweb está regresando 401 Unauthorized (falta whitelist de dominios).
    // Usamos cloudflare como gateway principal público para no romper las imágenes.
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }
  return url;
}
