import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Proteger todas las rutas que empiecen con /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    console.log("Middleware: Interceptando ruta de admin:", request.nextUrl.pathname);

    // En v5, obtenemos la dirección de wallet desde cookies o headers
    // Puedes usar cookies personalizadas o sesiones
    const walletAddress = request.cookies.get("wallet-address")?.value;

    // Obtenemos la sesión usando nuestra función unificada con la dirección del wallet
    const { session } = await getAuth(walletAddress);

    // Si no hay sesión o el usuario no es un administrador (ni normal ni super),
    // lo redirigimos a la página de inicio.
    if (!session?.userId || !(await isAdmin(session.userId))) {
      console.log("Middleware: Acceso denegado. Redirigiendo a /.");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Si la sesión es válida y el usuario es admin, se le permite el acceso.
    console.log("Middleware: Acceso concedido para:", session.userId);
  }

  return NextResponse.next();
}

// Configurar qué rutas vigilar
export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
