import type * as Lucide from "lucide-react";

import type { Customer } from "@saasfly/db";

export interface Dictionary {
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
  marketing: {
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
  properties: {
    realestate: {
      id: string;
      title: string;
      short: string;
      desc: string;
      cta: string;
    };
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
    };
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
}


export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
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

export interface DashboardConfig {
  mainNav: MainNavItem[];
  sidebarNav: SidebarNavItem[];
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
