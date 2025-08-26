"use client";

import React, { useRef, useEffect, useCallback } from 'react';

class DitherProcessor {
    static hexToRgb(color: string): { r: number; g: number; b: number } {
        const varMatch = color.match(/var\((--[\w-]+),\s*(.*)\)/);
        if (varMatch) {
            const cssVar = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]!);
            if (cssVar) {
                color = cssVar.trim();
            } else {
                color = varMatch[2]!;
            }
        }
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        if (result) {
            return {
                r: parseInt(result[1]!, 16),
                g: parseInt(result[2]!, 16),
                b: parseInt(result[3]!, 16),
            };
        }
        return { r: 0, g: 0, b: 0 };
    }

    static floydSteinberg(imageData: ImageData, threshold: number, backgroundColor: string, dotColor: string) {
        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;
        const bgColor = this.hexToRgb(backgroundColor);
        const dotColorRgb = this.hexToRgb(dotColor);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const luminance = Math.round(0.299 * data[idx]! + 0.587 * data[idx + 1]! + 0.114 * data[idx + 2]!);
                const useDotColor = luminance > threshold;
                const targetColor = useDotColor ? dotColorRgb : bgColor;
                data[idx] = targetColor.r;
                data[idx + 1] = targetColor.g;
                data[idx + 2] = targetColor.b;
                data[idx + 3] = 255;

                const errorR = (data[idx]! - targetColor.r);
                const errorG = (data[idx + 1]! - targetColor.g);
                const errorB = (data[idx + 2]! - targetColor.b);

                if (x + 1 < width) {
                    const i = (y * width + (x + 1)) * 4;
                    data[i] = data[i]! + errorR * 7 / 16;
                    data[i + 1] = data[i + 1]! + errorG * 7 / 16;
                    data[i + 2] = data[i + 2]! + errorB * 7 / 16;
                }
                if (y + 1 < height) {
                    if (x - 1 >= 0) {
                        const i = ((y + 1) * width + (x - 1)) * 4;
                        data[i] = data[i]! + errorR * 3 / 16;
                        data[i + 1] = data[i + 1]! + errorG * 3 / 16;
                        data[i + 2] = data[i + 2]! + errorB * 3 / 16;
                    }
                    const i = ((y + 1) * width + x) * 4;
                    data[i] = data[i]! + errorR * 5 / 16;
                    data[i + 1] = data[i + 1]! + errorG * 5 / 16;
                    data[i + 2] = data[i + 2]! + errorB * 5 / 16;
                    if (x + 1 < width) {
                        const i = ((y + 1) * width + (x + 1)) * 4;
                        data[i] = data[i]! + errorR / 16;
                        data[i + 1] = data[i + 1]! + errorG / 16;
                        data[i + 2] = data[i + 2]! + errorB / 16;
                    }
                }
            }
        }
        return new ImageData(data, width, height);
    }
}

interface DitherImageProps {
    imageSrc: string;
    pixelSize?: number;
    backgroundColor?: string;
    dotColor?: string;
}

export const DitherImage: React.FC<DitherImageProps> = ({ 
    imageSrc,
    pixelSize = 4,
    backgroundColor = "#000000",
    dotColor = "#FFFFFF"
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const drawDitheredImage = useCallback(() => {
        if (!canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const img = imageRef.current;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const baseResolution = canvas.clientWidth;

        let targetWidth, targetHeight;
        if (aspectRatio >= 1) {
            targetWidth = Math.floor(baseResolution / pixelSize);
            targetHeight = Math.floor(targetWidth / aspectRatio);
        } else {
            targetHeight = Math.floor(baseResolution / pixelSize);
            targetWidth = Math.floor(targetHeight * aspectRatio);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const processedData = DitherProcessor.floydSteinberg(imageData, 128, backgroundColor, dotColor);
        
        ctx.putImageData(processedData, 0, 0);
    }, [pixelSize, backgroundColor, dotColor]);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            imageRef.current = img;
            drawDitheredImage();
        };
    }, [imageSrc, drawDitheredImage]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeObserver = new ResizeObserver(() => {
            drawDitheredImage();
        });

        resizeObserver.observe(canvas);

        return () => {
            resizeObserver.unobserve(canvas);
        };
    }, [drawDitheredImage]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }}
        />
    );
};