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
import { useWalletInfo } from "thirdweb/react";

{/*
  const properties = [
  {
    id: "1",
    title: "Narai",
    price: "120,000,000 MXN",
    image: "/images/coin.png",
    description: "Una villa de lujo con vista al mar y acabados de alta gama.",
  },
  {
    id: "2",
    title: "Downtown Apartment",
    price: "300,000 USDC",
    image: "/images/coin.png",
    description: "Moderno apartamento en el centro de la ciudad, excelente inversión.",
  },
]; 
*/}

const data = {
  en: {
    title1: "Casa Bella",
    description1: "A luxury villa with sea view and high-end finishes.",
    title2: "Downtown Apartment",
    description2: "Modern apartment in the city center, excellent investment.",
    title3: "Narai",
    description3: "Condominiums with ocean views, comfort, beach and luxury have never been so close.",
  },
  es: {
    title1: "Casa Bella",
    description1: "Una villa de lujo con vista al mar y acabados de alta gama.",
    title2: "Apartamento en el Centro",
    description2: "Moderno apartamento en el centro de la ciudad, excelente inversión.",
    title3: "Narai",
    description3: "Condominios con vista al mar, comodidad, playa y lujo jamás estuvieran tan cerca.",
  },
  ja: {
    title1: "カーサベラ",
    description1: "海の景色と高級仕上げのある豪華なヴィラ。",
    title2: "ダウンタウンアパートメント",
    description2: "市の中心部にあるモダンなアパートメント、優れた投資。",
    title3: "Narai",
    description3: "オーシャンビュー、快適さ、ビーチ、豪華さを備えたコンドミニアムは、かつてないほど近くにありました。",
  },
  ko: {
    title1: "카사 벨라",
    description1: "바다 전망과 고급 마감재가 있는 럭셔리 빌라.",
    title2: "다운타운 아파트",
    description2: "도심에 위치한 현대적인 아파트, 훌륭한 투자.",
    title3: "Narai",
    description3: "바다 전망, 편안함, 해변, 고급스러움을 갖춘 콘도미니엄이 이렇게 가까이 있었던 적은 없었습니다.",
  },
  zh: {
    title1: "Casa Bella（贝拉之家酒店）",
    description1: "拥有海景和高端装修的豪华别墅。",
    title2: "市中心公寓",
    description2: "市中心的现代公寓，绝佳的投资。",
    title3: "Narai",
    description3: "拥有海景、舒适、海滩和豪华的公寓从未如此接近。",
  },
};

export default function PropertiesPage({ lang }: { lang: 'en' | 'es' | 'ja' | 'ko' | 'zh' }) {
  const dict = data[lang];
  if (!dict) {
    console.error(`Invalid language: ${lang}`);
    return null;
  }

  console.log("dict:", dict);

  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-2 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/7]"
        icon={<Icons.Rocket className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title1}
        description={dict.description1}
        link=""
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/7]"
        icon={<Icons.Cloud className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title2}
        description={dict.description2}
        link=""
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/7/3/13]"
        icon={<Icons.ThumbsUp className="h-4 w-4 text-black dark:text-neutral-400" />}
        title={dict.title3}
        description={dict.description3}
        background="/images/narai_blk.jpg"
        link="/properties/narai"
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  link?: string;
  background?: string;
}

const GridItem = ({ area, icon, title, description, link, background }: GridItemProps) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { wallet, isConnected } = useWalletInfo();

  const handleClick = (event: React.MouseEvent) => {
    if (!link) {
      event.preventDefault();
      setToastMessage("Coming soon!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleGetTokens = () => {
    if (!wallet) {
      setToastMessage("Please connect your wallet using the button in the navigation bar");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      // Lógica para obtener tokens cuando la wallet está conectada
      setToastMessage("Token functionality coming soon!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };
  

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
        <Link href={link ?? "#"} target="_blank" onClick={handleClick}>
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
                  Details
                </Button>
                <Button variant="default" onClick={handleGetTokens}>
                  Get Tokens
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
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
};
{/*
<div className="flex justify-between mt-4">
                <Button variant="outline">
                  Details
                </Button>
                <Button variant="default">
                  Get Tokens
                </Button>
              </div>
*/}