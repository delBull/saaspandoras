// packages/marketing/src/types/index.ts
// Generic types for the Marketing System - Framework agnostic

// === CORE TYPES ===

export interface MarketingConfig {
  brand: {
    name: string
    logo?: string
    colors: {
      primary: string
      secondary: string
      accent: string
    }
  }
  tracking: {
    googleAnalyticsId?: string
    facebookPixelId?: string
    customEvents: string[]
  }
  email: {
    provider: 'resend'
    defaultFrom: string
    templates: Record<string, string>
  }
  features: {
    abTesting: boolean
    analytics: boolean
    emailCapture: boolean
    socialProof: boolean
  }
}

// === LANDING PAGE TYPES ===

export interface LandingPageConfig {
  id: string
  name: string
  type: 'start' | 'pricing' | 'features' | 'coming-soon' | 'lead-magnet' | 'webinar'
  config: {
    hero: HeroSection
    features?: FeatureSection[]
    cta?: CTASection
    testimonials?: TestimonialSection
    faq?: FAQSection
    forms?: FormSection[]
    analytics?: AnalyticsConfig
    abTesting?: ABTestConfig
  }
}

export interface HeroSection {
  title: string
  subtitle?: string
  description?: string
  cta: {
    text: string
    href: string
    style: 'primary' | 'secondary' | 'outline'
  }
  secondaryCta?: {
    text: string
    href: string
    style: 'secondary' | 'outline'
  }
  background?: {
    type: 'gradient' | 'image' | 'video'
    value?: string
  }
  media?: {
    type: 'image' | 'video' | 'lottie'
    src: string
    alt?: string
  }
}

export interface FeatureSection {
  title: string
  subtitle?: string
  description?: string
  layout: 'grid' | 'list' | 'split'
  items: Array<{
    title: string
    description: string
    icon?: string
    image?: string
    benefits?: string[]
  }>
}

export interface CTASection {
  type: 'single' | 'split' | 'banner'
  title: string
  description?: string
  cta: {
    text: string
    href: string
    style: 'primary' | 'secondary' | 'outline'
  }
  secondaryCta?: {
    text: string
    href: string
    style: 'secondary' | 'outline'
  }
  socialProof?: {
    users: string
    rating: number
    reviews: number
  }
}

export interface TestimonialSection {
  title: string
  subtitle?: string
  layout: 'grid' | 'carousel' | 'single'
  items: Array<{
    name: string
    role: string
    company?: string
    content: string
    avatar?: string
    rating?: number
    metrics?: {
      label: string
      value: string
    }[]
  }>
}

export interface FAQSection {
  title: string
  subtitle?: string
  layout: 'accordion' | 'list' | 'grid'
  items: Array<{
    question: string
    answer: string
    category?: string
  }>
}

export interface FormSection {
  type: 'newsletter' | 'contact' | 'lead-capture' | 'webinar-registration'
  title: string
  description?: string
  fields: Array<{
    name: string
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox'
    label: string
    placeholder?: string
    required?: boolean
    validation?: string
  }>
  submitText: string
  successRedirect?: string
  integrations?: {
    resend: {
      template: string
      listId?: string
    }
    analytics: {
      event: string
      value?: string
    }
  }
}

// === EMAIL MARKETING TYPES ===

export interface EmailCampaign {
  id: string
  name: string
  type: 'welcome' | 'newsletter' | 'promotional' | 'abandoned-cart' | 're-engagement'
  template: string
  subject: string
  content: string
  recipients: string[]
  scheduledAt?: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  analytics: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    unsubscribed: number
  }
}

export interface Subscriber {
  id: string
  email: string
  name?: string
  phone?: string
  lists: string[]
  tags: string[]
  source: string
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained'
  subscribedAt: Date
  lastEngagement?: Date
  metadata: Record<string, any>
  preferences: {
    frequency: 'immediate' | 'daily' | 'weekly' | 'monthly'
    categories: string[]
  }
}

export interface EmailTemplate {
  id: string
  name: string
  type: 'welcome' | 'newsletter' | 'promotional' | 'transactional'
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
  category: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// === ANALYTICS & TRACKING TYPES ===

export interface AnalyticsConfig {
  events: {
    pageView: string
    formSubmission: string
    buttonClick: string
    emailSignup: string
    leadGenerated: string
  }
  conversions: {
    primary: string
    secondary: string[]
  }
  attribution: {
    source: string
    medium: string
    campaign: string
    content?: string
    term?: string
  }
}

export interface EventData {
  event: string
  timestamp: Date
  userId?: string
  sessionId: string
  page: string
  url: string
  referrer?: string
  utm?: {
    source: string
    medium: string
    campaign: string
    content?: string
    term?: string
  }
  custom?: Record<string, any>
}

export interface ConversionData {
  id: string
  type: 'signup' | 'purchase' | 'download' | 'webinar' | 'demo'
  value: number
  currency?: string
  userId?: string
  sessionId: string
  page: string
  utm: {
    source: string
    medium: string
    campaign: string
    content?: string
    term?: string
  }
  timestamp: Date
}

// === A/B TESTING TYPES ===

export interface ABTestConfig {
  name: string
  description?: string
  variants: Array<{
    id: string
    name: string
    weight: number // 0-100
    config: Record<string, any>
  }>
  primaryMetric: string
  secondaryMetrics: string[]
  startDate?: Date
  endDate?: Date
  status: 'draft' | 'running' | 'completed' | 'paused'
}

export interface ABTestResult {
  testId: string
  variantId: string
  metric: string
  value: number
  confidence: number
  isWinner: boolean
}

// === FORM TYPES ===

export interface FormSubmission {
  id: string
  formId: string
  data: Record<string, any>
  email?: string
  source: string
  utm: {
    source: string
    medium: string
    campaign: string
    content?: string
    term?: string
  }
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  status: 'new' | 'processed' | 'failed'
  integrations: {
    email?: {
      listId?: string
      tags: string[]
    }
    analytics?: {
      event: string
      value?: string
    }
    webhook?: {
      url: string
      payload: any
    }
  }
}

// === API RESPONSE TYPES ===

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      pages: number
    }
    total?: number
    count?: number
  }
}

// === UTILITY TYPES ===

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type Theme = 'light' | 'dark' | 'system'

// === TEMPLATE TYPES ===

export interface ContentTemplate {
  id: string
  name: string
  description?: string
  type: 'hero' | 'features' | 'cta' | 'testimonials' | 'faq' | 'forms'
  content: {
    [key: string]: any
  }
  variables: string[]
  createdAt: Date
  updatedAt: Date
}