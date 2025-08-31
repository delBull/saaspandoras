'use client';

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@saasfly/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@saasfly/ui/dropdown-menu";
import { i18n } from "~/config/i18n-config";

// CORREGIDO: Se elimina la interfaz 'Props' ya que no es necesaria.

// CORREGIDO: Se simplifica la firma de la función. No acepta props.
export function LocaleChange() {
  const pathName = usePathname();
  const router = useRouter();

  const redirectedPathName = (locale: string) => {
    if (!pathName) return "/";
    const segments = pathName.split("/");
    segments[1] = locale;
    return segments.join("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="capitalize">
          {pathName.split("/")[1]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {i18n.locales.map((locale) => {
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => router.push(redirectedPathName(locale))}
            >
              {locale}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}