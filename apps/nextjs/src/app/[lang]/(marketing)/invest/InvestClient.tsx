"use client";

import { Locale } from "~/config/i18n-config";
import InvestPage from "~/components/invest/invest-page";

interface Props { lang: Locale }

export default function InvestClient({ lang }: Props) {
  const selected = ["en","es","ja","ko","zh"].includes(lang) ? lang : "en";
  return (
    <div className="…">
      <InvestPage lang={selected} />
    </div>
  );
}
