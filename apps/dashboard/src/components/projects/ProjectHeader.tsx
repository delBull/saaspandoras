'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { useRouter } from "next/navigation";
import type { ProjectData } from "@/app/()/projects/types";

interface ProjectHeaderProps {
  project: ProjectData;
  onVideoClick?: () => void;
}

export default function ProjectHeader({ project, onVideoClick }: ProjectHeaderProps) {
  // Acceso seguro a propiedades opcionales
  const projectObj = project as unknown as Record<string, unknown>;
  const coverPhotoUrl = projectObj.coverPhotoUrl || projectObj.cover_photo_url || '/images/default-project.jpg';
  const logoUrl = projectObj.logoUrl || projectObj.logo_url || '/images/default-logo.jpg';
  const tagline = projectObj.tagline || projectObj.description || 'Sin descripción';
  const businessCategory = projectObj.business_category as string | undefined;

  // Check ownership
  const account = useActiveAccount();
  const ownerWallet = (projectObj.applicantWalletAddress || projectObj.applicant_wallet_address) as string | undefined;
  const isOwner = account?.address && ownerWallet && account.address.toLowerCase() === ownerWallet.toLowerCase();

  // Estados para controlar las animaciones
  const [showVideoHint, setShowVideoHint] = useState(false);
  const [stopAnimations, setStopAnimations] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Mostrar la animación después de 3 segundos
    const timer1 = setTimeout(() => {
      setShowVideoHint(true);
    }, 3000);

    // Detener las animaciones después de 20 segundos más (total 23 segundos)
    const timer2 = setTimeout(() => {
      setStopAnimations(true);
    }, 23000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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
              <Image
                src={logoUrl as string}
                alt={`${project.title} logo`}
                width={80}
                height={80}
                className="rounded-xl border-2 md:border-4 border-zinc-900 bg-zinc-800 md:w-[100px] md:h-[100px]"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl md:text-4xl font-bold text-white leading-tight">{project.title}</h1>
              <p className="text-sm md:text-xl text-lime-400 mt-1">{tagline as string}</p>
              <div className="mt-1 text-[10px] md:text-sm text-zinc-400">
                {businessCategory ? businessCategory.toUpperCase().replace(/_/g, ' ') : 'Sin Categoría'}
              </div>
            </div>
          </div>

          {/* Manage DAO Button for Owner */}
          {isOwner && (
            <div className="flex flex-col gap-2 w-full md:w-auto mb-2">
              <Link href={`/projects/${project.slug || project.id}/dao`} className="w-full">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-900/20 border border-purple-500/50 text-sm md:text-base">
                  <BuildingLibraryIcon className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Gestionar DAO</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}