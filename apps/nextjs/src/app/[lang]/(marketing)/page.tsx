import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "~/lib/get-dictionary";

import { CodeCopy } from "~/components/code-copy";
import { Comments } from "~/components/comments";
import { FeaturesGrid } from "~/components/features-grid";
import { RightsideMarketing } from "~/components/rightside-marketing";

import { AnimatedTooltip } from "@saasfly/ui/animated-tooltip";
import { BackgroundLines } from "@saasfly/ui/background-lines";
import { Button } from "@saasfly/ui/button";
import { ColourfulText } from "@saasfly/ui/colorful-text";
import * as Icons from "@saasfly/ui/icons";

import type { Locale } from "~/config/i18n-config";
import {VideoScroll} from "~/components/video-scroll";

const people = [
  {
    id: 1,
    name: "Juan",
    designation: "This is amazing",
    image: "https://avatars.githubusercontent.com/u/10096899",
  },
  {
    id: 2,
    name: "Dany",
    designation: "We can do so much",
    image: "https://avatars.githubusercontent.com/u/10334353",
  },
  {
    id: 3,
    name: "Alan",
    designation: "Real World Assets has evolved",
    image: "https://avatars.githubusercontent.com/u/3849293",
  },
  {
    id: 4,
    name: "Pablo",
    designation: "Investmet is accesible now",
    image: "https://avatars.githubusercontent.com/u/22560152",
  },
  {
    id: 5,
    name: "Cesar",
    designation: "Funding has never been this easy",
    image: "https://avatars.githubusercontent.com/u/3316062",
  },
  {
    id: 6,
    name: "Susana",
    designation: "What a way to distribute wealth",
    image: "https://avatars.githubusercontent.com/u/41265413",
  },
];

export default async function IndexPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const dict = await getDictionary(lang);

  return (
    <>
      <section className="container">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
          <div className="flex flex-col items-start h-full">
            <BackgroundLines className="h-full">
              <div className="flex flex-col pt-4 md:pt-36 lg:pt-36 xl:pt-36">
                <div className="mt-20">
                  <div
                    className="mb-0 max-w-4xl text-left text-4xl font-semibold dark:text-zinc-100 md:text-5xl xl:text-5xl md:leading-[4rem] xl:leading-[4rem]">
                    {dict.marketing.title || "Ship your apps to the world easier with "}
                    {/*<br/>
                    <ColourfulText text="Pandora's"/>}*/}
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-neutral-500 dark:text-neutral-400 sm:text-lg">
                    {dict.marketing.sub_title || "Complete solution for building next-gen investment"}
                  </span>
                </div>

                <div
                  className="mb-4 mt-6 flex w-full flex-col justify-center space-y-4 sm:flex-row sm:justify-start sm:space-x-8 sm:space-y-0 z-10">
                  <Link href="#" target="_blank">
                    <Button
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg px-6 h-12 font-medium">
                      {dict.marketing.get_started}
                      <Icons.ArrowRight className="h-5 w-5"/>
                    </Button>
                  </Link>

                  <CodeCopy/>
                </div>

                <div className="flex xl:flex-row flex-col items-center justify-start mt-4 w-full">
                  <div className="flex">
                    <AnimatedTooltip items={people}/>
                  </div>
                  <div className="flex flex-col items-center justify-start ml-8">
                    <div className="w-[340px]">
                      <text className="font-semibold"> </text>
                      <text
                        className="text-neutral-500 dark:text-neutral-400">{dict.marketing.contributors.contributors_desc}</text>
                        <text
                        className="text-neutral-500 dark:text-neutral-400">{dict.marketing.contributors.developers_first}</text>
                      <ColourfulText text=" startups"/>
                      <text
                        className="text-neutral-500 dark:text-neutral-400">{dict.marketing.contributors.developers_second}</text>
                    </div>
                  </div>
                </div>
              </div>
            </BackgroundLines>
          </div>

          <div className="h-full w-full xl:block bg-background">
            <div className="flex flex-col pt-0 xl:pt-44">
              <RightsideMarketing dict={dict.marketing.right_side}/>
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-8 md:mt-[50px] xl:mt-[-50px]">
        <FeaturesGrid dict={dict.marketing.features_grid}/>
      </section>

      <section className="container pt-24">
        <div className="flex flex-col justify-center items-center pt-10">
          <div className="text-lg text-neutral-500 dark:text-neutral-400">{dict.marketing.sponsor.title}</div>
          <div className="mt-4 flex items-center gap-4">
            <Link href="https://www.costasierrarealty.com" target="_blank">
              <Image src="/images/costa_sierra.avif" width="48" height="48" alt="twillot" className="filter brightness-0 invert contrast-100"/>
            </Link>
            <Link href="https://www.agodecosystem.com" target="_blank">
              <Image src="/images/agod.png" width="48" height="48" alt="setupyourpay" />
            </Link>
            <Link href="#" target="_blank">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:bg-accent dark:hover:bg-neutral-800/30">
                <Icons.Heart className="w-5 h-5 fill-pink-600 text-pink-600 dark:fill-pink-700 dark:text-pink-700" />
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-200">{dict.marketing.sponsor.donate || ''}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pt-8">
        <VideoScroll dict={dict.marketing.video}/>
      </section>

      <section className="w-full px-8 pt-10 sm:px-0 sm:pt-24 md:px-0 md:pt-24 xl:px-0 xl:pt-24">
        <div className="flex h-full w-full flex-col items-center pb-[100px] pt-10">
          <div>
            <h1 className="mb-6 text-center text-3xl font-bold dark:text-zinc-100 md:text-5xl">
              {dict.marketing.people_comment.title}
            </h1>
          </div>
          <div className="mb-6 text-lg text-neutral-500 dark:text-neutral-400">
            {dict.marketing.people_comment.desc}
          </div>

          <div className="w-full overflow-x-hidden">
            <Comments/>
          </div>
        </div>
      </section>
    </>
  );
}
