import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export function GET() {
  // Capturar un error intencional para verificar que Sentry funciona
  const error = new Error(`Test Sentry API - Error intencional del ${new Date().toISOString()} - ID: ${crypto.randomUUID()}`);

  // Persona Sentry capture el error
  Sentry.captureException(error, {
    tags: {
      endpoint: 'test-sentry',
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    },
    extra: {
      userInfo: 'test-user-for-diagnostic',
      testType: 'api-route-error-test'
    }
  });

  // Return error response to confirm the API is working
  return NextResponse.json({
    message: "Error enviado a Sentry - revisa el dashboard de Sentry",
    error: {
      message: error.message,
      timestamp: new Date().toISOString()
    },
    sentryTestCompleted: true
  }, { status: 500 });
}

export function POST() {
  // Different error for POST method to test both
  const error = new Error(`Test Sentry API POST - Error intencional del ${new Date().toISOString()} - ID: ${crypto.randomUUID()}`);

  Sentry.captureException(error, {
    tags: {
      endpoint: 'test-sentry-post',
      method: 'POST',
      testType: 'api-route-error-test-post'
    }
  });

  return NextResponse.json({
    message: "Error POST enviado a Sentry",
    error: error.message,
    method: "POST"
  }, { status: 500 });
}
