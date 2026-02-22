import { useState, useEffect } from "react";
import { useApplicantsDataBasic, type Project } from "@/hooks/applicants/useApplicantsDataBasic";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { config } from "@/config";
import { client } from "@/lib/thirdweb-client";

interface Asset {
    type: 'access' | 'artifact' | 'utility';
    project: Project;
    balance: string;
    name: string;
    tokenAddress: string;
}

export function useUserAssets() {
    const { approvedProjects, loading: loadingProjects } = useApplicantsDataBasic();
    const account = useActiveAccount();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkAssets = async () => {
            if (!account || loadingProjects) {
                if (!loadingProjects && !account && isMounted) setLoading(false);
                return;
            }

            if (isMounted) setLoading(true);
            const foundAssets: Asset[] = [];
            const chain = config.governanceChain;

            // Helper to read balance
            const checkBalance = async (address: string, contractType: 'access' | 'utility', project: Project) => {
                try {
                    const contract = getContract({ client, chain, address });
                    const balance = await readContract({
                        contract,
                        method: "function balanceOf(address) view returns (uint256)",
                        params: [account.address]
                    }) as bigint;

                    if (balance > 0n) {
                        foundAssets.push({
                            type: contractType === 'access' ? 'access' : 'artifact',
                            project,
                            balance: balance.toString(),
                            name: contractType === 'access' ? `${project.title} Access` : `${project.title} Utility`,
                            tokenAddress: address
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to check balance for ${project.slug} at ${address}`, e);
                }
            };

            await Promise.all(approvedProjects.flatMap(project => {
                const checks = [];
                // Check License (Access) - V1
                const licenseAddr = project.licenseContractAddress || project.contractAddress;
                if (licenseAddr) checks.push(checkBalance(licenseAddr, 'access', project));

                // Check Utility (Artifact) - V1
                if (project.utilityContractAddress) checks.push(checkBalance(project.utilityContractAddress, 'utility', project));

                // Check V2 Artifacts (w2eConfig)
                const artifacts = project.w2eConfig?.artifacts;
                if (Array.isArray(artifacts)) {
                    artifacts.forEach((artifact: any) => {
                        if (artifact.address) {
                            checks.push(checkBalance(
                                artifact.address,
                                artifact.type === 'Access' ? 'access' : 'utility',
                                project
                            ));
                        }
                    });
                }

                return checks;
            }));

            if (isMounted) {
                setAssets(foundAssets);
                setLoading(false);
            }
        };

        checkAssets();

        return () => { isMounted = false; };
    }, [account, approvedProjects, loadingProjects]);

    return { assets, loading };
}
