 

import { notFound } from "next/navigation";
import { DocsPageHeader } from "~/components/docs/page-header";
import { Mdx } from "~/components/content/mdx-components";

import { WhitepaperLayout } from "~/components/whitepaper/layout";
import { getTableOfContents } from "~/lib/toc";
import { allWhitepapers } from ".contentlayer/generated";
import { getDictionary } from "~/lib/get-dictionary";

import "~/styles/mdx.css";

import type { Metadata } from "next";

import { env } from "~/env.mjs";
import { absoluteUrl } from "~/lib/utils";

interface WhitepaperPageProps {
  params: Promise<{
    slug: string[];
    lang: string;
  }>;
}

function getWhitepaperFromParams(params: { slug: string[]; lang: string }) {
  const slug = params.slug?.join("/") || "";
  const lang = params.lang;
  if (slug) {
    const whitepaper = allWhitepapers.find(
      (doc) => doc.slugAsParams === slug && doc.locale === lang,
    );
    return whitepaper;
  }
  
  const whitepapersForLang = allWhitepapers.filter((doc) => doc.locale === lang);
  const sortedWhitepapers = whitepapersForLang.sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  return sortedWhitepapers[0];
}

export async function generateMetadata(
  props: WhitepaperPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const whitepaper = getWhitepaperFromParams(params);

  if (!whitepaper) {
    return {};
  }

  const url = env.NEXT_PUBLIC_APP_URL;

  const ogUrl = new URL(`${url}/api/og`);
  ogUrl.searchParams.set("heading", whitepaper.description ?? whitepaper.title);
  ogUrl.searchParams.set("type", "Whitepaper");
  ogUrl.searchParams.set("mode", "dark");

  return {
    title: whitepaper.title,
    description: whitepaper.description,
    openGraph: {
      title: whitepaper.title,
      description: whitepaper.description,
      type: "article",
      url: absoluteUrl(whitepaper.slug),
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: whitepaper.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: whitepaper.title,
      description: whitepaper.description,
      images: [ogUrl.toString()],
    },
  };
}

export function generateStaticParams(): Promise<WhitepaperPageProps["params"][]> {
  return Promise.resolve(allWhitepapers.map((doc) => ({
    slug: doc.slugAsParams.split("/"),
    lang: doc.locale,
  })));
}

export default async function WhitepaperPage(props: WhitepaperPageProps) {
  const params = await props.params;
  const whitepaper = getWhitepaperFromParams(params);
  const dict = await getDictionary(params.lang);

  if (!whitepaper) {
    notFound();
  }

  const toc = await getTableOfContents(whitepaper.body.raw);

  return (
    <WhitepaperLayout toc={toc} dict={dict.whitepaper}>
      <DocsPageHeader heading={whitepaper.title} text={whitepaper.description} />
      <Mdx code={whitepaper.body.code} />
    </WhitepaperLayout>
  );
}