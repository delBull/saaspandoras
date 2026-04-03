'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import type { ProjectData } from "@/app/()/projects/types";
import { StatusTag } from "./ProjectStatusIndicators";

interface ProjectHeaderProps {
  project: ProjectData;
  onVideoClick?: () => void;
}

export default function ProjectHeader({ project, onVideoClick }: ProjectHeaderProps) {
  // Acceso seguro a propiedades opcionales
  const projectObj = project as unknown as Record<string, unknown>;
  
  const sanitizeUrl = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    if (['image', 'logo', 'icon', 'undefined', 'null', 'cover'].includes(cleanUrl.toLowerCase())) return null;
    if (cleanUrl.startsWith('http') || cleanUrl.startsWith('/') || cleanUrl.startsWith('data:')) return cleanUrl;
    if (cleanUrl.startsWith('ipfs:')) {
      const path = cleanUrl.replace(/^ipfs:(\/*)/, '');
      return `https://ipfs.io/ipfs/${path}`;
    }
    return `/${cleanUrl}`;
  };

  const coverPhotoUrl = sanitizeUrl(projectObj.coverPhotoUrl || projectObj.cover_photo_url) || '/images/default-project.jpg';
  const logoUrl = sanitizeUrl(projectObj.logoUrl || projectObj.logo_url) || '/images/default-logo.jpg';
  const tagline = String(projectObj.tagline || projectObj.description || 'Sin descripción');
  const businessCategory = projectObj.business_category;

  // Check ownership
  const account = useActiveAccount();
  const ownerWallet = (projectObj.applicantWalletAddress || projectObj.applicant_wallet_address) as string | undefined;
  const isOwner = account?.address && ownerWallet && account.address.toLowerCase() === ownerWallet.toLowerCase();

  // Estados para controlar las animaciones
  const router = useRouter();

  const handleVideoClick = () => {
    if (onVideoClick) {
      onVideoClick();
    }
  };


  // Debug ownership in console
  useEffect(() => {
    if (account?.address) {
      console.log('[ProjectHeader] Ownership check:', {
        userAddress: account.address.toLowerCase(),
        ownerWallet: ownerWallet?.toLowerCase(),
        isOwner
      });
    }
  }, [account?.address, ownerWallet, isOwner]);

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-xl mb-8">
      {/* Imagen de Portada */}
      <Image
        src={coverPhotoUrl as string}
        alt={`Portada de ${project.title}`}
        fill
        className="object-cover"
        priority
      />


      {/* Superposición Oscura y Contenido */}
      <div className="absolute inset-0 bg-black/60 flex items-end p-4 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 w-full justify-between">
          <div className="flex items-center md:items-end gap-4 md:gap-6">
            {/* Logo */}
            <div className="hidden sm:block">
              <div className="rounded-xl border-2 md:border-4 border-zinc-900 bg-zinc-800 w-[80px] h-[80px] md:w-[100px] md:h-[100px] flex items-center justify-center p-3 overflow-hidden">
                <Image
                  src={(logoUrl as string) || '/images/default-logo.jpg'}
                  alt={`${project.title} logo`}
                  width={100}
                  height={100}
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{project.title}</h1>
                <StatusTag status={project.status} />
              </div>
              <p className="text-sm md:text-xl text-lime-400 mt-1">{tagline as string}</p>
              <div className="mt-1 text-[10px] md:text-sm text-zinc-400">
                {businessCategory && typeof businessCategory === 'string' 
                  ? businessCategory.toUpperCase().replace(/_/g, ' ') 
                  : 'Sin Categoría'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}