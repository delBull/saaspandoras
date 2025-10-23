'use client';
import { animate, motion } from "motion/react";
import React, { useEffect } from "react";
import { cn } from '~/lib/utils';
import Image from "next/image";

// Re-creating the visual component based on user-provided code.

// Main parent component that will be displayed
export function MintingVisual({ status, message }: { status: 'minting' | 'success'; message: string; }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50">
      <Card>
        <CardSkeletonContainer>
          <Skeleton status={status} />
        </CardSkeletonContainer>
        <CardTitle>{status === 'minting' ? "Acquiring Pandora's Key..." : "Key Acquired!"}</CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </Card>
    </div>
  );
}

// The animation part
const Skeleton = ({ status }: { status: 'minting' | 'success' }) => {
  const scale = [1, 1.1, 1];
  const transform = ["translateY(0px)", "translateY(-4px)", "translateY(0px)"];
  const sequence = [[".circle-1", { scale, transform }, { duration: 0.8 }]];

  useEffect(() => {
    if (status === 'minting') {
      animate(sequence, {
        repeat: Infinity,
        repeatDelay: 1,
      });
    }
  }, [status, sequence]);

  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row shrink-0 justify-center items-center gap-2">
        <Container className="h-24 w-24 circle-1">
            {status === 'minting' ? (
                <Image src="/images/coin.png" width={64} height={64} alt="Pandora's Key" className="animate-pulse" />
            ) : (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    <Image src="/images/coin.png" width={64} height={64} alt="Pandora's Key Acquired" />
                </motion.div>
            )}
        </Container>
      </div>

      {status === 'minting' && (
        <div className="h-40 w-px absolute top-20 m-auto z-40 bg-gradient-to-b from-transparent via-cyan-500 to-transparent animate-move">
            <div className="w-10 h-32 top-1/2 -translate-y-1/2 absolute -left-10">
            <Sparkles />
            </div>
        </div>
      )}
    </div>
  );
};

// Helper components from the original CardDemo
const Sparkles = () => {
  const randomMove = () => Math.random() * 2 - 1;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 2 + 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block bg-black dark:bg-white"
        ></motion.span>
      ))}
    </div>
  );
};

const Card = ({ className, children }: { className?: string; children: React.ReactNode; }) => {
  return (
    <div
      className={cn(
        "max-w-sm w-full mx-auto p-8 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group",
        className
      )}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string; }) => {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-center text-gray-800 dark:text-white py-2",
        className
      )}
    >
      {children}
    </h3>
  );
};

const CardDescription = ({ children, className }: { children: React.ReactNode; className?: string; }) => {
  return (
    <p
      className={cn(
        "text-sm font-normal text-center text-neutral-600 dark:text-neutral-400 max-w-sm",
        className
      )}
    >
      {children}
    </p>
  );
};

const CardSkeletonContainer = ({ className, children, showGradient = true }: { className?: string; children: React.ReactNode; showGradient?: boolean; }) => {
  return (
    <div
      className={cn(
        "h-48 rounded-xl z-40",
        className,
        showGradient &&
          "bg-neutral-300 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]"
      )}
    >
      {children}
    </div>
  );
};

const Container = ({ className, children }: { className?: string; children: React.ReactNode; }) => {
  return (
    <div
      className={cn(
        `h-16 w-16 rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
    shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
    `,
        className
      )}
    >
      {children}
    </div>
  );
};
