import type * as Lucide from "lucide-react";
import type { Customer } from "@saasfly/db";


export interface Section {
  title: string;
  content?: string;
  items?: string[];
  email?: string;
}

export interface Dictionary {
  whitepaper: {
    sections: string;
    search: string;
    search_placeholder: string;
    ai_search_soon: string;
    on_this_page: string;
  };
  whitepaper: {
    sections: string;
    search: string;
    search_placeholder: string;
    ai_search_soon: string;
    on_this_page: string;
  };
  price: {
    title: string;
    properties_title: string;
    slogan: string;
    monthly_bill: string;
    annual_bill: string;
    annual_info: string;
    monthly_info: string;
    mo: string;
    contact: string;
    contact_2: string;
    faq: string;
    faq_detail: string;
    signup: string;
    upgrade: string;
    manage_subscription: string;
    go_to_dashboard: string;
  };
  marketing: MarketingDictionary;
  properties: {
    introducing: string;
    title: string;
    sub_title: string;
    get_started: string;
    view_on_github: string;
    explore_product: string;
    features: string;
    sub_features: string;
    k8s_features: string;
    devops_features: string;
    price_features: string;
    main_nav_business: string;
    main_nav_assets: string;
    main_nav_products: string;
    main_nav_blog: string;
    main_nav_documentation: string;
    login: string;
    signup: string;
    contributors: {
      contributors_desc: string;
      developers_first: string;
      developers_second: string;
    };
    right_side: {
      deploy_on_vercel_title: string;
      deploy_on_vercel_desc: string;
      ship_on_cloudflare_title: string;
      ship_on_cloudflare_desc: string;
      showcase_title: string;
      showcase_desc: string;
    };
    features_grid: {
      monorepo_title: string;
      monorepo_desc: string;
      i18n_title: string;
      i18n_desc: string;
      payments_title: string;
      payments_desc: string;
      nextauth_title: string;
      nextauth_desc: string;
    };
    sponsor: {
      title: string;
      donate: string;
    };
    video: {
      first_text: string;
      second_text1: string;
      time_text: string;
    };
    transform_token: {
      title: string;
      desc: string;
    };
    people_comment: {
      title: string;
      desc: string;
    };
  };

  benefits_market: {
    main_title: string;
    main_description: string;
    ventajas_title0: string;
    ventajas_description0: string;
    ventajas_title1: string;
    ventajas_description1: string;
    ventajas_title2: string;
    ventajas_description2: string;
    ventajas_title3: string;
    ventajas_description3: string;
  };
  login: {
    back: string;
    welcome_back: string;
    signin_title: string;
    singup_title: string;
    signin_email: string;
    signin_others: string;
    signup: string;
    privacy: string;
    signup_github: string;
    signup_google: string;
  };
  common: {
    copyright: string;
    dashboard: {
      main_nav_documentation: string;
      main_nav_support: string;
      sidebar_nav_clusters: string;
      sidebar_nav_billing: string;
      sidebar_nav_settings: string;
      title_text: string;
      marketing_introducing: string;
    };
    portfolio: string;
    tickets: string;
    action: string;
    all_investments: string;
    real_estate: string;
    startups: string;
    scaleups: string;
  };
  business: {
    k8s: {
      new_cluster: string;
      no_cluster_title: string;
      no_cluster_content: string;
    };
    billing: {
      billing: string;
      content: string;
      noSubscription: string;
      subscriptionInfo: string;
      manage_subscription: string;
      upgrade: string;
    };
  };
  dropdown: {
    dashboard: string;
    billing: string;
    settings: string;
    sign_out: string;
  };
  terms: {
    title: string;
    lastUpdate: string;
    tabTerms: string;
    tabPrivacy: string;
    sections: Record<string, Section>;
  };
  privacy: {
    title: string;
    lastUpdate: string;
    introduction: string;
    sections: Record<string, Section>;
  };
  invest: {
    title: string;
    description: string;
    cap: string;
    total: string;
    available: string;
    shares: string;
    equivalent: string;
    toinvest: string;
    subtitle: string;
    balance: string;
  };
  activos: {
    title: string;
    subtitle: string;
    assets: Record<string, {
      tag: string;
      title: string;
      description: string;
    }>;
    info_modal: {
      title: string;
      paragraph1: string;
      paragraph2: string;
    };
  };
  footer: {
    title: string;
    slogan: string;
    copyright: string;
    white_paper: string;
    support: string;
    terms_privacy: string;
  };
  about: {
    title: string;
    the_big_why: {
      title: string;
      p1: string;
      p2: string;
      p3: string;
    };
    our_mission: {
      title: string;
      content: string;
    };
    what_we_do: {
      title: string;
      intro: string;
      services_title: string;
      services: {
        title: string;
        description: string;
      }[];
    };
    our_current_position: {
      title: string;
      intro: string;
      points: string[];
    };
    the_team: {
      title: string;
      intro: string;
      areas: {
        title: string;
        description: string;
      }[];
    };
    strategic_allies: {
      title: string;
      intro: string;
      categories: {
        name: string;
        partners: string;
      }[];
    };
    roadmap: {
      title: string;
      intro: string;
      timeline: {
        year: string;
        description: string;
      }[];
    };
    cta: {
      title: string;
      content: string;
    };
  };
}

export interface MarketingDictionary {
  introducing: string;
  title: string;
  sub_title: string;
  get_started: string;
  hero_supertitle: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta1: string;
  hero_cta2: string;
  hero_cta3: string;
  view_on_github: string;
  explore_product: string;
  features: string;
  sub_features: string;
  k8s_features: string;
  devops_features: string;
  price_features: string;
  main_nav_business: string;
  main_nav_assets: string;
  main_nav_invest: string;
  main_nav_products: string;
  main_nav_blog: string;
  main_nav_documentation: string;
  main_nav_home: string;
  main_nav_about: string;
  login: string;
  signup: string;
  contributors: {
    contributors_desc: string;
    developers_first: string;
    developers_second: string;
  };
  right_side: {
    deploy_on_vercel_title: string;
    deploy_on_vercel_desc: string;
    ship_on_cloudflare_title: string;
    ship_on_cloudflare_desc: string;
    showcase_title: string;
    showcase_desc: string;
  };
  features_grid: {
    monorepo_title: string;
    monorepo_desc: string;
    i18n_title: string;
    i18n_desc: string;
    payments_title: string;
    payments_desc: string;
    nextauth_title: string;
    nextauth_desc: string;
  };
  sponsor: {
    title: string;
    subtitle: string;
    donate: string;
  };
  academic_backing: {
    title: string;
    subtitle: string;
  };
  benefits_market: {
    main_title: string;
    main_description: string;
    ventajas_title0: string;
    ventajas_description0: string;
    ventajas_title1: string;
    ventajas_description1: string;
    ventajas_title2: string;
    ventajas_description2: string;
    ventajas_title3: string;
    ventajas_description3: string;
  };
  video: {
    first_text: string;
    second_text1: string;
    time_text: string;
  };
  transform_token: {
    title: string;
    desc: string;
  };
  people_comment: {
    title: string;
    desc: string;
  };
  investment_steps: {
    title: string;
    steps: {
      title: string;
      content: string;
      caption: string;
    }[];
  };
  contributors: {
    contributors_desc: string;
    developers_first: string;
    developers_second: string;
  };
  dashboard: {
    config_panel: string;
    investments_panel: string;
  };
  skeleton_one: {
    items: {
      title: string;
      image?: string;
    }[];
  };
  skeleton_two: {
    items: {
      title: string;
    }[];
  };
  faq: {
    title: string;
    faqs: {
      question: string;
      answer: string;
    }[];
  };
}

export interface NavItem {
  external: any;
  title: string;
  href: string;
  disabled?: boolean;
  hidden?: boolean;
  tooltip?: string;
}

export type MainNavItem = NavItem;

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
}

export type SidebarNavItem = {
  id: string;
  title: string;
  disabled?: boolean;
  external?: boolean;
  icon?: Lucide.LucideIcon;
} & (
    | {
      href: string;
      items?: never;
    }
    | {
      href?: string;
      items: NavLink[];
    }
  );

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github: string;
  };
}

export interface DocsConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
}

export interface MarketingConfig {
  mainNav: MainNavItem[];
}

export interface SubscriptionPlan {
  title?: string;
  description?: string;
  benefits?: string[];
  limitations?: string[];
  prices?: {
    monthly: number;
    yearly: number;
  };
  stripeIds?: {
    monthly: string | null;
    yearly: string | null;
  };
}

export type UserSubscriptionPlan = SubscriptionPlan &
  Pick<
    Customer,
    "stripeCustomerId" | "stripeSubscriptionId" | "stripePriceId"
  > & {
    stripeCurrentPeriodEnd: number;
    isPaid: boolean | "" | null;
    interval: string | null;
    isCanceled?: boolean;
  };