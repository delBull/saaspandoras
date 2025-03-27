"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import geoip from "geoip-lite"; // Importar geoip-lite
import { i18n } from "../config/i18n-config"; // Para obtener los idiomas disponibles

export default function LanguageDetector() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return; // Solo ejecutar en el cliente

    // Obtener la IP del usuario. Si no estás en un entorno de servidor (por ejemplo, en producción), puedes obtener la IP a través de un proxy o servicio.
    // En este ejemplo, usamos "geoip-lite" para obtener la región, pero normalmente esto sería parte de un request del servidor.

    const ip = window?.location?.hostname; // Esto solo funciona si tienes un servidor que pasa la IP del cliente
    const geo = geoip.lookup(ip); // Obtener la información geográfica según la IP

    const userRegion = geo?.country; // Obtiene el país (por ejemplo, "US", "ES", etc.)
    const defaultLanguage = "en"; // Idioma por defecto

    // Redirigir según el país (o la región)
    if (userRegion === "ES") {
      router.push("/es"); // Si la región es España, redirigir a "/es"
    } else if (userRegion === "US") {
      router.push("/en"); // Si la región es EE. UU., redirigir a "/en"
    } else {
      router.push(`/${defaultLanguage}`); // Si no es un país especificado, redirigir a inglés
    }
  }, [router]);

  return null;
}
