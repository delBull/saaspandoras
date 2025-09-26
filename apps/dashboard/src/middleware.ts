import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ⚠️ IMPORTANTE: Middleware runs in Edge Runtime
  // No podemos usar código que dependa de PostgreSQL, Drizzle, o conexiones a BD
  // porque Postgres no es compatible con Edge Runtime

  // Simplemente dejamos pasar - la autenticación se maneja en cada API route
  // donde podemos usar runtime='nodejs'

  console.log("Middleware: Interceptando ruta:", request.nextUrl.pathname);

  // Para rutas admin, verificamos al menos que haya una sesión vía cookie
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const walletAddress = request.cookies.get("wallet-address")?.value;

    if (!walletAddress) {
      console.log("Middleware: No cookie encontrada, redirigiendo a login");
      // Podríamos redirigir, pero mejor dejamos que el componente de client-side maneje
      return NextResponse.next();
    }

    console.log("Middleware: Usuario autenticado con cookie, permitiendo acceso");
  }

  return NextResponse.next();
}

// Configurar qué rutas vigilar
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
