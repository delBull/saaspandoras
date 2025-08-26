import React, { Suspense } from 'react';
import { AssetCard } from './asset-card';

interface AssetGridProps {
  assets: {
    title: string;
    description: string;
    imageUrl: string;
    tag: string;
  }[];
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets }) => {
  return (
    <div className="relative">
      {/* Vertical Grid Lines */}
      <div className="fixed inset-0 grid grid-cols-3 pointer-events-none z-[-1]">
        <div className="border-r border-gray-700"></div>
        <div className="border-r border-gray-700"></div>
        <div></div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
        {assets.map((asset, index) => (
          <Suspense key={index} fallback={<div>Loading...</div>}>
            <div className="p-2">
              <AssetCard {...asset} />
            </div>
          </Suspense>
        ))}
      </div>
    </div>
  );
};
