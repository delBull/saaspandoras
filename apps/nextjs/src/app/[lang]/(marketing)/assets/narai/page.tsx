"use client";

import React from "react";
import Link from "next/link";
import { Post, Organization } from "@saasfly/ui/icons";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Locale } from "~/config/i18n-config";
import { Help } from "@saasfly/ui/icons";
import * as Tooltip from "@radix-ui/react-tooltip";

interface PropertyDetailTooltips {
  availability: string;
  stage: string;
  roi: string;
  benefits: string;
  value: string;
}

interface PropertyDetails {
  availability: string;
  stage: string;
  roi: string;
  benefits: string;
  value: string;
  tooltips: PropertyDetailTooltips;
}
  
  interface PropertyData {
    title: string;
    description: string;
    legalButton: string;
    constructionButton: string;
    details: PropertyDetails;
    features: string[];
    gallery: string[];
  }
  
  interface PropertyDataByLang {
    en: PropertyData;
    es: PropertyData;
    ja: PropertyData;
    ko: PropertyData;
    zh: PropertyData;
  }

  const propertyData: PropertyDataByLang = {
  en: {
    title: "Narai Ocean View Luxury Condominium",
    description: "Luxury condominiums with breathtaking ocean views in an exclusive location",
    legalButton: "Legal Details",
    constructionButton: "Construction Details",
    details: {
      availability: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Right of Occupancy",
      value: "Surplus value",
      tooltips: {
        availability: "Total number of Narai Shares available for this property",
        stage: "Current investment stage, exclusive for family and friends",
        roi: "Expected Return on Investment per year",
        benefits: "Right to occupy the property according to share ownership",
        value: "Potential increase in property value over time"
      }
    },
    features: [
      "Ocean view from all rooms",
      "High-end finishes",
      "Beach access",
      "24/7 security",
      "Pool and spa",
      "Fitness center",
    ],
    gallery: [
      "/images/narai/loft.jpg",
      "/images/narai/living.jpg",
      "/images/narai/kitchen.jpg",
      "/images/narai/bedroom.jpg",
    ],
  },
  es: {
    title: "Condominio de Lujo Narai con Vista al Mar",
    description: "Condominios de lujo con impresionantes vistas al océano en una ubicación exclusiva",
    legalButton: "Detalles Legales",
    constructionButton: "Detalles de Construcción",
    details: {
      availability: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Derecho de Ocupación",
      value: "Plusvalía",
      tooltips: {
        availability: "Número total de Narai Shares disponibles para esta propiedad",
        stage: "Etapa actual de inversión, exclusiva para familia y amigos",
        roi: "Retorno de inversión esperado por año",
        benefits: "Derecho a ocupar la propiedad según la propiedad de acciones",
        value: "Potencial incremento en el valor de la propiedad con el tiempo"
      }
    },
    features: [
      "Vista al mar desde todas las habitaciones",
      "Acabados de alta gama",
      "Acceso a la playa",
      "Seguridad 24/7",
      "Piscina y spa",
      "Centro de fitness",
    ],
    gallery: [
        "/images/narai/loft.jpg",
        "/images/narai/living.jpg",
        "/images/narai/kitchen.jpg",
        "/images/narai/bedroom.jpg",
      ],
    },
    ja: {
        title: "ナライ オーシャンビュー ラグジュアリーコンドミニアム",
        description: "絶好のロケーションにある、息をのむような海の眺めを望む高級コンドミニアム",
        legalButton: "法的詳細",
        constructionButton: "建設詳細",
        details: {
          availability: "30,000,000 Narai株式",
          stage: "家族と友人",
          roi: "16%",
          benefits: "占有権",
          value: "剰余価値",
          tooltips: {
            availability: "この物件で利用可能なナライシェアの総数",
            stage: "現在の投資段階、家族や友人限定",
            roi: "年間予想投資収益率",
            benefits: "株式保有に応じた物件占有権",
            value: "時間経過による物件価値の潜在的な上昇"
          }
        },
        features: [
          "全室オーシャンビュー",
          "高級仕上げ",
          "ビーチへのアクセス",
          "24時間セキュリティ",
          "プールとスパ",
          "フィットネスセンター",
        ],
        gallery: [
            "/images/narai/loft.jpg",
            "/images/narai/living.jpg",
            "/images/narai/kitchen.jpg",
            "/images/narai/bedroom.jpg",
          ],
      },
      ko: {
        title: "나라이 오션 뷰 럭셔리 콘도미니엄",
        description: "독점적인 위치에서 탁 트인 바다 전망을 자랑하는 럭셔리 콘도미니엄",
        legalButton: "법적 세부사항",
        constructionButton: "건설 세부사항",
        details: {
          availability: "30,000,000 나라이 주식",
          stage: "가족 & 친구들",
          roi: "16%",
          benefits: "점유권",
          value: "잉여가치",
          tooltips: {
            availability: "이 부동산에 사용 가능한 총 나라이 쉐어 수",
            stage: "현재 투자 단계, 가족 및 친구 전용",
            roi: "연간 예상 투자 수익률",
            benefits: "주식 소유권에 따른 부동산 점유권",
            value: "시간 경과에 따른 잠재적 부동산 가치 상승"
          }
        },
        features: [
          "모든 방에서 바다 전망",
          "고급 마감재",
          "해변 접근성",
          "24시간 보안",
          "수영장과 스파",
          "피트니스 센터",
        ],
        gallery: [
            "/images/narai/loft.jpg",
            "/images/narai/living.jpg",
            "/images/narai/kitchen.jpg",
            "/images/narai/bedroom.jpg",
          ],
      },
      zh: {
        title: "奈莱海景豪华公寓",
        description: "位于独特位置的豪华公寓，拥有令人惊叹的海景",
        legalButton: "法律详情",
        constructionButton: "建设详情",
        details: {
          availability: "30,000,000 股 Narai 股票",
          stage: "家人和朋友",
          roi: "16%",
          benefits: "占用权",
          value: "剩余价值",
          tooltips: {
            availability: "该房产可用的奈莱股份总数",
            stage: "当前投资阶段，仅限家人和朋友",
            roi: "预期年投资回报率",
            benefits: "根据股份所有权的房产占用权",
            value: "随时间推移的潜在房产增值"
          }
        },
        features: [
          "所有房间都能看到海景",
          "高端装修",
          "海滩通道",
          "24小时安保",
          "游泳池和水疗",
          "健身中心",
        ],
        gallery: [
            "/images/narai/loft.jpg",
            "/images/narai/living.jpg",
            "/images/narai/kitchen.jpg",
            "/images/narai/bedroom.jpg",
          ],
    },
};

export default function NaraiPage({ params: { lang } }: { params: { lang: Locale } }) {
  const data = propertyData[lang] || propertyData.en;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full rounded-2xl overflow-hidden mb-8">
        <Image
          src="/images/narai.jpg"
          alt="Narai Property"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40">
  {/* Text container */}
  <div className="absolute bottom-24 sm:bottom-8 left-4 sm:left-8 text-white">
    <h1 className="text-2xl sm:text-4xl font-bold mb-2">{data.title}</h1>
    <p className="text-base sm:text-xl max-w-2xl">{data.description}</p>
  </div>

  {/* Buttons container - centered on mobile */}
  <div className="absolute bottom-4 sm:bottom-8 left-0 sm:left-auto right-0 sm:right-8 flex justify-center sm:justify-end gap-2 sm:gap-4 px-4 sm:px-0">
    <Link
      href={`/${lang}/assets/narai/legal`}
      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all text-xs sm:text-base"
    >
      <Post className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>{data.legalButton}</span>
    </Link>

    <Link
      href={`/${lang}/assets/narai/construction`}
      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all text-xs sm:text-base"
    >
      <Organization className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>{data.constructionButton}</span>
    </Link>
  </div>
</div>
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="col-span-2">
          <h2 className="text-2xl font-bold mb-4">Property Details</h2>
          
<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  {Object.entries(data.details).map(([key, value]) => {
    if (key === 'tooltips') return null; // Skip tooltips object
    return (
      <div key={key} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
            {key}
          </div>
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                  <Help className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  className="max-w-xs bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-1.5 text-sm rounded-lg shadow-lg"
                  side="top"
                  sideOffset={5}
                >
                  {data.details.tooltips[key as keyof PropertyDetailTooltips]}
                  <Tooltip.Arrow className="fill-neutral-900 dark:fill-white" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <div className="text-lg font-semibold mt-1">{value}</div>
      </div>
    );
  })}
</div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <ul className="space-y-2">
            {data.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-lime-300 rounded-full mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.gallery.map((image, index) => (
            <motion.div
              key={index}
              className="relative h-64 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={image}
                alt={`Property image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={85}
                className="object-cover"
                priority={index === 0}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}