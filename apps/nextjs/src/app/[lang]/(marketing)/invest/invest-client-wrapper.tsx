'use client';

import dynamic from 'next/dynamic';
import type { Dictionary } from '~/types';

// Dynamically import InvestContent with SSR turned off
const DynamicInvestContent = dynamic(
  () => import('~/components/invest-content').then((mod) => mod.InvestContent),
  { ssr: false }
);

interface InvestClientWrapperProps {
  dict: Dictionary;
}

export default function InvestClientWrapper({ dict }: InvestClientWrapperProps) {
  return <DynamicInvestContent dict={dict} />;
}
