import { 
  HomeIcon, 
  BanknotesIcon, 
  ArrowPathIcon,
  Cog6ToothIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

interface SidebarProps {
  wallet?: string;
  totalBalance?: number;
}

export function Sidebar({ wallet = "0x1344543534...", totalBalance = 1267.45 }: SidebarProps) {
  return (
    <div className="w-64 bg-zinc-900 min-h-screen flex flex-col">
        <div className="flex-1 py-6 space-y-4">
      {/* Wallet Section */}
      <div className="bg-gray-800/50 rounded-lg p-2 mr-2 ml-2 border border-gray-700">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400 font-mono">C:\PANDORAS\</span>
            <span className="text-xs text-lime-400 font-mono truncate">{wallet}</span>
          </div>
        </div>
      </div>

      {/* Balance Section */}
      <div className="border-b border-gray-800 w-full px-4 pb-2">
        <div className="flex flex-col items-center">
          <Image 
            src="/images/logo.png"
            width={32}
            height={32} 
            alt="Logo" 
            className="h-8 w-8 mb-2" />
          <h3 className="text-xs font-medium text-lime-500">BALANCE</h3>
          <p className="text-xl font-bold font-mono text-lime-300">${totalBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-2">
        {/* Home */}
        <div className="border-b border-gray-800 w-full px-4 pb-2">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-3 p-4 text-gray-400 hover:text-white"
          >
            <HomeIcon className="h-5 w-5" />
            <span>HOME</span>
          </Link>
        </div>

        {/* Invest */}
        <div className="border-b border-gray-800 w-full px-4 pb-2">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-3 p-4 text-gray-400 hover:text-white"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>INVEST</span>
          </Link>
        </div>

        {/* Pool */}
        <div className="border-b border-gray-800 w-full px-4 pb-2">
          <div className="p-4">
            <div className="flex items-center space-x-3 text-gray-300">
              <BanknotesIcon className="h-5 w-5" />
              <span>POOL</span>
            </div>
            <span className="text-xs text-gray-500 ml-8">coming soon</span>
          </div>
        </div>

        {/* Services */}
        <div className="border-b border-gray-800 w-full px-4 pb-2">
          <div className="p-4">
            <h3 className="text-gray-300 mb-2">SERVICES</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">+ Incubation</span>
                <span className="text-xs text-gray-500">coming soon</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">+ Tokenize</span>
                <span className="text-xs text-gray-500">coming soon</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      </div>

      {/* Bottom Links */}
      <div className="border-t border-gray-800 mt-auto">
        <div className="px-4">
          <Link 
            href="/dashboard/billing" 
            className="flex items-center space-x-3 p-4 text-gray-400 hover:text-white"
          >
            <CreditCardIcon className="h-5 w-5" />
            <span>Billing</span>
          </Link>
          <Link 
            href="/dashboard/settings" 
            className="flex items-center space-x-3 p-4 text-gray-400 hover:text-white"
          >
            <Cog6ToothIcon className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
        <div className="flex justify-center py-4">
          <Image 
            src="/images/onlybox2.png" 
            width={54} 
            height={54} 
            alt="Logo" 
            className="h-36 w-36" />
        </div>
      </div>
    </div>
  );
}