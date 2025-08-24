import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "~/lib/get-dictionary";
import { TransformTokenDetails } from "~/components/tokendetails";
import { InvestmentSteps } from "~/components/investment-steps";
import { AboutPandoras } from "~/components/about-pandoras";
import { NFTGatingMint } from "~/components/nft-gating-mint";
//import { Comments } from "~/components/comments";
//import Aurora from "~/components/aurora-background";
import * as Icons from "@saasfly/ui/icons";
import type { Locale } from "~/config/i18n-config";
import { VideoScroll } from "~/components/video-scroll";
import { FeaturesSectionDemo } from "~/components/features-section";
import { ShimmerDotHero } from "~/components/ShimmerDotHero";

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
      <NFTGatingMint />
      {/*
      <div className="fixed inset-0 -z-10 opacity-75 rotate-180">
        <Aurora
          colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.5}
        />
      </div>
      */}
      <section id="hero">
      <ShimmerDotHero dict={dict} />
      </section>

      <section id="about-pandoras" className="container md:mt-44 md:mb-20">
        <AboutPandoras dict={dict.marketing} />
      </section>
      
      <section id="investment-steps" className="container">
        <InvestmentSteps dict={dict.marketing.investment_steps} />
      </section>

      <section id="benefits-market" className="container mt-20">
        <FeaturesSectionDemo
          {...dict.marketing.benefits_market}
          skeleton_one={dict.marketing.skeleton_one}
          skeleton_two={dict.marketing.skeleton_two}
        />
      </section>

      <section id="sponsor" className="container pt-24">
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
      {/*
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
      */}
    </>
  );
}
