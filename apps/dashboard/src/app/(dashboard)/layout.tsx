'use client';

import { Suspense } from "react";
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
} from "thirdweb/react";
import Link from "next/link";
import { NFTGate } from "@/components/nft-gate";
import { isAdmin } from "@/lib/auth";

function Sidebar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const userIsAdmin = isAdmin(account?.address);

  return (
    <aside className="hidden w-[200px] flex-col md:flex p-4 border-r">
      <h2 className="text-xl font-bold">Dashboard</h2>
      <nav className="mt-8">
        <ul>
          <li className="mt-2"><Link href="/" className="text-gray-700 hover:text-black">Pandora's Pool</Link></li>
          <li className="mt-2"><Link href="/applicants" className="text-gray-700 hover:text-black">Applicants</Link></li>
          {userIsAdmin && (
            <li className="mt-4 pt-4 border-t">
              <Link href="/admin" className="font-bold text-red-600 hover:text-red-800">Admin Section</Link>
            </li>
          )}
          {account && (
            <li className="mt-4 pt-4 border-t">
              <button
                onClick={() => disconnect(wallet)}
                className="flex items-center text-gray-700 hover:text-black"
              >
                <span className="mr-2">🔌</span>
                Disconnect
              </button>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

function Header() {
  return (
    <header className="z-10">
      <div className="container flex h-12 items-center justify-end py-4">
        {/* <LocaleChange url={"/dashboard"} /> */}
        {/* UserAccountNav would go here */}
      </div>
    </header>
  );
}


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container flex flex-1">
        <Sidebar />
        <main className="flex w-full flex-1 flex-col overflow-hidden p-8">
          <NFTGate>
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-[200px] bg-muted rounded" />
                  <div className="h-[400px] w-full bg-muted rounded" />
                </div>
              }
            >
              {children}
            </Suspense>
          </NFTGate>
        </main>
      </div>
    </div>
  );
}
