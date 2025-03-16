"use client";

import { useState } from "react";
import Balancer from "react-wrap-balancer";
import { motion } from "framer-motion";
import { ThirdwebProvider, useWallet } from "@thirdweb-dev/react";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { priceDataMap } from "~/config/price/price-data";
import { useSigninModal } from "~/hooks/use-signin-modal";
import type { UserSubscriptionPlan } from "~/types";

interface PricingOption {
  title: string;
  prices: {
    monthly: number;
    yearly: number;
  };
  benefits: string[];
  limitations: string[];
  id: string;
  image: string;
  details: string;
}

interface PricingCardsProps {
  userId?: string;
  subscriptionPlan?: UserSubscriptionPlan;
  dict: Record<string, string>;
  params: {
    lang: string;
  };
}

export function PricingCards({
  dict,
  params: { lang },
}: PricingCardsProps) {
  const signInModal = useSigninModal();
  const [selectedProperty, setSelectedProperty] = useState<PricingOption | null>(null);
  const { connectWallet, disconnectWallet, wallet } = useWallet();

  const pricingData: PricingOption[] | undefined = priceDataMap[lang];

  if (!pricingData || pricingData.length === 0) {
    return (
      <div>
        <p>Error: No data available for the selected language.</p>
      </div>
    );
  }

  const handleDetails = (property: PricingOption) => {
    setSelectedProperty(property);
  };

  const handleCloseDetails = () => {
    setSelectedProperty(null);
  };

  return (
    <ThirdwebProvider>
      <section className="container flex flex-col items-center text-center">
        <div className="mx-auto mb-10 flex w-full flex-col gap-5">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {dict.properties_title}
          </p>
          <h2 className="font-heading text-3xl leading-[1.1] md:text-5xl">
            {dict.slogan}
          </h2>
        </div>

        <div className="mx-auto grid max-w-screen-lg gap-5 bg-inherit py-5 md:grid-cols-1 lg:grid-cols-1">
          {pricingData.map((offer) => (
            <div
              className="relative flex flex-col overflow-hidden rounded-xl border w-full md:max-w-lg mx-auto"
              key={offer.id}
            >
              <img src={offer.image} alt={offer.title} className="w-full h-48 object-cover" />
              <div className="min-h-[150px] items-start space-y-4 bg-secondary/70 p-6">
                <p className="font-urban flex text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {offer.title}
                </p>
                <div className="flex flex-row">
                  <div className="flex items-end">
                    <div className="flex text-left text-3xl font-semibold leading-6">
                      {`$${offer.prices.monthly}`}
                    </div>
                    <div className="-mb-1 ml-2 text-left text-sm font-medium">
                      <div>{dict.mo}</div>
                    </div>
                  </div>
                </div>
                {offer.prices.monthly > 0 && (
                  <div className="text-left text-sm text-muted-foreground">
                    {dict.monthly_info}
                  </div>
                )}
              </div>

              <div className="flex h-full flex-col justify-between gap-16 p-6">
                <ul className="space-y-2 text-left text-sm font-medium leading-normal">
                  {offer.benefits.map((feature) => (
                    <li className="flex items-start" key={feature}>
                      <Icons.Check className="mr-3 h-5 w-5 shrink-0" />
                      <p>{feature}</p>
                    </li>
                  ))}
                  {offer.limitations.map((feature) => (
                    <li
                      className="flex items-start text-muted-foreground"
                      key={feature}
                    >
                      <Icons.Close className="mr-3 h-5 w-5 shrink-0" />
                      <p>{feature}</p>
                    </li>
                  ))}
                </ul>

                <div className="flex gap-4">
                  <Button onClick={() => connectWallet("injected")}>
                    {wallet ? dict.buy_tokens : dict.connect_wallet}
                  </Button>
                  <Button onClick={() => handleDetails(offer)}>
                    {dict.details}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-base text-muted-foreground">
          <Balancer>
            Email{" "}
            <a
              className="font-medium text-primary hover:underline"
              href="mailto:support@pandoras.foundation"
            >
              support@pandoras.foundation
            </a>{" "}
            {dict.contact}
            <br />
            <strong>{dict.contact_2}</strong>
          </Balancer>
        </p>

        {selectedProperty && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseDetails}
          >
            <motion.div
              className="bg-white rounded-lg p-6 relative"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4"
                onClick={handleCloseDetails}
              >
                <Icons.Close className="h-6 w-6" />
              </button>
              <h3 className="text-xl font-bold mb-4">{selectedProperty.title}</h3>
              <p>{selectedProperty.details}</p>
            </motion.div>
          </motion.div>
        )}
      </section>
    </ThirdwebProvider>
  );
}
