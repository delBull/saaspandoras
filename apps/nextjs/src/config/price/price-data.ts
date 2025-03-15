//import { env } from "~/env.mjs";

interface SubscriptionPlanTranslation {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  limitations: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
  stripeIds: {
    monthly: string | null;
    yearly: string | null;
  };
}

export const priceDataMap: Record<string, SubscriptionPlanTranslation[]> = {
  zh: [
    {
      id: "starter",
      title: "Narai Bucerías",
      description: "投资于纳亚里特州布塞里亚斯的独家房地产开发项目。",
      benefits: [
        "获取由房地产支持的代币。",
        "收益基于增值和度假租赁收入。",
        "优先获得预售权，并享受优惠价格。",
        "投资由有形资产支持。"
      ],
      limitations: [
        "可用代币数量有限。",
        "购买需经可用性和审批。",
        "需要连接数字钱包。",
        "收益取决于房地产市场需求。"
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "pro",
      title: "专业版",
      description: "解锁高级功能",
      benefits: [
        "每月最多3个集群",
        "高级分析和报告",
        "访问商业模板",
        "优先客户支持",
        "独家网络研讨会和培训",
      ],
      limitations: ["无法自定义品牌", "对商业资源的访问受限"],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "business",
      title: "商业版",
      description: "适合高级用户",
      benefits: [
        "每月最多10个集群",
        "实时分析和报告",
        "访问所有模板，包括自定义品牌",
        "全天候商业客户支持",
        "个性化的配置和账户管理",
      ],
      limitations: [],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
  ],
  es: [
    {
      id: "starter",
      title: "Narai Bucerías",
      description: "Invierte en un exclusivo desarrollo inmobiliario en Bucerías, Nayarit.",
      benefits: [
        "Adquiere tokens respaldados por bienes raíces.",
        "Rentabilidad basada en plusvalía y rentas vacacionales.",
        "Acceso prioritario a preventa con precios preferenciales.",
        "Inversión respaldada por activos tangibles.",
      ],
      limitations: [
        "Número limitado de tokens disponibles.",
        "Sujeto a disponibilidad y aprobación de compra.",
        "Requiere conexión con una billetera digital.",
        "Los retornos dependen de la demanda del mercado inmobiliario.",
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "business",
      title: "Negocios",
      description: "Para usuarios avanzados",
      benefits: [
        "Hasta 10 clústeres por mes",
        "Análisis y reportes en tiempo real",
        "Acceso a todas las plantillas, incluida la personalización de marca",
        "Soporte empresarial 24/7",
        "Configuración y gestión de cuentas personalizadas",
      ],
      limitations: [],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
  ],  
  en: [
    {
      id: "starter",
      title: "Narai Bucerías",
      description: "Invest in an exclusive real estate development in Bucerías, Nayarit.",
      benefits: [
        "Acquire tokens backed by real estate.",
        "Profitability based on appreciation and vacation rentals.",
        "Priority access to pre-sale with preferential prices.",
        "Investment backed by tangible assets."
      ],
      limitations: [
        "Limited number of tokens available.",
        "Subject to availability and purchase approval.",
        "Requires connection with a digital wallet.",
        "Returns depend on real estate market demand."
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "pro",
      title: "Pro",
      description: "Unlock Advanced Features",
      benefits: [
        "Up to 3 clusters per month",
        "Advanced analytics and reporting",
        "Access to business templates",
        "Priority customer support",
        "Exclusive webinars and training",
      ],
      limitations: [
        "No custom branding",
        "Limited access to business resources",
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "business",
      title: "Business",
      description: "For Power Users",
      benefits: [
        "Up to 10 clusters per month",
        "Real-time analytics and reporting",
        "Access to all templates, including custom branding",
        "24/7 business customer support",
        "Personalized configuration and account management",
      ],
      limitations: [],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
  ],
  ja: [
    {
      id: "starter",
      title: "Narai Bucerías",
      description: "ナヤリット州ブセリアスの高級不動産開発に投資しましょう。",
      benefits: [
        "不動産で裏付けられたトークンを取得。",
        "資産価値の上昇とバケーションレンタルによる収益。",
        "優先的なプリセールアクセスと特別価格。",
        "有形資産に裏付けられた投資。"
      ],
      limitations: [
        "利用可能なトークン数が限られています。",
        "購入は在庫状況および承認の対象となります。",
        "デジタルウォレットとの接続が必要です。",
        "収益は不動産市場の需要に依存します。"
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "pro",
      title: "プロ",
      description: "高度な機能のロックを解除",
      benefits: [
        "月に最大3つのクラスター",
        "高度な分析とレポート",
        "ビジネステンプレートへのアクセス",
        "優先カスタマーサポート",
        "独占的なウェビナーとトレーニング",
      ],
      limitations: [
        "カスタムブランディングなし",
        "ビジネスリソースへのアクセスが限定的",
      ],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "business",
      title: "ビジネス",
      description: "パワーユーザー向け",
      benefits: [
        "月に最大10つのクラスター",
        "リアルタイムの分析とレポート",
        "すべてのテンプレート（カスタムブランディングを含む）へのアクセス",
        "24/7のビジネスカスタマーサポート",
        "パーソナライズされた設定とアカウント管理",
      ],
      limitations: [],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
  ],
  ko: [
    {
      id: "starter",
      title: "Narai Bucerías",
      description: "나야리트 부세리아스의 독점적인 부동산 개발에 투자하세요.",
      benefits: [
        "부동산으로 보장된 토큰을 획득하세요.",
        "자산 가치 상승과 휴가 임대를 통한 수익성.",
        "우대 가격으로 사전 판매 우선 접근 권한.",
        "실물 자산으로 보장된 투자."
      ],
      limitations: [
        "이용 가능한 토큰 수가 제한되어 있습니다.",
        "구매 가능 여부 및 승인에 따라 달라집니다.",
        "디지털 지갑 연결이 필요합니다.",
        "수익은 부동산 시장의 수요에 따라 달라집니다."
      ],
      prices: {
        "monthly": 10,
        "yearly": 10
      },
      stripeIds: {
        "monthly": null,
        "yearly": null
      }
    },
    {
      id: "pro",
      title: "프로",
      description: "고급 기능 잠금 해제",
      benefits: [
        "월 최대 3개의 클러스터",
        "고급 분석 및 보고",
        "비즈니스 템플릿에 대한 액세스",
        "우선 고객 지원",
        "독점 웹 세미나 및 교육",
      ],
      limitations: ["맞춤 브랜딩 없음", "비즈니스 리소스에 대한 액세스 제한"],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
    {
      id: "business",
      title: "비즈니스",
      description: "파워 사용자를 위한",
      benefits: [
        "월 최대 10개의 클러스터",
        "실시간 분석 및 보고",
        "모든 템플릿에 대한 액세스, 맞춤 브랜딩 포함",
        "24/7 비즈니스 고객 지원",
        "맞춤 설정 및 계정 관리",
      ],
      limitations: [],
      prices: {
        monthly: 10, 
        yearly: 10,
      },
      stripeIds: {
        monthly: null,
        yearly: null,
      },
    },
  ],
};
