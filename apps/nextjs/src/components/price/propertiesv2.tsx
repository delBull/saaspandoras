"use client";

//import { useState } from "react";
//import { motion, AnimatePresence } from "framer-motion";
//import Image from "next/image";
import React, { useState } from "react";
import { Button } from "@saasfly/ui/button";
import Link from "next/link";
import { GlowingEffect } from "@saasfly/ui/glowing-effect";
import * as Icons from "@saasfly/ui/icons";
import { motion, AnimatePresence } from "framer-motion";
import { AssetTabs } from "~/components/price/assets-tabs";

const data = {
  en: {
    title1: "Casa Bella",
    description1: "A luxury villa with sea view and high-end finishes.",
    title2: "Horizon View",
    description2: "The best view of the Bay in a wonderful place.",
    title3: "Narai",
    description3: "Condominiums with ocean views, comfort, beach and luxury have never been so close.",
    buttons: {
      details: "Details",
      getTokens: "Get Tokens"
    },
    assets: {
      title: "Asset Categories",
      description: "",
      real_estate: "Real Estate",
      startups: "Startups",
      others: "Others",
      coming_soon: "Coming soon"
    }
  },
  es: {
    title1: "Casa Bella",
    description1: "Una villa de lujo con vista al mar y acabados de alta gama.",
    title2: "Vista Horizonte",
    description2: "La mejor vista de la Bahía en un lugar maravilloso.",
    title3: "Narai",
    description3: "Condominios con vista al mar, comodidad, playa y lujo jamás estuvieran tan cerca.",
    buttons: {
      details: "Detalles",
      getTokens: "Obtener Tokens"
    },
    assets: {
      title: "Categorías de Activos",
      description: "",
      real_estate: "Inmobiliarios",
      startups: "Startups",
      others: "Otros",
      coming_soon: "Próximamente"
    }
  },
  ja: {
    title1: "カーサベラ",
    description1: "海の景色とハイエンドの仕上げが施された豪華なヴィラ。",
    title2: "ホライゾンビュー",
    description2: "素晴らしい場所での湾の最高の眺め。",
    title3: "Narai",
    description3: "オーシャンビュー、快適さ、ビーチ、豪華さを備えたコンドミニアムは、かつてないほど近くにありました。",
    buttons: {
      details: "詳細",
      getTokens: "トークンを取得"
    },
    assets: {
      title: "資産カテゴリー",
      description: "",
      real_estate: "不動産",
      startups: "スタートアップ",
      others: "その他",
      coming_soon: "近日公開"
    }
  },
  ko: {
    title1: "카사 벨라",
    description1: "바다 전망과 고급 마감재를 갖춘 고급 빌라입니다.",
    title2: "호라이즌 뷰",
    description2: "멋진 장소에서만의 최고의 전망.",
    title3: "Narai",
    description3: "바다 전망, 편안함, 해변, 고급스러움을 갖춘 콘도미니엄이 이렇게 가까이 있었던 적은 없었습니다.",
    buttons: {
      details: "상세정보",
      getTokens: "토큰 받기"
    },
    assets: {
      title: "자산 카테고리",
      description: "",
      real_estate: "부동산",
      startups: "스타트업",
      others: "기타",
      coming_soon: "출시 예정"
    }
  },
  zh: {
    title1: "Casa Bella（贝拉之家酒店）",
    description1: "海景豪华别墅，拥有高端饰面。",
    title2: "Horizon View",
    description2: "在美妙的地方欣赏海湾的最佳景观。",
    title3: "Narai",
    description3: "拥有海景、舒适、海滩和豪华的公寓从未如此接近。",
    buttons: {
      details: "详情",
      getTokens: "获取代币"
    },
    assets: {
      title: "资产类别",
      description: "",
      real_estate: "房地产",
      startups: "创业公司",
      others: "其他",
      coming_soon: "即将推出"
    }
  }
};

export default function PropertiesPage({ lang }: { lang: 'en' | 'es' | 'ja' | 'ko' | 'zh' }) {
  const dict = data[lang];
  if (!dict) {
    console.error(`Invalid language: ${lang}`);
    return null;
  }

  console.log("dict:", dict);

  return (
    <div className="px-5 space-y-8">
      {/* Title and Description Section */}
      <div className="ml-5 space-y-4 -mb-5">
        <h1 className="text-2xl font-normal tracking-tight sm:text-1xl text-foreground text-gray-400">
          {dict.assets?.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {dict.assets?.description}
        </p>
      </div>

      {/* Asset Tabs */}
      <AssetTabs lang={lang} dict={dict.assets} />

      {/* Properties Grid */}
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-2 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
    <GridItem
        area="md:[grid-area:1/1/3/7] xl:[grid-area:1/1/3/7]"
        icon={<Icons.Rocket className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title3}
        description={dict.description3}
        background="/images/narai_blk.jpg"
        link="/assets/narai"
        buttonTexts={dict.buttons}
        lang={lang}
      />
     
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:1/7/2/13]"
        icon={<Icons.Spinner className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title1}
        description={dict.description1}
        link=""
        buttonTexts={dict.buttons}
        lang={lang}
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:2/7/3/13]"
        icon={<Icons.Spinner className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title2}
        description={dict.description2}
        link=""
        buttonTexts={dict.buttons}
        lang={lang}
      />

    </ul>
  </div>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  link?: string;
  background?: string;
  buttonTexts: {
    details: string;
    getTokens: string;
  };
  lang: string;
}

const GridItem = ({ area, icon, title, description, link, background, buttonTexts, lang }: GridItemProps) => {
  const [showToast, setShowToast] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (!link) {
      event.preventDefault();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };
  
  const fullLink = link ? `/${lang}${link}` : "#";

  return (
<li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2.5xl border dark:border-neutral-800 p-2 md:rounded-3xl md:p-3"
      style={{
        backgroundImage: background ? `url(${background})` : 'none',
        backgroundSize: 'cover', // Ajusta la imagen al tamaño del contenedor
        backgroundPosition: 'center', // Centra la imagen
        backgroundRepeat: 'no-repeat', // Evita que la imagen se repita
      }}
      >
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <Link href={fullLink} onClick={handleClick}>
          <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6 dark:bg-neutral-900/40">
            <div className="relative flex flex-1 flex-col justify-between gap-3">
              <div className="w-fit rounded-lg border border-gray-600 dark:border-neutral-800 p-2">
                {icon}
              </div>
              <div className="space-y-3">
                <h3 className="pt-0.5 text-xl/[1.375rem] font-semibold font-sans -tracking-4 md:text-2xl/[1.875rem] text-balance text-black dark:text-white">
                  {title}
                </h3>
                <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm/[1.125rem] md:text-base/[1.375rem] text-black dark:text-neutral-200">
                  {description}
                </h2>
                <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={handleClick}>
                  {buttonTexts.details}
                </Button>
                <Button variant="default">
                  {buttonTexts.getTokens}
                </Button>
              </div>
              </div>
            </div>
          </div>
        </Link>
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed top-20 right-10 z-[9999] transform -translate-x-1/2 bg-lime-300 text-black px-4 py-2 rounded-md shadow-lg"
            >
              Coming soon!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
};