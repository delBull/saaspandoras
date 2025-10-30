'use client';

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DigitalTypewriter from './DigitalTypewriter';

const extractRGBColorFromString = (str: string) => {
    const rgbRegex = /(rgba|rgb)\(.*?\)/g;
    const match = str.match(rgbRegex);
    return match ? match[0] : "rgb(255,255,255)";
};

// Helper function to safely access permutation array
function getPermutationValue(index: number): number {
  return p[Math.abs(index) % 512] ?? 0;
}

// Perlin noise implementation
function noise(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = getPermutationValue(X) + Y;
    const B = getPermutationValue(X + 1) + Y;
    return lerp(v, lerp(u, grad(getPermutationValue(A), x, y), grad(getPermutationValue(B), x - 1, y)), lerp(u, grad(getPermutationValue(A + 1), x, y - 1), grad(getPermutationValue(B + 1), x - 1, y - 1)));
}
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t: number, a: number, b: number) { return a + t * (b - a); }
function grad(hash: number, x: number, y: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}
// Initialize permutation array for Perlin noise
const p: number[] = [];
for (let i = 0; i < 512; i++) {
  p[i] = 0; // Initialize all values
}
for (let i = 0; i < 256; i++) {
  const randomValue = Math.floor(Math.random() * 256);
  p[i] = randomValue;
  p[i + 256] = randomValue;
}

function generatePerlinNoise(width: number, height: number, cellSize: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const value = (noise(x / cellSize, y / cellSize) + 1) / 2 * 255;
            const cell = (x + y * width) * 4;
            data[cell] = data[cell + 1] = data[cell + 2] = value;
            data[cell + 3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

function createSeamlessPerlinNoise(width: number, height: number, cellSize: number) {
    const singleNoise = generatePerlinNoise(width, height, cellSize);
    const canvas = document.createElement("canvas");
    canvas.width = width * 4;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(singleNoise, 0, 0);
    ctx.save();
    ctx.translate(width * 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(singleNoise, 0, 0);
    ctx.restore();
    ctx.drawImage(singleNoise, width * 2, 0);
    ctx.save();
    ctx.translate(width * 4, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(singleNoise, 0, 0);
    ctx.restore();
    return canvas.toDataURL();
}

interface PerlinWallProps {
    shapeType?: 'Square' | 'Circle';
    size?: number;
    gap?: number;
    colors?: string[];
    contrast?: number;
    animation?: {
        animate: boolean;
        speed: number;
    };
    radius?: number;
}

function PerlinWall(props: PerlinWallProps) {
    const {
        shapeType = 'Square',
        size = 3,
        gap = 8,
        colors = [],
        contrast = 0,
        animation = { animate: true, speed: 15 },
        radius = 0
    } = props;

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setIsClient(true);
    }, []);

    const perlinNoiseDataUrl = useMemo(() => {
        const { height, width } = dimensions;
        if (!isClient || height === 0 || width === 0) return "";
        const cellSize = Math.max(25, size * 2);
        return createSeamlessPerlinNoise(width, height, cellSize);
    }, [isClient, dimensions, size]);

    const animationDuration = useMemo(() => {
        const { height, width } = dimensions;
        if (height !== 0 && width !== 0) {
            const maxSpeed = 100;
            const baseValue = width * 2250;
            return Math.round(baseValue / Math.pow(animation.speed, Math.log(baseValue / (baseValue / 100)) / Math.log(maxSpeed)));
        }
        return 0;
    }, [animation.speed, dimensions]);

    useEffect(() => {
        if (!isClient) return;
        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;
        const ctx = canvas.getContext("2d");
        if(!ctx) return;

        const resizeCanvas = () => {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            drawShapes();
        };

        const drawShapes = () => {
            if(!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const colorBatch = colors.length > 0 ? colors.map(extractRGBColorFromString) : ["rgb(128,128,128)"];
            for (let y = 0; y < canvas.height; y += size + gap) {
                for (let x = 0; x < canvas.width; x += size + gap) {
                    const color = colorBatch[Math.floor(Math.random() * colorBatch.length)];
                    if (color) {
                        const opacity = getRandomOpacity();
                        ctx.fillStyle = color.replace(")", `,${opacity})`);
                        if (shapeType === "Square") {
                            ctx.fillRect(x, y, size, size);
                        } else {
                            ctx.beginPath();
                            ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }
            }
        };

        const getRandomOpacity = () => {
            let opacity = Math.random();
            if (contrast > 0) {
                opacity = Math.pow(opacity, 1 + contrast / 5);
            } else if (contrast < 0) {
                opacity = 1 - Math.pow(1 - opacity, 1 - contrast / 5);
            }
            return opacity;
        };

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
            resizeCanvas();
        });

        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
        };
    }, [shapeType, size, gap, colors, contrast, isClient]);

    if (!isClient) {
        return <div style={{ width: "100%", height: "100%" }} />;
    }

    const animationStyles = animation.animate ? {
        maskImage: `url(${perlinNoiseDataUrl})`,
        maskMode: "luminance",
        WebkitMaskImage: `url(${perlinNoiseDataUrl})`,
        WebkitMaskMode: "luminance",
        maskSize: "300% 100%",
        WebkitMaskSize: "300% 100%",
        maskRepeat: "repeat-x",
        WebkitMaskRepeat: "repeat-x",
        animation: `moveMask ${animationDuration}ms linear infinite`,
        willChange: "mask-position",
    } : {};

    return (
        <motion.div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: radius, overflow: "hidden" }}>
            <canvas ref={canvasRef} style={{ ...animationStyles }} />
            <style>{`
                @keyframes moveMask {
                    0% { 
                        mask-position: 0% 0%;
                        -webkit-mask-position: 0% 0%;
                    }
                    100% { 
                        mask-position: -${300 * (size / 10)}% 0%;
                        -webkit-mask-position: -${300 * (size / 10)}% 0%;
                    }
                }
            `}</style>
        </motion.div>
    );
}

interface HeroTypewriterProps {
  dict?: {
    marketing?: {
      hero_title?: string;
      hero_typewriter?: {
        typewriter_words?: {
          text: string;
          cursorColor: string;
          contentColor: string;
        }[];
        title?: string;
        subtitle?: string;
      };
    };
  };
}

export function HeroTypewriter({ dict }: HeroTypewriterProps) {
  const typewriterWords = useMemo(() => dict?.marketing?.hero_typewriter?.typewriter_words ?? [
    { text: "Construye Protocolos de Lealtad.", cursorColor: "#A3E635", contentColor: "#A3E635" },
    { text: "Sistema de Incentivos Participativos.", cursorColor: "#7b1b74", contentColor: "#7b1b74" },
    { text: "Diseña Membresías NFT.", cursorColor: "#A3E635", contentColor: "#A3E635" },
  ], [dict]);

  return (
    <section className="relative grid h-screen w-full place-content-center overflow-hidden px-4 md:px-8 xl:px-16">
      <PerlinWall 
        shapeType="Circle"
        size={4}
        gap={8}
        colors={["rgb(128, 0, 128)", "rgb(0, 0, 128)", "rgb(243, 244, 246)", "rgb(255, 255, 255)"]}
        contrast={3}
        animation={{ animate: true, speed: 20 }}
        radius={10}
      />
      <div className="relative z-10 w-full max-w-7xl">
        <div className="text-3xl md:text-5xl xl:text-6xl font-bold tracking-tighter flex flex-col">
          <p className="whitespace-nowrap overflow-visible min-w-fit leading-tight">{dict?.marketing?.hero_title ?? "Construye en web3"}</p>
          <div className="mt-2 text-3xl md:text-4xl xl:text-5xl whitespace-nowrap" style={{ height: '1.2em', minWidth: 'fit-content', overflow: 'visible' }}>
            <DigitalTypewriter
              texts={typewriterWords}
              font={{
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "1em", // Use relative size that adapts to parent
                lineHeight: "1em",
                textAlign: "left",
              }}
              delay={1}
            />
          </div>
          <p className='font-shadows mt-4'>{dict?.marketing?.hero_typewriter?.subtitle?? "Tu comunidad cobra vida."}</p>
        </div>
      </div>
    </section>
  );
}