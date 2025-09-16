const adminWallets = [
  "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9".toLowerCase(),
];

export function isAdmin(address: string | undefined): boolean {
  if (!address) {
    return false;
  }
  return adminWallets.includes(address.toLowerCase());
}

export async function getAuth(headers?: Headers) {
  // Intenta obtener wallet de Thirdweb desde cookies (si el frontend la guarda)
  let userAddress: string | null = null;
  
  if (headers) {
    // Busca cookies de Thirdweb (típicamente 'thirdweb-wallet' o similar)
    const cookies = headers.get('cookie');
    if (cookies) {
      const thirdwebCookie = cookies.split(';').find(cookie =>
        cookie.trim().startsWith('thirdweb') ||
        cookie.trim().includes('wallet')
      );
      if (thirdwebCookie) {
        // Extrae address del cookie (simplificado - en producción parsear correctamente)
        try {
          const match = thirdwebCookie.match(/address=([^;]+)/);
          if (match && match[1]) {
            userAddress = match[1].toLowerCase();
          }
        } catch (e) {
          console.warn('Error parsing Thirdweb cookie:', e);
        }
      }
    }
  }
  
  // Fallback a admin wallet para desarrollo (puedes remover esto en producción)
  if (!userAddress) {
    userAddress = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";
  }
  
  return {
    session: {
      userId: userAddress,
      address: userAddress
    }
  };
}
