import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pandoras.finance';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin/'], // Protect API and Admin routes from crawlers
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
