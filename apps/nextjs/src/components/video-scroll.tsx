"use client";

//import Link from "next/link";
import Image from "next/image";

import { ContainerScroll } from "@saasfly/ui/container-scroll-animation";
import { ColourfulText } from "@saasfly/ui/colorful-text";

export function VideoScroll({
  dict,
}: {
  dict: Record<string, string> | undefined;
}) {
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
        <div className="pointer-events-none">
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
        </div>
      </ContainerScroll>
    </div>
  );
}
