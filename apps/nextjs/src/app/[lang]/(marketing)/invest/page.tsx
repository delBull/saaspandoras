import { getDictionary } from "~/lib/get-dictionary";
import type { Locale } from "~/config/i18n-config";
import InvestClientWrapper from './invest-client-wrapper'; 

export default async function Page(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const { lang } = params;
  const dict = await getDictionary(lang);

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <InvestClientWrapper dict={dict} />
      </div>
    </div>
  );
}
