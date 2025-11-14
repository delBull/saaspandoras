import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag: (command: string, ...args: unknown[]) => void;
  }
}

export function useGoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only track if GA_ID is configured
    const gaId = process.env.NEXT_PUBLIC_GA_ID ?? 'G-NM68B5LRHS';
    if (!gaId) return;

    // Track page views
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);
}

// Function to track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Event tracking helpers for our landing page
export const trackNewsletterSubscription = (source: string, method: 'email' | 'phone') => {
  trackEvent('submit', 'Newsletter', `Landing Start - ${method}`, 1);
};

export const trackPageView = (page: string) => {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId || typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', gaId, {
    page_title: page,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
};