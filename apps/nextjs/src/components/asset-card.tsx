import React from 'react';
import Image from 'next/image';
import { cn } from '~/lib/utils';

interface AssetCardProps {
  title: string;
  description: string;
  imageUrl: string;
  tag: string;
  className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({ title, description, imageUrl, tag, className }) => {
  return (
    <div className={cn("relative bg-[#121314] rounded-2xl p-6 flex flex-col justify-between h-full cursor-pointer transform transition-all duration-300 group", className)}>
      <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-gray-700 transition-all duration-300"></div>
      <div className="relative z-10">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm mt-2">{description}</p>
      </div>
      <div className="relative z-10 flex justify-center items-center mt-6">
        <div className="relative w-40 h-40">
          <Image src={imageUrl} alt={title} layout="fill" objectFit="contain" />
        </div>
      </div>
      <div className="absolute top-4 right-4 bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
        {tag}
      </div>
    </div>
  );
};
