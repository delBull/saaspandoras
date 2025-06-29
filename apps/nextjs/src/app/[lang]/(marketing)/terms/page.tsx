import { getDictionary } from "~/lib/get-dictionary";
import { TermsContent } from "~/components/terms-content";
import type { Locale } from "~/config/i18n-config";

export default async function TermsPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;

  const { lang } = params;

  const dict = await getDictionary(lang);

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <TermsContent dict={dict} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [
    { lang: "en" },
    { lang: "es" },
    { lang: "ja" },
    { lang: "ko" },
    { lang: "zh" },
  ];
}
