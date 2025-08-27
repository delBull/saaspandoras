"use client";

import React from 'react';
import { DitherImage } from './dither-image';
import Link from 'next/link';

const images = [
    '/images/Pandoart.jpg',
    '/images/Pandoart2.jpg',
    '/images/download (2).png',
    '/images/Pandoart3.jpg',
    '/images/download (4).png',
];

import { useFitText } from '~/hooks/use-fit-text';

import type { Dictionary } from '~/types';

export const SiteFooter: React.FC<{ dict: Dictionary }> = ({ dict }) => {
    const { fontSize, ref } = useFitText<HTMLHeadingElement>({ maxFontSize: 150, minFontSize: 50 });
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <footer className="text-white">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left Column */}
                    <div className="flex flex-col justify-between pb-10 pt-10">
                        <div>
                            <div className="grid grid-cols-3 gap-4">
                                <Link href="/" className="font-mono text-white text-sm hover:text-gray-100 transition-colors hover:underline-offset-1 hover:underline z-50">{dict.marketing.main_nav_home}</Link>
                                <Link href="#" className="font-mono text-white text-sm hover:text-gray-100 transition-colors hover:underline-offset-1 hover:underline z-50">{dict.marketing.main_nav_about}</Link>
                                <Link href="/activos" className="font-mono bg-white text-black py-1 rounded-sm text-sm text-center hover:bg-gray-100 transition-colors z-50">{dict.marketing.main_nav_assets}</Link>
                            </div>
                            <h2 ref={ref} style={{ fontSize }} className="w-full text-center font-mono font-bold uppercase mb-4 whitespace-nowrap scale-y-150">{dict.footer.title}</h2>
                            {/*<p className="text-gray-400 max-w-sm mb-6">{dict.slogan}</p>*/}
                         </div>
                        <div className="border border-dashed border-gray-700 rounded-md px-6 py-6 mt-8">
                            <div className="flex justify-between mb-12">
                                <Link href="#" className="font-mono text-sm hover:text-white transition-colors">{dict.footer.white_paper}</Link>
                                <Link href="#" className="font-mono text-sm hover:text-white transition-colors">{dict.footer.support}</Link>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500">
                                <p className="font-mono mb-2 sm:mb-0">{dict.footer.copyright}</p>
                                <div className="flex space-x-4">
                                    <Link href="/terms" className="hover:text-white transition-colors">{dict.footer.terms_privacy}</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden pb-10 pt-10">
                        <DitherImage imageSrc={images[currentImageIndex]!} pixelSize={2} pixelated={true} />
                    </div>
                </div>
            </div>
        </footer>
    );
};