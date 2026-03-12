import { useState, useEffect } from "react";
import { useApplicantsDataBasic, type Project } from "@/hooks/applicants/useApplicantsDataBasic";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";
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
            const processedAddresses = new Set<string>();

            // Helper to read balance
            const checkBalance = async (address: string, contractType: 'access' | 'utility', project: Project, artifactChainId?: number) => {
                const normalizedAddr = address.toLowerCase();
                if (processedAddresses.has(normalizedAddr)) return;
                processedAddresses.add(normalizedAddr);

                try {
                    // 1. Prioritize artifact-specific chainId
                    // 2. Fallback to project-level chainId
                    // 3. Fallback to global config governance chain
                    const chainId = artifactChainId || project.chainId || Number(config.governanceChain.id);
                    const chain = defineChain(chainId);

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
                    console.warn(`Failed to check balance for ${project.slug} at ${address} on chain ${artifactChainId || project.chainId}`, e);
                }
            };

            await Promise.all(approvedProjects.flatMap(project => {
                const checks = [];

                // 1. Check Legacy/Direct Fields (V1)
                const licenseAddr = project.licenseContractAddress || project.contractAddress;
                if (licenseAddr) checks.push(checkBalance(licenseAddr, 'access', project));

                if (project.utilityContractAddress) {
                    checks.push(checkBalance(project.utilityContractAddress, 'utility', project));
                }

                // 2. Check V2 Artifacts (NEW Column)
                if (Array.isArray(project.artifacts)) {
                    project.artifacts.forEach((artifact: any) => {
                        if (artifact.address) {
                            const type = artifact.type?.toLowerCase() === 'access' ? 'access' : 'utility';
                            checks.push(checkBalance(artifact.address, type as any, project, artifact.chainId ? Number(artifact.chainId) : undefined));
                        }
                    });
                }

                // 3. Check V2 Artifacts (Legacy w2eConfig field)
                const w2eArtifacts = project.w2eConfig?.artifacts;
                if (Array.isArray(w2eArtifacts)) {
                    w2eArtifacts.forEach((artifact: any) => {
                        if (artifact.address) {
                            const type = artifact.type?.toLowerCase() === 'access' ? 'access' : 'utility';
                            checks.push(checkBalance(artifact.address, type as any, project, artifact.chainId ? Number(artifact.chainId) : undefined));
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
