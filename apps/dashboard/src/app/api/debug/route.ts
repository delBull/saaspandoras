export function GET() {
  return Response.json({
    message: "Debug endpoint working",
    timestamp: new Date().toISOString(),
    status: "success"
  });
}
