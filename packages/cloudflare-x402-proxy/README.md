# Pandoras x402 Cloudflare Scraper Monetization Worker

Worker edge de Cloudflare que monetiza los crawlers y scrapers de IA (GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.) en tus sitios públicos (Pandoras y Narai).

## Cómo funciona
1. **Usuarios humanos:** Tráfico normal con navegador web navega gratis hacia el origin.
2. **Archivos estáticos y manifests:** `/.well-known/x402.json` y `/llms.txt` pasan libres para descubrimiento.
3. **Scrapers de IA no autorizados:** Si intentan scrapear páginas, reciben `HTTP 402 Payment Required` con el challenge para pagar **$0.001 USDC en Base**.
4. **Scrapers con pago:** Si envían el header `PAYMENT-SIGNATURE`, el worker valida con el Facilitador (`x402.org`) y les permite indexar/scrapear la página pagando en tiempo real.

## Despliegue en Cloudflare (1 Click)
```bash
cd packages/cloudflare-x402-proxy
npx wrangler deploy
```

Configura en Cloudflare Route: `*.pandoras.finance/*` o `narai.lat/*`.
