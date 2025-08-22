'use client';

import { useState } from 'react';
import { MintingProgressModal } from '~/components/minting-progress-modal';
import { SuccessNFTCard } from '~/components/success-nft-card';

export default function TestNftCardPage() {
  const [flowState, setFlowState] = useState('idle'); // idle, minting, success
  const [isMintingTest, setIsMintingTest] = useState(true);

  const handleStartMint = () => {
    setIsMintingTest(true);
    setFlowState('minting');
  };

  const handleFinishMint = () => {
    setIsMintingTest(false);
    // The onComplete from the loader will set the flowState to success
  };

  const handleAnimationComplete = () => {
    console.log("Success animation complete on test page");
    setFlowState('idle'); // Reset flow after success animation
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 dark:bg-gray-900">
      {flowState === 'idle' && (
        <button
          onClick={handleStartMint}
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
        >
          Start Mint Process
        </button>
      )}

      {flowState === 'minting' && (
        <>
          <MintingProgressModal
            step="minting"
            onClose={() => setFlowState('success')}
            isMinting={isMintingTest}
          />
          {isMintingTest && (
            <button
              onClick={handleFinishMint}
              className="rounded-md bg-green-500 px-4 py-2 text-white z-[9999] mb-96"
            >
              Finish Mint (Simulate Success)
            </button>
          )}
        </>
      )}

      {flowState === 'success' && (
        <SuccessNFTCard onAnimationComplete={handleAnimationComplete} />
      )}
    </div>
  );
}
