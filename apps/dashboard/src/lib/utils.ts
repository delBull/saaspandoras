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
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY;
    if (clientId) {
      return `https://${clientId}.ipfscdn.io/ipfs/${cid}`;
    }
    return `https://dweb.link/ipfs/${cid}`;
  }
  return url;
}
