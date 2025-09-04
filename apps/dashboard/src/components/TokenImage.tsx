'use client';

import Image, { type ImageProps } from "next/image";
import React from "react";
import { useTokenLogo } from "@/hooks/useTokenLogo"; // Asegúrate de que la ruta sea correcta

type TokenImageProps = {
  src: string | undefined | null;
  alt: string;
  size?: number;
  fallbackSrc?: string;
} & Omit<ImageProps, "src" | "alt">;

export function TokenImage({
  src,
  alt,
  size = 36,
  fallbackSrc = "/images/default-token.png",
  ...rest
}: TokenImageProps) {
  const { logoURI, handleImgError } = useTokenLogo(src, fallbackSrc);

  return (
    <Image
      src={logoURI}
      alt={alt}
      width={size}
      height={size}
      onError={handleImgError}
      {...rest}
    />
  );
}