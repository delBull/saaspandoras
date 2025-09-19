import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  // Solo interceptar rutas que empiecen con /admin/
  if (request.nextUrl.pathname.startsWith("/admin/") ||
      request.nextUrl.pathname === "/admin") {

    try {
      // Buscar cookies de autenticación de thirdweb varias posibles
      const possibleAuthCookies = [
        'thirdweb_auth_token',
        'thirdweb-auth-token',
        'thirdweb_session',
        'thirdweb-user'
      ];

      let thirdwebCookie = null;
      for (const cookieName of possibleAuthCookies) {
        thirdwebCookie = request.cookies.get(cookieName);
        if (thirdwebCookie?.value) break;
      }

      // Buscar headers x-thirdweb-address (si existe)
      const thirdwebAddress = request.headers.get('x-thirdweb-address');
      const thirdwebHeader = request.headers.get('thirdweb-address');

      let userAddress: string | null = null;

      if (thirdwebAddress ?? thirdwebHeader) {
        userAddress = (thirdwebAddress ?? thirdwebHeader)?.toLowerCase() ?? null;
      } else if (thirdwebCookie?.value) {
        // Intentar parsear la dirección de las cookies
        try {
          const cookieData = JSON.parse(thirdwebCookie.value);

          // Verificar diferentes posibles estructuras de cookie
          const address = cookieData?.address ?? cookieData?.address?.address ??
                         cookieData?.user?.address ?? cookieData?.user;

          if (typeof address === 'string') {
            userAddress = address.toLowerCase();
          }
        } catch (parseError) {
          console.log('Middleware: Unable to parse auth cookie:', parseError);
          // Verificar si la cookie es un string directo de address
          if (thirdwebCookie.value.startsWith('0x') && thirdwebCookie.value.length === 42) {
            userAddress = thirdwebCookie.value.toLowerCase();
          }
        }
      }

      if (!userAddress) {
        console.log('Middleware: No wallet address found in auth data');
        console.log('Middleware: Cookies found:', request.cookies.getAll());
        console.log('Middleware: Thirdweb headers:', thirdwebAddress, thirdwebHeader);
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Verificar si el usuario está autorizado (SUPER ADMIN por ahora)
      const userIsSuperAdmin = userAddress === SUPER_ADMIN_WALLET.toLowerCase();

      // Si no es super admin, rechazar (por simplicidad en middleware)
      if (!userIsSuperAdmin) {
        console.log('Middleware: Access denied for wallet:', userAddress, '- not super admin');
        return NextResponse.redirect(new URL("/", request.url));
      }

      console.log('Middleware: Access granted for wallet:', userAddress, {
        isSuperAdmin: userIsSuperAdmin
      });

    } catch (error) {
      console.error('Middleware error:', error);
      // En caso de error, redirigir al home
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Configurar qué rutas vigilar
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
