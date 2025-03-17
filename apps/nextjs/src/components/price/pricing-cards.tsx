"use client";

import Balancer from "react-wrap-balancer";
import Properties from "~/components/price/propertiesv2";


interface Dictionary {
  properties?: {
    realestate?: Record<string, any>;
  };
}

export function PricingCards({ dict }: { dict?: Dictionary }) {
  const realEstateDict = dict?.properties?.realestate ?? {};

  return (
    <section className="container flex flex-col items-center text-center">

      <Properties dict={realEstateDict} />

      <p className="mt-3 text-center text-base text-muted-foreground">
        <Balancer>
          Email {" "}
          <a className="font-medium text-primary hover:underline" href="mailto:support@pandoras.foundation">
            support@pandoras.foundation
          </a>{" "}
        </Balancer>
      </p>
    </section>
  );
}
