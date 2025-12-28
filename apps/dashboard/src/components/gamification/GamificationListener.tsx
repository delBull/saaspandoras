'use client';

import { useEffect, useRef } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { client } from '@/lib/thirdweb-client';
import { config } from '@/config';
import { useToast } from '@saasfly/ui/use-toast';
import { CheckCircle2, Trophy } from 'lucide-react';

export function GamificationListener() {
    const account = useActiveAccount();
    const { toast } = useToast();
    const hasCheckedRef = useRef(false);

    // Apply Pass Contract
    const contract = getContract({
        client,
        chain: config.chain,
        address: config.applyPassNftAddress,
    });

    const { data: balance, isLoading } = useReadContract({
        contract,
        method: 'balanceOf',
        params: [account?.address || '0x0000000000000000000000000000000000000000'],
        queryOptions: { enabled: !!account }
    });

    useEffect(() => {
        if (!account || isLoading || !balance) return;

        const checkAndClaim = async () => {
            // Prevent double firing in dev strict mode
            if (hasCheckedRef.current) return;

            const hasPass = Number(balance) > 0;
            if (!hasPass) return;

            hasCheckedRef.current = true;

            try {
                const res = await fetch('/api/gamification/claim-apply-pass', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-wallet-address': account.address,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.awarded) {
                        toast({
                            title: "¡Nuevo Logro Desbloqueado! 🏆",
                            description: (
                                <div className="flex flex-col gap-1">
                                    <span>Has recibido la insignia <strong>Apply Pass Holder</strong>.</span>
                                    <span className="text-lime-400 font-bold">+100 XP</span>
                                </div>
                            ),
                            duration: 5000,
                        });
                    }
                }
            } catch (error) {
                console.error('Gamification Check Error:', error);
            }
        };

        checkAndClaim();
    }, [account, balance, isLoading, toast]);

    return null; // Invisible component
}
