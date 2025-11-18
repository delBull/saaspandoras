// Dynamic route for handling custom shortlinks redirection
// Handles /[slug] requests and redirects with analytics tracking

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { shortlinks, shortlinkEvents } from '~/db/schema';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Server Action for tracking and redirecting
async function handleShortlink(slug: string, searchParams: URLSearchParams, headersData: any) {
  try {
    console.log(`🔗 Processing shortlink: ${slug}`);

    // Get shortlink from database
    const shortlink = await db
      .select()
      .from(shortlinks)
      .where(eq(shortlinks.slug, slug))
      .limit(1);

    if (!shortlink.length) {
      console.log(`❌ Shortlink not found: ${slug}`);
      return { error: 'not_found' as const };
    }

    const link = shortlink[0];

    if (!link?.isActive) {
      console.log(`⏳ Shortlink not found or inactive: ${slug}`);
      return { error: 'not_found' as const };
    }

    // Extract tracking info from headers and search params
    const userAgent = headersData.get('user-agent') || '';
    const referer = headersData.get('referer') || '';

    // Get IP from various headers (Cloudflare, proxy, etc.)
    const cfIp = headersData.get('cf-connecting-ip');
    const xForwardedFor = headersData.get('x-forwarded-for');
    const xRealIp = headersData.get('x-real-ip');
    const ip = cfIp || xForwardedFor?.split(',')[0]?.trim() || xRealIp || 'unknown';

    // Extract UTM parameters from query string
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmTerm = searchParams.get('utm_term');
    const utmContent = searchParams.get('utm_content');

    // Detect device type
    let deviceType = 'unknown';
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    // Detect browser
    let browser = 'unknown';
    if (/chrome/i.test(userAgent)) browser = 'chrome';
    else if (/firefox/i.test(userAgent)) browser = 'firefox';
    else if (/safari/i.test(userAgent)) browser = 'safari';
    else if (/edge/i.test(userAgent)) browser = 'edge';
    else if (/opera/i.test(userAgent)) browser = 'opera';

    // Detect country (basic from IP, you might want to use a service)
    const country = ip === 'unknown' ? 'XX' : 'XX'; // Placeholder

    console.log(`📊 Tracking shortlink click: ${slug} -> ${link.destinationUrl}`);

    // Track the event (async, don't wait for it)
    db.insert(shortlinkEvents).values({
      slug,
      ip,
      userAgent,
      referer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      deviceType,
      browser,
      country,
    }).catch(error => {
      console.error('Failed to track shortlink event:', error);
    });

    // Redirect to destination
    console.log(`🚀 Redirecting ${slug} to: ${link.destinationUrl}`);
    return { redirectTo: link.destinationUrl };

  } catch (error) {
    console.error('Shortlink handling error:', error);
    return { error: 'server_error' };
  }
}

export default async function ShortlinkPage({ params }: PageProps) {
  const { slug } = await params;

  // Handle reserved slugs (you can add more)
  if (['admin', 'api', 'dashboard', '_next', 'w'].includes(slug)) {
    console.log(`⏭️ Skipping reserved slug: ${slug}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Página restringida</h1>
            <p className="text-gray-600">
              El enlace <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code> está reservado para el sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get search params and headers for tracking
  const headersData = await headers();
  const url = new URL(`http://localhost:3000/${slug}`);
  // In real implementation, you'd get search params from the request
  const searchParams = new URLSearchParams();

  const result = await handleShortlink(slug, searchParams, headersData);

  if (result.error) {
    if (result.error === 'not_found') {
      // Return a 404 page for not found links
      console.log(`📭 Shortlink page not found: ${slug}`);
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no encontrado</h1>
              <p className="text-gray-600">
                El enlace personalizado <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code> no existe o ha sido desactivado.
              </p>
            </div>
          </div>
        </div>
      );
    }
    // For other errors, show error page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error del servidor</h1>
            <p className="text-gray-600">
              Ha ocurrido un error procesando el enlace <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to destination URL
  if (result.redirectTo) {
    redirect(result.redirectTo);
  }

  // Fallback error
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error de configuración</h1>
          <p className="text-gray-600">
            No se pudo redirigir desde <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
