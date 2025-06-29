"use client";

import React, { use } from "react";
import { useState } from "react";
import Link from "next/link";
import { Organization } from "@saasfly/ui/icons";
import { Money } from "@saasfly/ui/icons";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Locale } from "~/config/i18n-config";
import { Help } from "@saasfly/ui/icons";
import * as Tooltip from "@radix-ui/react-tooltip";
import { FullscreenImage } from "~/components/fullscreen-image";
import { ConstructionDashboard } from "~/components/construction-dashboard";
import { useInView } from "framer-motion";

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

interface ConstructionTab {
  id: string;
  title: string;
  content: string;
  pdfUrl: string;
}

interface PropertyData {
  title: string;
  description: string;
  getButton: string;
  constructionButton: string;
  details: PropertyDetails;
  features: string[];
  gallery: string[];
  constructionTitle?: string;
  constructionDescription?: string;
  constructionTabs: ConstructionTab[];
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
    description:
      "Luxury condominiums with breathtaking ocean views in an exclusive location",
    getButton: "Get Shares",
    constructionButton: "Project Details",
    details: {
      availability: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Right of Occupancy",
      value: "Surplus value",
      tooltips: {
        availability:
          "Total number of Narai Shares available for this property. A total of 100 million tokens will be issued in 3 investment stages with progressive pricing.",
        stage:
          "Current investment stage, exclusive to family and friends. Investors at this stage receive the best token price, the most benefits, and the right to occupy the property.",
        roi: "Estimated annual return on investment (ROI) of 16%, based on rental income and property appreciation. ROI may vary depending on the investment stage and market demand.",
        benefits:
          "Investors in Stage 0 and Stage 1 can access the property on specific dates, depending on the number of shares owned. Investors in Stage 2 receive financial returns without occupancy benefits.",
        value:
          "The price of each Narai Share will increase at each stage. Stage 0: 1 MXN/token, Stage 1: 1.5 MXN/token, Stage 2: 2 MXN/token, reflecting the property's value appreciation over time.",
      },
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
      "/images/narai/loft.png",
      "/images/narai/living.png",
      "/images/narai/kitchen.png",
      "/images/narai/bedroom.png",
      "/images/narai/terrace.png",
    ],
    constructionTitle: "Project Details",
    constructionDescription:
      "Detailed architectural plans and construction specifications for the Narai Ocean View Luxury Condominium project.",
    constructionTabs: [
      {
        id: "preliminary",
        title: "Preliminary Project",
        content: "Detailed architectural plans and initial specifications.",
        pdfUrl: "/docs/narai_anteproyecto.pdf",
      },
      {
        id: "engineering",
        title: "Engineering Details",
        content: "Structural and technical specifications.",
        pdfUrl: "",
      },
      {
        id: "legal",
        title: "Legal Details",
        content: "Legal documentation and ownership structure.",
        pdfUrl: "",
      },
    ],
  },
  es: {
    title: "Condominio de Lujo Narai con Vista al Mar",
    description:
      "Condominios de lujo con impresionantes vistas al océano en una ubicación exclusiva",
    getButton: "Adquiere Fracciones",
    constructionButton: "Detalles del Proyecto",
    details: {
      availability: "30,000,000 Narai Shares",
      stage: "Family & Friends",
      roi: "16%",
      benefits: "Derecho de Ocupación",
      value: "Plusvalía",
      tooltips: {
        availability:
          "Número total de Narai Shares disponibles para esta propiedad. En total, se emitirán 100 millones de tokens en 3 etapas de inversión con precios progresivos.",
        stage:
          "Etapa actual de inversión, exclusiva para familia y amigos. Los inversores en esta fase obtienen el mejor precio por token, mayores beneficios y derecho de ocupación.",
        roi: "Retorno de inversión estimado del 16% anual, basado en ingresos por renta y plusvalía del activo. El ROI puede variar dependiendo de la etapa de inversión y la demanda en el mercado.",
        benefits:
          "Los inversores en la Etapa 0 y Etapa 1 pueden acceder a la propiedad en ciertas fechas, según la cantidad de participaciones adquiridas. Los inversores de la Etapa 2 solo obtienen rentabilidad financiera sin acceso a la ocupación.",
        value:
          "El precio de cada Narai Share aumentará en cada etapa. Etapa 0: 1 MXN/token, Etapa 1: 1.5 MXN/token, Etapa 2: 2 MXN/token, reflejando la plusvalía de la propiedad conforme avanza la construcción.",
      },
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
      "/images/narai/loft.png",
      "/images/narai/living.png",
      "/images/narai/kitchen.png",
      "/images/narai/bedroom.png",
      "/images/narai/terrace.png",
    ],
    constructionTitle: "Detalles del Proyecto",
    constructionDescription:
      "Planes arquitectónicos detallados y especificaciones de construcción para el proyecto Condominio de Lujo Narai con Vista al Mar.",
    constructionTabs: [
      {
        id: "preliminary",
        title: "Anteproyecto",
        content:
          "Planes arquitectónicos detallados y especificaciones iniciales.",
        pdfUrl: "/docs/narai_anteproyecto.pdf",
      },
      {
        id: "engineering",
        title: "Detalles de Ingeniería",
        content: "Especificaciones estructurales y técnicas.",
        pdfUrl: "",
      },
      {
        id: "legal",
        title: "Detalles Legales",
        content: "Documentación legal y estructura de propiedad.",
        pdfUrl: "",
      },
    ],
  },
  ja: {
    title: "ナライ オーシャンビュー ラグジュアリーコンドミニアム",
    description:
      "絶好のロケーションにある、息をのむような海の眺めを望む高級コンドミニアム",
    getButton: "株式を取得",
    constructionButton: "プロジェクト詳細",
    details: {
      availability: "30,000,000 Narai株式",
      stage: "家族と友人",
      roi: "16%",
      benefits: "占有権",
      value: "剰余価値",
      tooltips: {
        availability:
          "この物件に利用可能な Narai シェアの総数。合計 1 億トークンが 3 つの投資段階で発行され、価格は段階的に上昇します。",
        stage:
          "現在の投資ステージ。家族や友人限定。 この段階の投資家は、最も低価格でトークンを購入でき、多くの特典を受け、物件を利用する権利を得られます。",
        roi: "年間推定投資収益率 (ROI) は 16%。賃貸収入と資産価値の上昇に基づきます。ROI は投資ステージや市場需要によって変動する可能性があります。",
        benefits:
          "ステージ 0 および ステージ 1 の投資家は、保有シェア数に応じて特定の日に物件を利用可能。ステージ 2 の投資家は、物件を利用できませんが、金銭的リターンが得られます。",
        value:
          "各 Narai シェアの価格は各ステージで上昇します。 ステージ 0: 1 MXN/トークン、ステージ 1: 1.5 MXN/トークン、ステージ 2: 2 MXN/トークン。物件の価値が上昇するにつれて価格も上がります。",
      },
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
      "/images/narai/loft.png",
      "/images/narai/living.png",
      "/images/narai/kitchen.png",
      "/images/narai/bedroom.png",
      "/images/narai/terrace.png",
    ],
    constructionTitle: "プロジェクト詳細",
    constructionDescription:
      "ナライ オーシャンビュー ラグジュアリーコンドミニアムプロジェクトの詳細な建築計画と建設仕様。",
    constructionTabs: [
      {
        id: "preliminary",
        title: "予備プロジェクト",
        content: "詳細な建築計画と初期仕様。",
        pdfUrl: "/docs/narai_anteproyecto.pdf",
      },
      {
        id: "engineering",
        title: "エンジニアリング詳細",
        content: "構造および技術仕様。",
        pdfUrl: "",
      },
      {
        id: "legal",
        title: "法的詳細",
        content: "法的文書と所有権構造。",
        pdfUrl: "",
      },
    ],
  },
  ko: {
    title: "나라이 오션 뷰 럭셔리 콘도미니엄",
    description:
      "독점적인 위치에서 탁 트인 바다 전망을 자랑하는 럭셔리 콘도미니엄",
    getButton: "주식 구매",
    constructionButton: "프로젝트 세부사항",
    details: {
      availability: "30,000,000 나라이 주식",
      stage: "가족 & 친구들",
      roi: "16%",
      benefits: "점유권",
      value: "잉여가치",
      tooltips: {
        availability:
          "이 부동산에 사용할 수 있는 Narai 지분의 총 수량. 총 1억 개의 토큰이 3단계의 투자 라운드에서 발행되며, 점진적인 가격 상승이 있습니다.",
        stage:
          "현재 투자 단계로, 가족 및 친구 전용입니다. 이 단계의 투자자는 최상의 가격, 가장 많은 혜택, 그리고 부동산 이용 권리를 받을 수 있습니다.",
        roi: "연간 예상 투자 수익률(ROI) 16%, 임대 수익 및 부동산 가치 상승을 기반으로 합니다. 투자 단계 및 시장 수요에 따라 ROI는 변동될 수 있습니다.",
        benefits:
          "0단계 및 1단계 투자자는 보유한 지분 수에 따라 특정 날짜에 부동산을 이용할 수 있습니다. 2단계 투자자는 점유 혜택 없이 재정적 수익만 얻습니다.",
        value:
          "각 Narai 지분의 가격은 단계마다 증가합니다. 0단계: 1 MXN/토큰, 1단계: 1.5 MXN/토큰, 2단계: 2 MXN/토큰. 부동산 가치 상승을 반영하여 가격이 상승합니다.",
      },
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
      "/images/narai/loft.png",
      "/images/narai/living.png",
      "/images/narai/kitchen.png",
      "/images/narai/bedroom.png",
      "/images/narai/terrace.png",
    ],
    constructionTitle: "프로젝트 세부사항",
    constructionDescription:
      "나라이 오션 뷰 럭셔리 콘도미니엄 프로젝트의 상세 건축 계획 및 건설 사양.",
    constructionTabs: [
      {
        id: "preliminary",
        title: "예비 프로젝트",
        content: "상세 건축 계획 및 초기 사양.",
        pdfUrl: "/docs/narai_anteproyecto.pdf",
      },
      {
        id: "engineering",
        title: "엔지니어링 세부사항",
        content: "구조 및 기술 사양.",
        pdfUrl: "",
      },
      {
        id: "legal",
        title: "법적 세부사항",
        content: "법적 문서 및 소유권 구조.",
        pdfUrl: "",
      },
    ],
  },
  zh: {
    title: "奈莱海景豪华公寓",
    description: "位于独特位置的豪华公寓，拥有令人惊叹的海景",
    getButton: "获取股份",
    constructionButton: "项目详情",
    details: {
      availability: "30,000,000 股 Narai 股票",
      stage: "家人和朋友",
      roi: "16%",
      benefits: "占用权",
      value: "剩余价值",
      tooltips: {
        availability:
          "该房产可用的 Narai 份额总数。总共将发行 1 亿个代币，并在 3 个投资阶段逐步提高价格。",
        stage:
          "当前投资阶段，仅限家人和朋友参与。在此阶段投资的用户可以获得最低的代币价格、最多的福利，以及使用该房产的权利。",
        roi: "预计年投资回报率 (ROI) 为 16%，基于租金收入和房产增值。根据投资阶段和市场需求，ROI 可能有所变化。",
        benefits:
          "阶段 0 和阶段 1 的投资者可以在特定日期根据其持有的份额使用该房产。阶段 2 的投资者不会获得使用权，但仍可获得财务回报。",
        value:
          "每个 Narai 份额的价格将在每个阶段上涨。阶段 0: 1 MXN/代币，阶段 1: 1.5 MXN/代币，阶段 2: 2 MXN/代币，反映房产价值随时间增长。",
      },
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
      "/images/narai/loft.png",
      "/images/narai/living.png",
      "/images/narai/kitchen.png",
      "/images/narai/bedroom.png",
      "/images/narai/terrace.png",
    ],
    constructionTitle: "项目详情",
    constructionDescription: "奈莱海景豪华公寓项目的详细建筑计划和建设规范。",
    constructionTabs: [
      {
        id: "preliminary",
        title: "初步项目",
        content: "详细建筑计划和初始规格。",
        pdfUrl: "/docs/narai_anteproyecto.pdf",
      },
      {
        id: "engineering",
        title: "工程细节",
        content: "结构和技术规格。",
        pdfUrl: "",
      },
      {
        id: "legal",
        title: "法律详情",
        content: "法律文件和所有权结构。",
        pdfUrl: "",
      },
    ],
  },
};

export default function NaraiPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = use(props.params);

  const { lang } = params;

  const data = propertyData[lang] || propertyData.en;
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  // Scroll handler
  const constructionRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(constructionRef, { once: true, amount: 0.2 });

  React.useEffect(() => {
    if (isInView) {
      setActiveSection("construction");
    }
  }, [isInView]);

  const scrollToConstruction = () => {
    constructionRef.current?.scrollIntoView({ behavior: "smooth" });
    setActiveSection("construction");
  };

  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

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
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">
              {data.title}
            </h1>
            <p className="text-base sm:text-xl max-w-2xl">{data.description}</p>
          </div>

          {/* Buttons container - centered on mobile */}
          <div className="absolute bottom-4 sm:bottom-8 left-0 sm:left-auto right-0 sm:right-8 flex justify-center sm:justify-end gap-2 sm:gap-4 px-4 sm:px-0">
            <Link
              href="#construction"
              onClick={(e) => {
                e.preventDefault();
                scrollToConstruction();
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white transition-all text-xs sm:text-base"
            >
              <Organization className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{data.constructionButton}</span>
            </Link>
            <Tooltip.Provider delayDuration={0}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/90 rounded-lg text-black font-medium transition-all text-xs sm:text-base select-none"
                    // No usamos Link porque no debe ser clicable
                  >
                    <Money className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{data.getButton}</span>
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="rounded-md bg-black/80 text-white px-3 py-1.5 text-sm shadow-md"
                    side="top"
                    sideOffset={5}
                  >
                    Coming Soon
                    <Tooltip.Arrow className="fill-black/80" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
        </div>
      </div>

      {/* Property Details and Features */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
        <div className="lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Property Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(data.details).map(([key, value]) => {
              if (key === "tooltips") return null;
              return (
                <div
                  key={key}
                  className="p-3 sm:p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg relative"
                >
                  <Tooltip.Provider delayDuration={0}>
                    <Tooltip.Root
                      open={openTooltip === key}
                      onOpenChange={(open) => {
                        setOpenTooltip(open ? key : null);
                      }}
                    >
                      <Tooltip.Trigger asChild>
                        <button
                          className="absolute top-2 right-2 sm:top-3 sm:right-3 rounded-lg p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            setOpenTooltip(openTooltip === key ? null : key);
                          }}
                        >
                          <Help className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 dark:text-neutral-400" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="max-w-[280px] sm:max-w-xs bg-black/80 backdrop-blur-md text-white px-3 py-1.5 text-sm rounded-lg shadow-lg"
                          side="top"
                          sideOffset={5}
                          onPointerDownOutside={() => setOpenTooltip(null)}
                        >
                          {
                            data.details.tooltips[
                              key as keyof PropertyDetailTooltips
                            ]
                          }
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                  <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 capitalize">
                    {key}
                  </div>
                  <div className="text-base sm:text-lg font-semibold mt-1">
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 lg:mt-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
            {data.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center p-2 sm:p-3 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-lg"
              >
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-lime-300 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-8 lg:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {data.gallery.map((image, index) => (
            <motion.button
              key={index}
              className="relative aspect-[4/3] rounded-lg overflow-hidden inter"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsFullscreenOpen(true);
              }}
            >
              <Image
                src={image}
                alt={`Property image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={85}
                className="object-cover"
                priority={index === 0}
              />
            </motion.button>
          ))}
        </div>

        {/* Fullscreen Image Viewer */}
        <FullscreenImage
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          images={data.gallery}
          currentIndex={currentImageIndex}
          setCurrentIndex={setCurrentImageIndex}
        />
      </div>

      {/* Construction Details Section */}
      <div
        ref={constructionRef}
        id="construction"
        className="mb-12 scroll-mt-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={
            activeSection === "construction" || isInView
              ? { opacity: 1, y: 0 }
              : {}
          }
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Title and description outside dashboard */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold">{data.constructionTitle}</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              {data.constructionDescription}
            </p>
          </div>

          {/* Construction Dashboard */}
          <ConstructionDashboard tabs={data.constructionTabs} />
        </motion.div>
      </div>
    </div>
  );
}
