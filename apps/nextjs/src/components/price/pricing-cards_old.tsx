"use client";

//import { useState } from "react";
import Link from "next/link";
import Balancer from "react-wrap-balancer";

import { Button, buttonVariants } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { BillingFormButton } from "~/components/price/billing-form-button";
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
  stage0: string[];
  price_per_token0: number;
  availability0: string[];
  special_benefits0: string[];
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
  userId,
  subscriptionPlan,
  dict,
  params: { lang },
}: PricingCardsProps) {
  // Llamamos siempre al hook para evitar reglas de hooks condicionales
  const signInModal = useSigninModal();

  // Filtramos para que sólo aparezca el plan Starter
  const pricingData: PricingOption[] | undefined = priceDataMap[lang]?.filter(
    (offer) => offer.id === "starter"
  );

  if (!pricingData || pricingData.length === 0) {
    return (
      <div>
        <p>Error: No data available for the selected language.</p>
      </div>
    );
  }

  // const toggleBilling is comentado porque solo se muestra el plan Starter

  return (
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
                {offer.stage0.map((feature) => (
                  <li className="flex items-start" key={feature}>
                    <Icons.Check className="mr-3 h-5 w-5 shrink-0" />
                    <p>{feature}</p>
                  </li>
                ))}
                {offer.availability0.map((feature) => (
                  <li className="flex items-start" key={feature}>
                    <Icons.Check className="mr-3 h-5 w-5 shrink-0" />
                    <p>{feature}</p>
                  </li>
                ))}
                {offer.special_benefits0.map((feature) => (
                  <li className="flex items-start" key={feature}>
                    <Icons.Check className="mr-3 h-5 w-5 shrink-0" />
                    <p>{feature}</p>
                  </li>
                ))}
              </ul>

              {userId && subscriptionPlan ? (
                offer.id === "starter" ? (
                  <Link
                    href="/dashboard"
                    className={buttonVariants({
                      className: "w-full",
                      variant: "default",
                    })}
                  >
                    {dict.go_to_dashboard}
                  </Link>
                ) : (
                  <BillingFormButton
                    year={false}
                    offer={offer}
                    subscriptionPlan={subscriptionPlan}
                    dict={dict}
                  />
                )
              ) : (
                <Button onClick={signInModal.onOpen}>{dict.signup}</Button>
              )}
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
    </section>
  );
}
