import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pandoras.finance';

    return {
        rules: {
            userAgent: '*',
            disallow: ['/'], // Block ALL crawlers from indexing this private dashboard
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
