import { type SidebarNavItem } from "~/types/nav";

interface DashboardConfig {
  sidebarNav: SidebarNavItem[];
}

export const getDashboardConfig = async ({ params }: any) => {
  // const dict = await getDictionary(params.lang);

  const dashboardConfig: DashboardConfig = {
    sidebarNav: [
      {
        title: "Account",
        href: `/dashboard/account`,
        icon: "user",
        items: [],
      },
      {
        title: "Appearance",
        href: `/dashboard/appearance`,
        icon: "laptop",
        items: [],
      },
      {
        title: "Settings",
        href: `/dashboard/settings`,
        icon: "settings",
        items: [],
      },
    ],
  };
  return dashboardConfig;
};
