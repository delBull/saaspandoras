import { base, sepolia, baseSepolia } from "thirdweb/chains";
import dotenv from "dotenv";

dotenv.config();

const branchName = process.env.VERCEL_GIT_COMMIT_REF || 'main';
const isStaging = branchName === 'staging';

// Default chain logic
// Default chain logic
// Match dashboard logic: Dev/Staging -> Sepolia, Prod -> Base
const defaultChain = (process.env.NODE_ENV === 'development') ? 'sepolia' : 'base';
const chainName = process.env.CHAIN_NAME || defaultChain;

const supportedChains = {
    base: base,
    sepolia: sepolia,
    "base-sepolia": baseSepolia,
} as const;

type SupportedChainName = keyof typeof supportedChains;
// Fallback to sepolia if chainName is invalid in dev, base in prod
const activeChainObject = supportedChains[chainName as SupportedChainName] ?? (process.env.NODE_ENV === 'production' ? base : sepolia);

// Protocols Addresses
const BASE_NFT_ADDRESS = "0xA6694331d22C3b0dD2d550a2f320D601bE17FBba";
const SEPOLIA_NFT_ADDRESS = "0x720f378209a5c68f8657080a28ea6452518f67b0";

// Select address based on active chain
const nftContractAddress =
    (activeChainObject.id === base.id)
        ? (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS_PROD || BASE_NFT_ADDRESS)
        : (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || SEPOLIA_NFT_ADDRESS);
const domain = process.env.NEXT_PUBLIC_DOMAIN || "localhost:3000";
const origin = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

export const config = {
    chain: activeChainObject,
    nftContractAddress,
    domain,
    origin,
};
