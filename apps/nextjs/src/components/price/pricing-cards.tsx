"use client";

import Balancer from "react-wrap-balancer";
import Properties from "~/components/price/propertiesv2"; // Importamos Properties


export function PricingCards() {

  return (
    <section className="container flex flex-col items-center text-center">

      {/* Renderizamos Properties arriba de los planes de precios */}
      <Properties />

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
