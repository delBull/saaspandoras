// Este archivo se ha actualizado para Thirdweb v5
// En v5, la autenticación se maneja principalmente desde el frontend
// Las rutas de API de catch-all pueden usarse para validación custom

// Endpoint GET reemplazado por funcionalidad básica
export async function GET() {
  // Retorna respuesta básica para compatibilidad
  return Response.json({ message: "Auth endpoint" });
}

// Ejemplo de endpoint POST
export async function POST(request: Request) {
  try {
    const body = await request.json() as { address?: unknown };
    const address = typeof body.address === 'string' ? body.address : undefined;

    if (!address) {
      return Response.json({ error: "No address provided" }, { status: 400 });
    }

    // Aquí puedes añadir validación adicional si es necesario
    return Response.json({
      valid: true,
      address: address,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
