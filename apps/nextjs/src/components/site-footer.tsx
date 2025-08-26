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

export const SiteFooter: React.FC = () => {
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
                    <div className="flex flex-col justify-between">
                        <div>
                            <h2 className="text-8xl font-mono font-bold mb-4">PANDORA'S</h2>
                            {/*<p className="text-gray-400 max-w-sm mb-6">{dict.slogan}</p>*/}
                        </div>
                        <div className="border border-dashed border-gray-700 rounded-md pt-16 px-4 pb-4 mt-8 mb-16">
                            <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500">
                                <p className="mb-2 sm:mb-0"> ® Pandora's Finance</p>
                                <div className="flex space-x-4">
                                    <Link href="/terms" className="hover:text-white transition-colors">Terms | Privacy</Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden">
                        <DitherImage imageSrc={images[currentImageIndex]!} pixelSize={2} pixelated={true} />
                    </div>
                </div>
            </div>
        </footer>
    );
};