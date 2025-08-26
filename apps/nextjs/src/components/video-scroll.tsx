"use client";

//import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";

import { ContainerScroll } from "@saasfly/ui/container-scroll-animation";
import { ColourfulText } from "@saasfly/ui/colorful-text";

interface VideoScrollDict {
  academic_backing?: {
    title: string;
    subtitle: string;
  };
  time_text: string;
  second_text2?: string;
  [key: string]: any;
}

export function VideoScroll({
  dict,
}: {
  dict: VideoScrollDict | undefined;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      try {
        videoRef.current?.play();
      } catch (e) {
        console.error("No se pudo reproducir el video:", e);
      }
    }, 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    videoRef.current?.pause();
    videoRef.current!.currentTime = 0;
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-2xl md:text-4xl font-semibold text-black dark:text-gray-200">
              {dict?.academic_backing?.title}
              <br />
              <span className="text-2xl md:text-5xl font-bold font-mono mt-1 leading-none">
                {dict?.academic_backing?.subtitle}
              </span>
            </h1>
          </>
        }
      >
        <div className="relative w-full h-full flex items-center justify-center group">
          {!isPlaying && (
            <>
              <Image
                src={`/images/coin.png`}
                alt="hero"
                height={720}
                width={1400}
                className="mx-auto rounded-2xl object-cover h-full object-left-top hidden xl:block md:block cursor-default transition-all duration-300 group-hover:blur-xs group-hover:brightness-90"
                draggable={false}
              />
              <Image
                src={`/images/coin_mobile.jpg`}
                alt="hero"
                height={720}
                width={1400}
                className="mx-auto rounded-2xl object-cover h-full object-left-top block xl:hidden md:block transition-all duration-300 group-hover:blur-xs group-hover:brightness-90"
                draggable={false}
              />
              {/* Play button overlay */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center z-20 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Play video"
                type="button"
                style={{ background: "rgba(0,0,0,0.15)" }}
              >
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="38" fill="white" fillOpacity="0.7" stroke="#ffffff" strokeWidth="1" />
                  <polygon points="32,25 60,40 32,55" fill="gray" />
                </svg>
              </button>
            </>
          )}
          {/* Show video if playing */}
          {isPlaying && (
            <video
              ref={videoRef}
              onClick={handleVideoClick}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl z-10"
              onEnded={handleEnded}
              controls={false}
              autoPlay
              playsInline
            >
              <source src="/videos/montage-optimized.webm" type="video/webm" />
              <source src="/videos/montage.mp4" type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          )}
        </div>
      </ContainerScroll>
    </div>
  );
}