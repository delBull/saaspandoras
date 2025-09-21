// Este archivo se ha actualizado para Thirdweb v5
// En v5, la autenticación se maneja principalmente desde el frontend
// Las rutas de API de catch-all pueden usarse para validación custom

// Ejemplo de endpoint GET
export async function GET(request: Request) {
  try {
    // Obtener la dirección de wallet desde headers o parámetros
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    if (!address) {
      return Response.json({ error: "No address provided" }, { status: 400 });
    }

    // Aquí puedes añadir validación adicional si es necesario
    return Response.json({
      valid: true,
      address: address
    });
  } catch (error) {
    console.error('Auth API error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Ejemplo de endpoint POST
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address } = body;

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
