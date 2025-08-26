import { getDictionary } from "~/lib/get-dictionary";
import type { Locale } from "~/config/i18n-config";
import { ActivosClient } from "~/components/marketing/activos-client";

// This is the main page component. It fetches data on the server and passes it to the client component.
export default async function ActivosPage(props: {
  params: Promise<{ lang: Locale; }> 
}) {
  const params = await props.params;
  const dict = await getDictionary(params.lang);
  return <ActivosClient dict={dict} />;
}