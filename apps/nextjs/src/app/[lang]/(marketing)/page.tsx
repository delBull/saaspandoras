import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "~/lib/get-dictionary";
import { TransformTokenDetails } from "~/components/tokendetails";
import { InvestmentSteps } from "~/components/investment-steps";
import { ScrollButton } from "~/components/scroll-button";
import { PinContainer } from "~/components/ui/3d-pin";

import { CodeCopy } from "~/components/code-copy";
import { Comments } from "~/components/comments";

import { AnimatedTooltip } from "@saasfly/ui/animated-tooltip";
import Aurora from "~/components/aurora-background";
import { ColourfulText } from "@saasfly/ui/colorful-text";
import * as Icons from "@saasfly/ui/icons";

import type { Locale } from "~/config/i18n-config";
import { VideoScroll } from "~/components/video-scroll";

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

export default async function IndexPage(props: {
  params: Promise<{
    lang: Locale;
  }>;
}) {
  const params = await props.params;

  const { lang } = params;

  const dict = await getDictionary(lang);

  return (
    <>
      <div className="fixed inset-0 -z-10 opacity-75 rotate-180">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>

  <section className="w-full h-screen px-4 md:px-8 xl:px-16">
  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 h-full">
          <div className="flex flex-col items-start h-full">
            <div className="flex flex-col pt-4 mt-40 md:mb-0 mb-10">
              <div>
                <div className="mb-0 max-w-4xl text-left text-4xl font-semibold dark:text-zinc-100 md:text-5xl xl:text-5xl leading-none">
                  {dict.marketing.title ||
                    "Ship your apps to the world easier with "}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-neutral-500 dark:text-neutral-400 md:text-2xl text-xl">
                  {dict.marketing.sub_title ||
                    "Complete solution for building next-gen investment"}
                </span>
              </div>

              <div className="mb-4 mt-6 flex w-full flex-col justify-center space-y-4 sm:flex-row sm:justify-start sm:space-x-8 sm:space-y-0 z-10">
                <ScrollButton text={dict.marketing.get_started} />
                <CodeCopy />
              </div>

              <div className="flex xl:flex-row flex-col items-center justify-start mt-4 w-full">
                <div className="flex">
                  <AnimatedTooltip items={people} />
                </div>
                <div className="flex flex-col items-center justify-start mx-4 mb-10 md:mb-0 xl:ml-8">
                  <div className="w-full max-w-[340px] px-4 xl:px-0">
                    <div className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">
                      <span>
                        {dict.marketing.contributors.contributors_desc}
                      </span>
                      <span>
                        {dict.marketing.contributors.developers_first}
                      </span>
                      <ColourfulText text=" startups" />
                      <span>
                        {dict.marketing.contributors.developers_second}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="h-full w-full flex flex-col justify-center items-center xl:flex-row xl:justify-end xl:items-end mt-10 md:mt-0">
            <div className="flex flex-nowrap items-center justify-center gap-2 md:flex-wrap md:gap-8">
              <div className="transform -rotate-12">
                <PinContainer title="Your Next Property">
                  <div className="w-36 h-[36vh] md:w-80 md:h-[32rem]">
                    <div className="absolute top-1 z-10 p-4">
                      <span className="mt-10 flex font-mono text-xs md:text-lg leading-0 text-zinc-100">
                        Digital Assets
                      </span>
                      <span className="flex font-mono text-xs md:text-lg leading-0 text-zinc-100">
                        Get them from anywhere you are
                      </span>
                    </div>
                    <img
                      src="/images/jaguar.jpg"
                      alt="Preview"
                      className="absolute inset-0 h-full w-full rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 h-full w-full rounded-lg bg-black/40 backdrop-blur-xs"></div>
                  </div>
                </PinContainer>
              </div>
              <div className="transform rotate-6">
                <PinContainer title="Your Next Token">
                  <div className="w-36 h-[36vh] md:w-80 md:h-[32rem]">
                    <div className="absolute top-1 z-10 p-4">
                      <span className="mt-10 flex font-mono text-xs md:text-lg leading-0 text-zinc-900">
                        Real World Assets
                      </span>
                      <span className="flex font-mono text-xs md:text-lg leading-0 text-zinc-900">
                        Get them from anywhere you are
                      </span>
                    </div>
                    <img
                      src="/images/nft.png"
                      alt="Preview"
                      className="absolute inset-0 h-full w-full rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 h-full w-full rounded-lg bg-white/5 backdrop-blur-xs"></div>
                  </div>
                </PinContainer>
              </div>
            </div>
          </div>
          
        </div>
      </section>
      
      <section id="investment-steps" className="container mt-20 md:mt-32">
        <InvestmentSteps dict={dict.marketing.investment_steps} />
      </section>

      <section className="container pt-24">
        <div className="flex flex-col justify-center items-center pt-10">
          <div className="text-lg text-neutral-500 dark:text-neutral-400">
            {dict.marketing.sponsor.title}
          </div>
          <div className="mt-4 flex items-center gap-4">
            <Link href="https://www.costasierrarealty.com" target="_blank">
              <Image
                src="/images/costa_sierra.png"
                width="48"
                height="48"
                alt="Costa Sierra Realty"
                className="filter brightness-0 invert contrast-100"
                unoptimized
              />
            </Link>
            <Link href="https://www.agodecosystem.com" target="_blank">
              <Image
                src="/images/agod.png"
                width="48"
                height="48"
                alt="Pandora's"
              />
            </Link>
            <Link href={`/${lang}/pricing`}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:bg-accent dark:hover:bg-neutral-800/30">
                <Icons.Heart className="w-5 h-5 fill-lime-300 text-lime-300 dark:fill-lime-300 dark:text-lime-300" />
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-200">
                  {dict.marketing.sponsor.donate || ""}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="container pt-8">
        <VideoScroll dict={dict.marketing.video} />
      </section>

      <section className="w-full px-8 sm:px-0 md:px-0 xl:px-0">
        <div className="flex h-full w-full flex-col items-center pb-[100px] pt-10">
          <div className="absolute z-[-100] opacity-50">
            <Image
              src="/images/logopure.png"
              width="480"
              height="480"
              alt="Pandora's"
            />
          </div>
          <div>
            <h1 className="mb-6 text-center text-3xl font-bold dark:text-zinc-100 md:text-5xl">
              {dict.marketing.transform_token.title}
            </h1>
          </div>
          <div className="group relative max-w-4xl p-8 transition-all duration-300 hover:scale-[1.01]">
            <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-8">
              <p className="text-center text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {dict.marketing.transform_token.desc}
              </p>
            </div>
          </div>
          <TransformTokenDetails dict={dict.marketing.transform_token} />
        </div>
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
            <Comments />
          </div>
        </div>
      </section>
    </>
  );
}
