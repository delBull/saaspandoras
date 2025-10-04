import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // ⚠️ IMPORTANTE: Middleware runs in Edge Runtime
  // No podemos usar código que dependa de PostgreSQL, Drizzle, o conexiones a BD
  // porque Postgres no es compatible con Edge Runtime

  // Simplemente dejamos pasar - la autenticación se maneja en cada API route
  // donde podemos usar runtime='nodejs'

  console.log("Middleware: Interceptando ruta:", request.nextUrl.pathname);

  // Para rutas admin, permitimos acceso inicial - la verificación se hace en client-side
  if (request.nextUrl.pathname.startsWith("/admin")) {
    console.log("Middleware: Permitir acceso inicial a ruta admin");
    // Dejamos que llegue al componente donde se hace la verificación completa
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Configurar qué rutas vigilar
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
