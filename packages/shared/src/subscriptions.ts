export interface SubscriptionPlan {
  title: string;
  description: string;
  benefits: string[];
  limitations: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
}

export const pricingData: SubscriptionPlan[] = [
  {
    title: "Free",
    description: "Get started for free",
    benefits: [
      "Basic features",
      "Community access",
      "Standard support",
    ],
    limitations: [
      "Limited usage",
      "No premium features",
    ],
    prices: {
      monthly: 0,
      yearly: 0,
    },
  },
  {
    title: "Pro",
    description: "Unlock advanced features",
    benefits: [
      "Unlimited usage",
      "Premium features",
      "Priority support",
      "Advanced analytics",
    ],
    limitations: [],
    prices: {
      monthly: 15,
      yearly: 144,
    },
  },
];
