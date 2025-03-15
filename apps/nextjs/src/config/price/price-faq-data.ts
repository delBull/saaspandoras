interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const priceFaqDataMap: Record<string, FAQItem[]> = {
    zh: [
      {
        id: "item-1",
        question: "什么是 Pandoras？",
        answer: "Pandoras 是一个区块链平台，将房地产和创新项目进行代币化，让您可以轻松、安全地进行投资。"
      },
      {
        id: "item-2",
        question: "Pandoras 如何实现代币化？",
        answer: "我们的平台将实物资产转换为数字代币，使您能够以较低的门槛投资高价值项目。"
      },
      {
        id: "item-3",
        question: "通过 Pandoras 投资有哪些好处？",
        answer: "通过 Pandoras 投资，您将享受到透明、安全的投资环境，并有机会获得被动收入和资产增值。"
      },
      {
        id: "item-4",
        question: "我的投资安全吗？",
        answer: "Pandoras 利用最先进的区块链技术，确保所有交易和投资都安全、透明，并受到严格保护。"
      },
      {
        id: "item-5",
        question: "我如何查看我的投资状况？",
        answer: "您可以通过我们用户友好的仪表板实时跟踪您的投资和代币持有情况，操作简单直观。"
      }
    ],
    en: [
      {
        id: "item-1",
        question: "What is Pandoras?",
        answer: "Pandoras is a blockchain platform that tokenizes real estate and innovative projects, allowing you to invest easily and securely."
      },
      {
        id: "item-2",
        question: "How does tokenization work on Pandoras?",
        answer: "Our platform converts physical assets into digital tokens, enabling you to invest in high-value projects with a lower capital barrier."
      },
      {
        id: "item-3",
        question: "What are the benefits of investing through Pandoras?",
        answer: "Investing through Pandoras provides a transparent, secure investment environment, with opportunities for passive income and asset appreciation."
      },
      {
        id: "item-4",
        question: "How secure is my investment?",
        answer: "Pandoras leverages cutting-edge blockchain technology to ensure that all transactions and investments are secure, transparent, and rigorously protected."
      },
      {
        id: "item-5",
        question: "How can I track my investments?",
        answer: "You can easily monitor your investments and token holdings through our user-friendly dashboard, available 24/7 for real-time updates."
      }
    ],
    es: [
      {
        id: "item-1",
        question: "¿Qué es Pandoras?",
        answer: "Pandoras es una plataforma blockchain que tokeniza proyectos inmobiliarios e innovadores, permitiéndote invertir de forma sencilla y segura."
      },
      {
        id: "item-2",
        question: "¿Cómo funciona la tokenización en Pandoras?",
        answer: "Nuestra plataforma convierte activos físicos en tokens digitales, permitiéndote invertir en proyectos de alto valor con una barrera de entrada menor."
      },
      {
        id: "item-3",
        question: "¿Cuáles son los beneficios de invertir a través de Pandoras?",
        answer: "Invertir a través de Pandoras te ofrece un entorno de inversión transparente y seguro, con oportunidades para obtener ingresos pasivos y la apreciación de tus activos."
      },
      {
        id: "item-4",
        question: "¿Qué tan segura es mi inversión?",
        answer: "Pandoras utiliza tecnología blockchain de última generación para garantizar que todas las transacciones e inversiones sean seguras, transparentes y estén rigurosamente protegidas."
      },
      {
        id: "item-5",
        question: "¿Cómo puedo seguir mis inversiones?",
        answer: "Puedes monitorear fácilmente tus inversiones y la tenencia de tus tokens a través de nuestro panel de control, disponible las 24 horas para actualizaciones en tiempo real."
      }
    ],
    ja: [
      {
        id: "item-1",
        question: "Pandorasとは何ですか？",
        answer: "Pandorasは、不動産や革新的なプロジェクトをトークン化するブロックチェーンプラットフォームで、簡単かつ安全に投資できる環境を提供します。"
      },
      {
        id: "item-2",
        question: "Pandorasでのトークン化はどのように機能しますか？",
        answer: "当プラットフォームでは、実物資産をデジタルトークンに変換することで、少ない資本で高価値のプロジェクトに投資することが可能になります。"
      },
      {
        id: "item-3",
        question: "Pandorasを通じて投資するメリットは何ですか？",
        answer: "Pandorasを通じて投資することで、透明性が高く安全な投資環境を享受でき、受動的な収入や資産の価値上昇の機会が得られます。"
      },
      {
        id: "item-4",
        question: "私の投資はどのくらい安全ですか？",
        answer: "Pandorasは最新のブロックチェーン技術を活用しており、すべての取引と投資が安全かつ透明に管理されています。"
      },
      {
        id: "item-5",
        question: "Pandorasで自分の投資状況をどのように確認できますか？",
        answer: "使いやすいダッシュボードを通じて、24時間いつでも自分の投資やトークン保有状況をリアルタイムで確認できます。"
      }
    ],
    ko: [
      {
        id: "item-1",
        question: "Pandoras란 무엇인가요?",
        answer: "Pandoras는 부동산과 혁신 프로젝트를 토큰화하는 블록체인 플랫폼으로, 쉽고 안전하게 투자할 수 있는 환경을 제공합니다."
      },
      {
        id: "item-2",
        question: "Pandoras에서 토큰화는 어떻게 이루어지나요?",
        answer: "우리 플랫폼은 실물 자산을 디지털 토큰으로 전환하여, 적은 자본으로도 고가치 프로젝트에 투자할 수 있도록 합니다."
      },
      {
        id: "item-3",
        question: "Pandoras를 통해 투자할 때의 장점은 무엇인가요?",
        answer: "Pandoras를 통해 투자하면, 투명하고 안전한 투자 환경은 물론, 수동적 소득과 자산 가치 상승의 기회를 누릴 수 있습니다."
      },
      {
        id: "item-4",
        question: "제 투자는 얼마나 안전한가요?",
        answer: "Pandoras는 최신 블록체인 기술을 사용하여 모든 거래와 투자가 안전하고 투명하게 관리되도록 보장합니다."
      },
      {
        id: "item-5",
        question: "Pandoras에서 제 투자를 어떻게 확인할 수 있나요?",
        answer: "사용자 친화적인 대시보드를 통해 언제든지 실시간으로 투자 내역과 토큰 보유 현황을 확인할 수 있습니다."
      }
    ]
  };  