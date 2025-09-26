import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  // Proteger todas las rutas que empiecen con /admin
  if (request.nextUrl.pathname.startsWith("/admin")) {
    console.log("Middleware: Interceptando ruta de admin:", request.nextUrl.pathname);

    // En v5, obtenemos la dirección de wallet desde cookies
    const walletAddress = request.cookies.get("wallet-address")?.value;

    if (!walletAddress) {
      console.log("Middleware: No cookie encontrada, dejando pasar al client-side para verificar");
      // Dejar pasar - el client-side verificará permisos después
      return NextResponse.next();
    }

    // Obtenemos la sesión usando headers primero, luego wallet address como fallback
    const { session } = await getAuth(request.headers, walletAddress);

    // Si no hay sesión o el usuario no es un administrador,
    // permitimos que el client-side maneje la verificación
    if (!session?.userId || !(await isAdmin(session.userId))) {
      console.log("Middleware: Usuario no autorizado o sin sesión, dejando pasar al client-side");
      // Dejar pasar - el client-side mostrará pantalla de no autorizado
      return NextResponse.next();
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
