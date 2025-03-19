"use client";

import React from "react";
import Link from "next/link";
import { Post, Organization } from "@saasfly/ui/icons";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Locale } from "~/config/i18n-config";

interface PropertyDetails {
    availabilty: string;
    stage: string;
    roi: string;
    benefits: string;
    value: string;
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
      availabilty: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Right of Occupancy",
      value: "Surplus value",
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
      availabilty: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Derecho de Ocupación",
      value: "Plusvalía",
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
          availabilty: "30,000,000 Narai株式",
          stage: "家族と友人",
          roi: "16%",
          benefits: "占有権",
          value: "剰余価値",
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
          availabilty: "30,000,000 나라이 주식",
          stage: "가족 & 친구들",
          roi: "16%",
          benefits: "점유권",
          value: "잉여가치",
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
          availabilty: "30,000,000 股 Narai 股票",
          stage: "家人和朋友",
          roi: "16%",
          benefits: "占用权",
          value: "剩余价值",
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
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{data.title}</h1>
            <p className="text-xl">{data.description}</p>
          </div>

            {/* Buttons container */}
          <div className="absolute bottom-8 right-8 flex gap-4">
            <Link
              href={`/${lang}/assets/narai/legal`}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg font-mono font-semibold text-white transition-all"
            >
            <Post className="w-4 h-4" />
              <span>{data.legalButton}</span>
            </Link>
      
            <Link
              href={`/${lang}/assets/narai/construction`}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg font-mono font-semibold text-white transition-all"
            >
            <Organization className="w-4 h-4" />
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
            {Object.entries(data.details).map(([key, value]) => (
              <div key={key} className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                  {key}
                </div>
                <div className="text-lg font-semibold">{value}</div>
              </div>
            ))}
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