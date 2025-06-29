import { Suspense } from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense>
      <div className="min-h-screen">{children}</div>;
    </Suspense>
  );
}
