
import { NextRequest, NextResponse } from "next/server";
import { confirmBooking, rejectBooking } from "@/actions/scheduling";

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'confirm', 'reject', 'reschedule'

    if (!id || !action) {
        return new NextResponse("Missing parameters", { status: 400 });
    }

    try {
        let result;
        if (action === 'confirm') {
            result = await confirmBooking(id);
        } else if (action === 'reject') {
            // We might want to pass a reason, but for simple link clicks we assume generic rejection or open a form.
            // For V1 link click, we just reject.
            result = await rejectBooking(id);
        } else {
            return new NextResponse("Action not supported via GET Link yet", { status: 400 });
        }

        if (!result.success) {
            return new NextResponse(`Error: ${result.error}`, { status: 500 });
        }

        // Success Page (HTML)
        const successMessage = action === 'confirm' ? 'Cita Confirmada ✅' : 'Cita Rechazada ❌';
        const color = action === 'confirm' ? 'text-green-500' : 'text-red-500';

        return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pandora Scheduler</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-black text-white h-screen flex flex-col items-center justify-center font-sans">
          <div class="h-16 w-16 mb-6 rounded-full bg-zinc-800 flex items-center justify-center text-2xl border border-zinc-700">
             ${action === 'confirm' ? '✅' : '❌'}
          </div>
          <h1 class="text-3xl font-bold ${color}">${successMessage}</h1>
          <p class="mt-4 text-zinc-400">El estado se ha actualizado en el sistema.</p>
          <p class="mt-8 text-sm text-zinc-600">Puedes cerrar esta ventana.</p>
          <script>
            // Optional: Close window after 3s if opened as popup
             setTimeout(() => {
                // window.close(); 
             }, 3000);
          </script>
        </body>
      </html>
    `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error("Interaction Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
