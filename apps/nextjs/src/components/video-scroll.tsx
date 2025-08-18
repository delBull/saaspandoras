"use client";

//import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";

import { ContainerScroll } from "@saasfly/ui/container-scroll-animation";
import { ColourfulText } from "@saasfly/ui/colorful-text";

export function VideoScroll({
  dict,
}: {
  dict: Record<string, string> | undefined;
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

  return (
    <div className="flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-2xl md:text-4xl font-semibold text-black dark:text-white">
              {dict?.first_text}
              <br />
              <span className="text-2xl md:text-6xl font-bold mt-1 leading-none">
                {dict?.second_text1}
                <ColourfulText text={dict?.time_text ?? ""} />
                {dict?.second_text2}
              </span>
            </h1>
          </>
        }
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Show images and play button if not playing */}
          {!isPlaying && (
            <>
              <Image
                src={`/images/coin.png`}
                alt="hero"
                height={720}
                width={1400}
                className="mx-auto rounded-2xl object-cover h-full object-left-top hidden xl:block md:block cursor-default"
                draggable={false}
              />
              <Image
                src={`/images/coin_mobile.jpg`}
                alt="hero"
                height={720}
                width={1400}
                className="mx-auto rounded-2xl object-cover h-full object-left-top block xl:hidden md:block"
                draggable={false}
              />
              {/* Play button overlay */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center z-20 focus:outline-none"
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
              className="absolute inset-0 w-full h-full object-cover rounded-2xl z-10"
              onEnded={handleEnded}
              controls={false}
              autoPlay
              playsInline
              muted
              >
            <source src="/videos/montage.mp4" type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          )}
        </div>
      </ContainerScroll>
    </div>
  );
}
