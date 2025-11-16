import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Inicializa Supabase (usa las env vars disponibles - anon key para desarrollo)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_DEV_SUSCRIBERS_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    console.log("🔥 WhatsApp Lead API called");

    // Parse JSON with safety
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    const { name, phone } = body;
    console.log("📋 Received data:", { name, phone });

    if (!phone || !name) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: name y phone" },
        { status: 400 }
      );
    }

    // Validate phone format (basic Mexican phone - add country code)
    if (phone.length < 8 || !phone.match(/^\d+$/)) {
      return NextResponse.json(
        { error: "Número de teléfono debe tener al menos 8 dígitos y solo números" },
        { status: 400 }
      );
    }

    // 🔍 Verificar configuración - modo desarrollo sin Supabase por ahora
    console.log("🔧 Development Mode - Skip Supabase save for testing");
    // TODO: Descomentar esto cuando configués la tabla 'leads' en Supabase
    /*
    // Test the Supabase connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from("leads")
        .select("*")
        .limit(1);

      if (testError) {
        console.error("Supabase connection test failed:", testError);
        return NextResponse.json(
          {
            error: "Error de configuración de base de datos",
            details: "Tabla 'leads' no existe o permisos incorrectos"
          },
          { status: 500 }
        );
      }
      console.log("✅ Supabase connection test OK");
    } catch (connError) {
      console.error("Supabase connection failed:", connError);
      return NextResponse.json(
        {
          error: "Error de conexión a base de datos",
          details: process.env.NODE_ENV === 'development' ? (connError as Error).message : undefined
        },
        { status: 500 }
      );
    }

    // 1️⃣ Guardar en DB
    console.log("💾 Inserting lead into database...");
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: name.trim(),
        phone: phone.trim(),
        source: "whatsapp",
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error("❌ Supabase DB Error:", error);
      return NextResponse.json(
        {
          error: "Error guardando en base de datos",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    console.log("✅ Lead saved successfully:", data);
    */

    console.log("📝 [TESTING MODE] Lead would be saved:", {
      name: name.trim(),
      phone: phone.trim(),
      source: "whatsapp",
      created_at: new Date().toISOString()
    });

    // 2️⃣ Generar mensaje e URL de WhatsApp HACIA EL USUARIO
    // 🔁 El receiver ES el número del usuario (NO nuestro número)

    // Agregar código de país si no está incluido (asumimos México por default)
    let receiver = phone.trim();

    // Si el número no empieza con código de país (es decir, tiene 8-10 dígitos)
    // agregamos el código de México (52)
    if (receiver.length <= 10 && !receiver.startsWith('52')) {
      receiver = `52${receiver}`;
      console.log("📱 Added MX country code (52):", receiver);
    }

    // Validar formato final del teléfono
    if (!receiver.match(/^\d{10,15}$/)) {
      console.error("❌ Invalid receiver number format after country code:", receiver);
      return NextResponse.json(
        { error: "Número de teléfono inválido. Incluye código de país si no eres de México." },
        { status: 400 }
      );
    }

    const message = encodeURIComponent(
      `¡Hola ${name.trim()}! 👋\n\nGracias por iniciar tu aplicación en Pandora's.\n\nAquí están tus instrucciones:\n1️⃣ Entra al enlace: https://dash.pandoras.finance/apply\n2️⃣ Completa tu aplicación.\n3️⃣ Nuestro equipo revisará tu solicitud.\n\n¡Estamos listos para recibirte! 🚀`
    );

    const whatsappUrl = `https://wa.me/${receiver}?text=${message}`;
    console.log("� Generated WhatsApp URL:", whatsappUrl.substring(0, 60) + "...");

    return NextResponse.json({
      whatsappUrl,
      success: true,
      message: "Lead registrado correctamente"
    });

  } catch (err) {
    console.error("💥 WhatsApp Lead API Critical Error:", err);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// Debug endpoint to test API configuration
export function GET() {
  return NextResponse.json({
    status: "API WhatsApp funcionando",
    config: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_DEV_SUSCRIBERS_SUPABASE_ANON_KEY,
      hasReceiverNumber: !!process.env.WHATSAPP_RECEIVER_NUMBER,
      receiverFormat: process.env.WHATSAPP_RECEIVER_NUMBER?.match(/^\d{10,15}$/) ? "valid" : "invalid",
      env: process.env.NODE_ENV
    }
  });
}
