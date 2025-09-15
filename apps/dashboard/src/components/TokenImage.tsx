'use client';

import Image, { type ImageProps } from "next/image";
import React, { useState, useEffect } from "react";

type TokenImageProps = {
  src: string | undefined | null;
  alt: string;
  size?: number;
} & Omit<ImageProps, "src" | "alt">;

export function TokenImage({
  src,
  alt,
  size = 36,
  ...rest
}: TokenImageProps) {
  const fallbackSrc = "/tokens/generic.png";
  const [imgSrc, setImgSrc] = useState(src ?? fallbackSrc);

  useEffect(() => setImgSrc(src ?? fallbackSrc), [src]);

  // Si la imagen es local (desde /public), usa una etiqueta <img> normal para evitar el optimizador de Next.js.
  // Esto soluciona los errores 400 Bad Request.
  if (imgSrc.startsWith('/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imgSrc} alt={alt} width={size} height={size} onError={() => setImgSrc(fallbackSrc)} {...rest} />
    );
  }

  return <Image src={imgSrc} alt={alt} width={size} height={size} onError={() => setImgSrc(fallbackSrc)} {...rest} />;
}