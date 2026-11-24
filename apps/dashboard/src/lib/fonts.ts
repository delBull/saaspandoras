import localFont from "next/font/local";

/**
 * Tipografías vendorizadas.
 *
 * Antes se usaba `next/font/google`, que descarga las fuentes en cada build. Si
 * Google Fonts no responde (o Turobpack invalida su caché), el build muere con
 * "module not found" en un módulo interno de fuentes. Con los .woff2 en el repo
 * el build es determinista y no depende de la red.
 *
 * Los archivos son las fuentes variables (latin) de Google Fonts.
 */
export const inter = localFont({
  src: "../app/fonts/inter-latin.woff2",
  display: "swap",
  weight: "100 900",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

export const playfairDisplay = localFont({
  src: "../app/fonts/playfair-display-latin.woff2",
  display: "swap",
  weight: "400 900",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const shadowsIntoLight = localFont({
  src: "../app/fonts/shadows-into-light-latin.woff2",
  display: "swap",
  weight: "400",
  fallback: ["cursive"],
});
