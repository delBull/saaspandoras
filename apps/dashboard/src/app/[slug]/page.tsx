// Dynamic route for handling custom shortlinks redirection
// Handles /[slug] requests and redirects with analytics tracking

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { shortlinks, shortlinkEvents } from '~/db/schema';
import { headers } from 'next/headers';
import { Metadata } from 'next';
import { SmartQRLanding } from '@/components/SmartQRLanding';

// Force dynamic to prevent caching of 404s/redirects
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (['admin', 'api', 'dashboard', '_next', 'w', 's'].includes(slug)) {
    return { title: 'Pandoras System' };
  }

  try {
    const shortlink = await db
      .select()
      .from(shortlinks)
      .where(eq(shortlinks.slug, slug))
      .limit(1);

    if (!shortlink.length || !shortlink[0]?.isActive) {
      return { title: 'Not Found' };
    }

    const link = shortlink[0];

    // Default metadata from the shortlink record
    let title = link.title || 'Pandoras Pass';
    let description = link.description || 'Access Pass / Smart QR';
    let imageUrl = 'https://pandoras.finance/images/pkey.png'; // Fallback image

    // If it's a landing page, prefer landing config metadata
    if (link.type === 'landing' && link.landingConfig) {
      const config = link.landingConfig as any;
      if (config.title) title = config.title;
      if (config.slogan) description = config.slogan;
      if (config.logoUrl) imageUrl = config.logoUrl;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (err) {
    console.error('Error generating metadata for shortlink:', err);
    return { title: 'Pandoras' };
  }
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
      throw new Error('not_found');
    }

    const link = shortlink[0];

    if (!link?.isActive) {
      console.log(`⏳ Shortlink not found or inactive: ${slug}`);
      throw new Error('not_found');
    }

    // Extract tracking info from headers and search params
    const userAgent = headersData.get('user-agent') || '';
    const referer = headersData.get('referer') || '';
    const host = headersData.get('host') || ''; // Get the domain (pandoras.finance or pbox.dev)
    const isPboxDomain = host.includes('pbox.dev');

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

    // Detect social bots for OpenGraph previews (WhatsApp, FB, Twitter, etc.)
    const isBot = /bot|facebookexternalhit|whatsapp|twitterbot|linkedinbot|pinterestbot|slackbot|discordbot/i.test(userAgent.toLowerCase());

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
    if (!isBot) {
      db.insert(shortlinkEvents).values({
        slug,
        domain: host,
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
    }

    // 🚀 NEW: Smart QR Landing Page Logic
    if (link.type === 'landing' && link.landingConfig) {
      console.log(`🎨 Found Landing Page config for: ${slug}`);
      return { type: 'landing', config: link.landingConfig };
    }

    // Return a bot preview state if a scraper is accessing a redirect link
    if (isBot) {
      console.log(`🤖 Detected bot for redirect link: ${slug}`);
      return { type: 'bot_preview', link };
    }

    // Redirect to destination URL with shortlink tracking parameters
    const destinationUrl = new URL(link.destinationUrl);

    // Add shortlink info so the landing page knows it came from a shortlink
    destinationUrl.searchParams.set('via_shortlink', slug);
    destinationUrl.searchParams.set('via_domain', host);

    const redirectUrl = destinationUrl.toString();

    console.log(`🚀 Redirecting ${slug} to: ${redirectUrl}`);
    redirect(redirectUrl);

  } catch (error: any) {
    console.error('Shortlink handling error:', error);
    // Re-throw errors to be handled by the page component
    throw error;
  }
}

export default async function ShortlinkPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  // Get host from headers for server-side URL construction
  const headersData = await headers();
  const host = headersData.get('host') || 'pandoras.finance';
  const protocol = host.includes('localhost') || host.includes('pbox.dev') ? 'http' : 'https';

  // Handle reserved slugs (you can add more)
  if (['admin', 'api', 'dashboard', '_next', 'w', 's'].includes(slug)) {
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

  // Convert resolvedSearchParams to URLSearchParams
  const urlSearchParams = new URLSearchParams();
  if (resolvedSearchParams) {
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => urlSearchParams.append(key, v));
      } else if (value) {
        urlSearchParams.append(key, value);
      }
    });
  }

  try {
    // Call handleShortlink - this will redirect if successful or return landing config
    const result = await handleShortlink(slug, urlSearchParams, headersData);

    if (result?.type === 'landing') {
      return <SmartQRLanding config={result.config} slug={slug} />;
    }

    // For social media bots parsing OpenGraph tags
    if (result?.type === 'bot_preview') {
      return (
        <html>
          <head>
            {/* The meta tags are handled by generateMetadata. We just return a client-side redirect for safety */}
            <meta httpEquiv="refresh" content={`0;url=${result.link?.destinationUrl}`} />
          </head>
          <body>
            Redirecting...
          </body>
        </html>
      );
    }

    // If we reach this point and no redirect happened (which throws), 
    // it's a fallback for non-landing results
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-xl font-bold text-blue-600 mb-2">¡Éxito!</h1>
            <p className="text-gray-600">
              Redirigiendo desde <code className="bg-gray-100 px-2 py-1 rounded">/{slug}</code>...
            </p>
          </div>
        </div>
      </div>
    );

  } catch (error: any) {
    // Handle different types of errors from handleShortlink
    const errorType = error.message || 'server_error';

    if (error.message === 'NEXT_REDIRECT' || error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    if (errorType === 'not_found') {
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
    console.log(`❌ Shortlink page error: ${slug} - ${errorType}`);
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
}
