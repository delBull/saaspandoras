import { redirect } from "next/navigation";
//import { getCurrentUser } from "@saasfly/auth";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  {/*}
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.isAdmin) {
    redirect("/dashboard");
  }
  */}

  return <div className="min-h-screen">{children}</div>;
}
