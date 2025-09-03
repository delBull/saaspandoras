'use client';

import React, { useState } from "react";
import { 
  useActiveAccount,
  useReadContract
} from "thirdweb/react";
import Link from "next/link";
import { config } from "@/config";
import { PromotionalBanner } from "@/components/promotional-banners";
import { PandorasPoolRows } from "~/components/PandorasPoolRows";
import { getContract } from "thirdweb";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi";
import { QrCodeIcon, UserGroupIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { client } from "@/lib/thirdweb-client";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from 'embla-carousel-react';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function MobileHeader({ userName, walletAddress }: { userName: string | null; walletAddress?: string }) {
  return (
    <div className="hidden items-center justify-between w-full mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
           <Image
              src="/images/logo_green.png"
              width={20}
              height={20}
              alt="User"
            />
        </div>
        <span className="font-mono text-sm font-semibold text-white">
          {userName ?? (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not Connected")}
        </span>
      </div>
    </div>
  );
}

function TotalBalance({ total }: { total: number }) {
  return (
    <div className="text-center my-4 md:my-6">
      <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h1>
      <p className="text-sm font-semibold text-red-400 mt-2">Total Investments</p>
    </div>
  );
}

function ActionButton({ icon, label, disabled = false, href }: { icon: React.ReactNode, label: string, disabled?: boolean, href?: string }) {
  const commonClasses = "w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed";
  const content = <>{icon}</>;
  return (
    <div className="flex flex-col items-center gap-1">
      {href && !disabled ? (
        <Link href={href} className={commonClasses}>
          {content}
        </Link>
      ) : (
        <button disabled={disabled} className={commonClasses}>
          {content}
        </button>
      )}
      <span className="text-xs font-semibold text-gray-300 text-center">{label}</span>
    </div>
  );
}

function BannersSection() {
  const [emblaRef] = useEmblaCarousel({ align: 'start', skipSnaps: true, });
  const initialBanners = [
    { id: 1, title: "Hemp Project", subtitle: "Green GENESIS Become an early supporter", actionText: "Do more with hemp!", variant: "purple", imageUrl:"/images/sem.jpeg" },
    { id: 2, title: "Mining Project", subtitle: "Ever dream about being a miner?", actionText: "Soon to be launched", variant: "green", imageUrl: "/images/blockbunny.jpg" },
    { id: 3, title: "RA Wallet", subtitle: "Best blockchain wallet, rewards like no other", actionText: "Win by holding", variant: "red", imageUrl: "/images/narailoft.jpg" },
  ] as const;
  type BannerData = typeof initialBanners[number];
  const [displayedBanners, setDisplayedBanners] = useState<readonly BannerData[]>(initialBanners);
  const handleClose = (idToClose: number) => { setDisplayedBanners(prevBanners => prevBanners.filter(b => b.id !== idToClose)); };
  if (displayedBanners.length === 0) return null;
  return (
    <div className="my-6">
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <AnimatePresence>
          {displayedBanners.map((banner) => ( <motion.div key={banner.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring" }}> <PromotionalBanner {...banner} onClose={() => handleClose(banner.id)} /> </motion.div> ))}
        </AnimatePresence>
      </div>
      <div className="md:hidden overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          <AnimatePresence>
            {displayedBanners.map((banner) => ( <motion.div key={banner.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.3 }} className="flex-none w-[90%] pl-4"> <PromotionalBanner {...banner} onClose={() => handleClose(banner.id)} /> </motion.div> ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AssetRow({ icon, name, cryptoAmount, usdAmount }: { icon: string, name: string, cryptoAmount: string, usdAmount: string }) {
  return (
    <div className="flex items-center justify-between p-3 transition-colors hover:bg-zinc-800/50 rounded-lg cursor-pointer">
      <div className="flex items-center gap-4">
        <Image src={icon} alt={name} width={40} height={40} className="rounded-full" />
        <div>
          <p className="font-bold text-white">{name}</p>
          <p className="text-sm font-mono text-gray-400">{cryptoAmount}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono font-semibold text-white">{usdAmount}</p>
      </div>
    </div>
  );
}

function SecondaryTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const tabs = ["Access", "Tokens"];
  return (
    <div className="flex items-center gap-4">
      {tabs.map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-sm font-bold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

async function fetchUserName(address: string): Promise<string | null> {
  if (address.toLowerCase() === "0xdd2fd4581271e230360230f9337d5c0430bf44c0") {
    await new Promise(resolve => setTimeout(resolve, 300));
    return "vitalik.eth";
  }
  return null;
}

export default function DashboardPage() {
  const [secondaryTab, setSecondaryTab] = useState("Access");
  const account = useActiveAccount();
  
  const contract = getContract({ client, chain: config.chain, address: config.poolContractAddress ?? ZERO_ADDRESS, abi: PANDORAS_POOL_ABI });
  const { data: poolStats, isLoading: isLoadingPool } = useReadContract({ contract: contract, method: "getUserStats", params: [account?.address ?? ZERO_ADDRESS], queryOptions: { enabled: !!account && !!config.poolContractAddress, }, });

  const ethAmount = poolStats ? Number(poolStats[0]) / 1e18 : 0;
  const usdcAmount = poolStats ? Number(poolStats[1]) / 1e6 : 0;
  const totalInvestmentValue = usdcAmount + (ethAmount * 3000);

  return (
    <>
      <MobileHeader userName={null} walletAddress={account?.address} />
      <TotalBalance total={totalInvestmentValue} />
      <div className="grid grid-cols-4 px-4 my-6 md:hidden">
        <ActionButton icon={<QrCodeIcon className="w-6 h-6 text-gray-300"/>} label="Receive" />
        <ActionButton href="/swap" icon={<ArrowPathIcon className="w-6 h-6 text-gray-300"/>} label="Swap" />
        <ActionButton icon={<UserGroupIcon className="w-6 h-6 text-gray-300"/>} label="Applicants" disabled />
        <ActionButton icon={<BanknotesIcon className="w-6 h-6 text-gray-300"/>} label="Pool" disabled />
      </div>
      <BannersSection />
      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-gray-400 px-4">Shares</h3>
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-zinc-900">
            <PandorasPoolRows ethAmount={ethAmount} usdcAmount={usdcAmount} isLoading={isLoadingPool} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4">
            <SecondaryTabs activeTab={secondaryTab} setActiveTab={setSecondaryTab} />
          </div>
          <div className="p-2">
            {secondaryTab === "Access" && ( <div className="p-8 text-center text-gray-500 rounded-lg bg-zinc-900"> <LockClosedIcon className="w-10 h-10 mx-auto mb-2" /> <p className="font-bold">Llaves de Acceso</p> <p className="text-sm">Tus NFTs de acceso se listarán aquí.</p> </div> )}
            {secondaryTab === "Tokens" && ( <div className="p-8 text-center text-gray-500 rounded-lg bg-zinc-900"> <Squares2X2Icon className="w-10 h-10 mx-auto mb-2" /> <p className="font-bold">Tokens</p> <p className="text-sm">Tus tokens de utilidad se mostrarán aquí.</p> </div> )}
          </div>
        </div>
      </div>
    </>
  );
}