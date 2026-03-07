// Documentation content structure and data

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export interface DocCategory {
  id: string;
  title: string;
  icon: string;
  sections: DocSection[];
}

export const docsData: DocCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "Rocket",
    sections: [
      {
        id: "introduction",
        title: "Introduction to Pandora's",
        content: `# Introduction to Pandora's Platform

Pandora's is a blockchain-based platform that empowers creators to launch **Utility Protocols** with built-in monetization, governance, and community engagement features.

## What is a Utility Protocol?

A Utility Protocol is a blockchain-deployed project that combines:
- **Access Control** via NFT licenses
- **Treasury Management** for sustainable funding
- **DAO Governance** for community decision-making
- **Phase-based Sales** for strategic token distribution
- **Webhook Integrations** for real-time event notifications

## Key Benefits

✅ **No Code Required** - Deploy protocols through an intuitive interface
✅ **Non-Custodial** - Full control over your assets and smart contracts
✅ **Transparent** - All operations are auditable and traceable
✅ **Scalable** - Built on EVM-compatible networks (Ethereum, Polygon, etc.)

## Who is Pandora's For?

- **Content Creators**: Monetize exclusive content and communities
- **DAOs**: Launch governance tokens with utility
- **Projects**: Create sustainable funding models
- **Developers**: Integrate blockchain features via webhooks and APIs

## Next Steps

- Read the [Quick Start Guide](#quick-start) to deploy your first protocol
- Explore [Platform Features](#platform-features) to understand capabilities
- Review [Security & Trust](#security) for our commitment to your safety
`
      },
      {
        id: "quick-start",
        title: "Quick Start Guide",
        content: `# Quick Start Guide

Get started with Pandora's in 5 simple steps.

## Step 1: Connect Your Wallet

Click **"Connect Wallet"** in the top navigation and select your preferred wallet provider (MetaMask, WalletConnect, Coinbase Wallet, etc.).

## Step 2: Browse Protocols

Navigate to **"Protocolos"** to explore existing protocols or click **"Create Protocol"** to start your own.

## Step 3: Configure Your Protocol

When creating a protocol, you'll configure:

### Basic Information
- Protocol name and description
- Cover image and branding
- Category and tags

### Tokenomics
- License token supply
- Pricing (or free mint)
- Access card design

### Sales Phases
- Phase names and allocations
- Pricing tiers
- Start/end dates

### Treasury & Governance
- Treasury wallet address
- DAO parameters (optional)

## Step 4: Deploy to Blockchain

Once configured, click **"Deploy"** to submit your protocol to the blockchain. This will:
1. Deploy smart contracts
2. Create the treasury wallet
3. Mint license tokens
4. Initialize governance (if enabled)

**Note**: Deployment requires gas fees and wallet approval.

## Step 5: Manage & Monitor

After deployment, use the **Admin Operations Panel** to:
- Monitor sales progress
- View webhook events
- Manage phases
- Access DAO governance

## Need Help?

- Join our [Community](#community)
- Read [Detailed Documentation](#platform-features)
- Contact [Support](#support)
`
      },
      {
        id: "creator-journey",
        title: "The Creator Journey",
        content: `# The Creator's Journey

Pandora's is designed to transform individual projects into sustainable, community-driven ecosystems.

## From Vision to Protocol

As a creator, your journey follows a strategic path from initial design to decentralized growth:

### 1. Defining Utility
Before deploying, identify the core value your protocol provides. Is it access to software? Governance power? Revenue sharing? A seat in a private community? 

### 2. Community Building (The Seed)
Use the **Alpha/Founder Phases** to attract your core believers. These early supporters aren't just "buyers"; they are the foundation of your future DAO.

### 3. Progressive Decentralization
Start with a centralized vision and slowly transition control to your members via **DAO Governance**. Use the Treasury to fund community-led initiatives, rewarding those who build alongside you.

### 4. Sustainable Funding
Phased sales ensure your project remains funded at every milestone. Instead of a single "dump" sale, you grow your treasury as you deliver value.

## Achieving Your Goals
- ✅ **Monetization**: Turn your labor into liquid value through NFT licenses.
- ✅ **Autonomy**: Deploy immutable rules that protect your project from platform risk.
- ✅ **Scale**: Leverage the Referrals and Gamification engines to grow organically.
`
      },
      {
        id: "member-journey",
        title: "The Member Journey",
        content: `# The Member's Journey

In the Pandora's ecosystem, you are more than a consumer—you are a stakeholder and a contributor.

## Your Role in the Community

### 1. Discovery & Alignment
Find protocols that align with your interests or values. Look for projects with clear utility and transparent roadmaps.

### 2. Holding with Purpose
Owning an **NFT License** is your "Proof of Believer." It grants you access to the protocol's utility and the right to participate in its future.

### 3. Active Contribution (Labor)
Participating in a protocol's success earns you rewards:
- **Governance**: Vote on proposals to shape the protocol's direction.
- **Referrals**: Bring new members and earn a share of the value created.
- **Gamification**: Climb the ranks to unlock higher-tier perks and lower fees.

## Rewards for Participation
Tokens and XP are the mirrors of your contribution:
- **Direct Rewards**: Protocol-specific tokens or fee rebates.
- **Social Capital**: Ranks and badges that prove your expertise and loyalty.
- **Ecosystem Perks**: Early access to every new protocol launched on Pandora's.

## Value-Driven Participation
The more value you help create for the community (through recruitment, feedback, or governance), the more the system rewards you. This is **Circular Utility**.
`
      }
    ]
  },
  {
    id: "platform-features",
    title: "Platform Features",
    icon: "Zap",
    sections: [
      {
        id: "protocol-deployment",
        title: "Protocol Deployment",
        content: `# Protocol Deployment

Deploy production-ready Utility Protocols to EVM-compatible blockchains without writing code.

## Supported Networks

- **Ethereum** (Mainnet & Sepolia Testnet)
- **Polygon** (Mainnet & Mumbai Testnet)
- **Base** (Mainnet & Sepolia Testnet)
- **Arbitrum** (Mainnet & Sepolia Testnet)

More networks coming soon.

## Deployment Process

### 1. Configuration Phase
Define your protocol parameters via the web interface:
- Tokenomics (supply, price, phases)
- Access control rules
- Treasury configuration
- Governance settings

### 2. Validation Phase
Pandora's validates your configuration:
- ✅ Smart contract compatibility
- ✅ Economic model viability
- ✅ Blockchain network availability

### 3. Deployment Phase
Smart contracts are deployed to the blockchain:
1. **License Token Contract** (ERC-721)
2. **Treasury Contract** (multi-sig or simple)
3. **Governance Contract** (DAO, if enabled)

### 4. Activation Phase
Protocol goes live:
- Minting becomes available
- Webhooks start delivering events
- Dashboard shows real-time metrics

## Deployment Costs

| Component | Estimated Gas |
|-----------|--------------|
| License Contract | ~2-3M gas |
| Treasury Contract | ~500k gas |
| Governance Contract | ~1-2M gas |

**Total**: Varies by network and gas prices. Always check current estimates before deploying.

## Post-Deployment

Once deployed, protocols are **immutable** unless explicitly designed with upgrade patterns. Pandora's recommends:
- Testing thoroughly on testnets
- Starting with conservative parameters
- Using kill switches for integrations (not contracts)

## Security

All deployments undergo:
- ✅ Contract bytecode verification
- ✅ On-chain parameter validation
- ✅ Integration testing
- ✅ Audit trail logging
`
      },
      {
        id: "agora",
        title: "AGORA: Disciplined Economic Model",
        content: `
# AGORA: Institutional Stability Engine

AGORA is not a standard Automated Market Maker (AMM). It is a rules-based liquidity engine designed to protect long-term value through disciplined monetary policy and sovereign risk management.

## Strategic Monetary Phases

To ensure long-term sustainability, AGORA protocol activations are divided into two distinct policy phases:

### Phase 1: Capital Accumulation (Funding)
During the initial launch or growth period, the **Buyback Allocation Ratio** is typically set to **0%**. 
- **Focus**: Building the platform's Net Asset Value (NAV) through usage fees and initial sales.
- **Liquidity**: The market operates within AGORA Price Bands, but the protocol does not yet intervene as a buyer.

### Phase 2: Market Defense (Active ROFR)
Once the treasury reaches institutional thresholds, governance can activate Phase 2 by increasing the **Buyback Allocation Ratio**.
- **Focus**: Stabilizing the floor price through the Right of First Refusal (ROFR).
- **Intervention**: The protocol becomes an "Active Interventor," automatedly buying back assets that fall below NAV using deep liquidity pools.

## Institutional Infrastructure

### 1. Right of First Refusal (ROFR)
When a listing price falls below the current **Net Asset Value (NAV)**, the protocol has the priority right to buy back the assets. This prevents liquidity death spirals and stabilizes the floor price based on real treasury backing.

### 2. Early Exit Amortization
To discourage mass-exit events ("bank runs"), direct redemptions from the treasury incur an **Early Exit Penalty** (default 15%). These fees are recirculated into the treasury, rewarding long-term holders.

### 3. Governance Timelock
All critical parameters—Fees, Max Inventory Ratios, and Penalties—are subject to a mandatory **6-hour to 72-hour timelock**. This ensures transparency and prevents sudden policy shifts.

### 4. Deterministic Indexing
The market state is managed by a sovereign indexer with **Financial-Grade Idempotency**, ensuring that all trades and liquidations are recorded with 100% integrity, even across chain reorganizations.
        `
      },
      {
        id: "access-control",
        title: "Access Control (NFT Licenses)",
        content: `# Access Control via NFT Licenses

Control access to your protocol's utility using blockchain-based NFT licenses.

## How It Works

Pandora's uses **ERC-721 NFTs** as access keys:
1. Users mint a license NFT
2. Smart contract verifies NFT ownership
3. Access to utility is granted

## License Features

### Non-Transferable (Optional)
Lock licenses to original minters to prevent speculation

### Tiered Access
Different NFT IDs can unlock different utility levels

### Revocable (Optional)
Creators can revoke access in emergency situations

### Composable
Licenses work with other DeFi protocols and NFT marketplaces

## Use Cases

**Content Access**
- Exclusive articles, videos, or courses
- Private Discord/Telegram channels
- Early access to products

**Governance Rights**
- Voting power in DAO
- Proposal submission rights
- Treasury allocation decisions

**Economic Benefits**
- Revenue sharing
- Staking rewards
- Priority access to future phases

## Integration

Verify license ownership via:

**On-Chain** (Solidity):
\`\`\`solidity
function hasAccess(address user) public view returns (bool) {
    return licenseContract.balanceOf(user) > 0;
}
\`\`\`

**Off-Chain** (TypeScript):
\`\`\`typescript
const balance = await contract.balanceOf(userAddress);
const hasAccess = balance > 0;
\`\`\`

**Webhooks**:
Listen for \`nft.minted\` events to trigger access grants in your app.
`
      },
      {
        id: "phases",
        title: "Phase-Based Sales",
        content: `# Phase-Based Sales

Launch your protocol with strategic, time-gated sale phases.

## Why Phases?

- **Price Discovery**: Start high, decrease over time
- **Early Supporters**: Reward early adopters
- **Controlled Growth**: Prevent instant sellouts
- **Marketing Moments**: Create anticipation for each phase

## Phase Types

### Time-Based Phases
Duration in days/hours
- Example: "Founder Phase" (7 days)

### Amount-Based Phases
Cap by USD raised or tokens sold
- Example: "Seed Round" ($10,000 cap)

### Hybrid Phases
Combination of time AND amount limits

## Phase Configuration

Each phase includes:

| Parameter | Description |
|-----------|-------------|
| **Name** | Display name (e.g., "Early Bird") |
| **Allocation** | Number of tokens available |
| **Price** | Price per token (or free) |
| **Start Date** | When phase begins (optional) |
| **End Date** | When phase ends (optional) |
| **Image** | Visual for phase card |

## Smart Activation Logic

Phases activate based on:
1. ✅ Start date has arrived
2. ✅ Previous phase is sold out
3. ✅ Phase is not manually paused
4. ✅ End date has not passed

## Phase States

- **🟢 Active**: Currently available for minting
- **🔵 Próximamente**: Not started yet
- **🟠 Esperando**: Waiting for previous phase to sell out
- **🔴 Agotado**: Sold out
- **⏸️ Pausado**: Manually paused by admin
- **⏱️ Finalizado**: End date has passed

## Management

Admins can:
- ✅ Pause/resume phases manually
- ✅ Monitor sales progress in real-time
- ✅ View phase statistics (raised, sold, %)
- ❌ Cannot change price after deployment (immutable)
`
      },
      {
        id: "dao-governance",
        title: "DAO Governance: Institutional Grade",
        content: `# DAO Governance: Institutional Grade

Enable decentralized decision-making for your protocol with an infrastructure built for resilience and political legitimacy.

## Federated Sovereignty

Pandora's supports a **Federated DAO Model**, where individual protocols operate as sovereign micro-DAOs under a unified institutional indexer.

## Governance Robustness

### 1. Ethereum-Grade Hardening
Our governance engine is built as an institutional indexer with high-availability features:
- **Atomic Operations**: Vote counts and participation rates use atomic SQL increments to prevent race conditions.
- **Reorg Protection**: Every governance event is "pinned" to its block hash. The system automatically detects and handles chain reorganizations.
- **Idempotent Invariants**: Deterministic event processing \`(txHash, logIndex)\` ensures that re-indexing never corrupts the political state.

### 2. Multi-Constitutional Support
- **Proposal Snapshots**: Quorum and supply are captured precisely at the \`proposalSnapshot\` block, ensuring no retroactive manipulation of voting weight.
- **Institutional Metrics**: Participation rates and quorum reached are calculated using immutable supply snapshots.

## Voting Models

- **Standard Governor**: Compatible with OpenZeppelin Governor Alpha/Bravo standards.
- **Hybrid Intent Voting**: Telegram acts as a social/intent layer (high-latency, social proof), while Core acts as the executive on-chain layer.

## Proposals & Execution

1. **Submission**: Proposals are submitted with on-chain metadata.
2. **Snapshot**: System fixed supply and quorum at the constitutional block.
3. **Voting**: Transparent on-chain records with real-time participation monitoring.
4. **Execution**: Atomic execution via Timelock contracts for authorized upgrades and treasury movements.
`
      },
      {
        id: "webhooks",
        title: "Webhook Integrations",
        content: `# Webhook Integrations

Connect Pandora's events to your applications in real-time.

## What are Webhooks?

Webhooks deliver HTTP POST requests to your server when events occur:
- **NFT Minted**: New license purchased
- **Phase Changed**: Sales phase transitioned
- **Governance Vote**: New vote cast
- **Treasury Updated**: Funds received

## Setup

1. **Register Webhook URL** in your protocol settings
2. **Verify HMAC Signature** on incoming requests
3. **Process Events** and trigger your app logic
4. **Return 200 OK** to acknowledge receipt

## Example: NFT Minted Event

\`\`\`typescript
// Webhook payload
{
  "event": "nft.minted",
  "timestamp": "2026-02-08T21:00:00Z",
  "data": {
    "tokenId": "42",
    "minter": "0x1234...",
    "price": "0.05",
    "phase": "Early Bird"
  },
  "signature": "sha256=..."
}
\`\`\`

## Signature Verification

**Critical**: Always verify the HMAC signature to prevent spoofing.

\`\`\`typescript
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  const expected = \`sha256=\${hash}\`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
\`\`\`

## Event Types

| Event | Trigger |
|-------|---------|
| \`nft.minted\` | License NFT purchased |
| \`nft.transferred\` | NFT ownership changed |
| \`phase.started\` | New phase activated |
| \`phase.sold_out\` | Phase allocation exhausted |
| \`treasury.deposit\` | Funds received |
| \`governance.proposal_created\` | New proposal submitted |
| \`governance.vote_cast\` | Vote recorded |

## Reliability

Pandora's guarantees:
- ✅ **At-least-once delivery** (retries on failure)
- ✅ **Idempotency** (same event = same ID)
- ✅ **Replay protection** (timestamp validation)
- ✅ **Dead Letter Queue** (manual replay if needed)

## Best Practices

1. **Return 200 quickly**: Process async, acknowledge fast
2. **Implement idempotency**: Same event_id = same result
3. **Validate timestamps**: Reject old/replayed events
4. **Log everything**: Audit trail for debugging
5. **Handle retries**: Don't duplicate actions

## Troubleshooting

Use the **Admin Operations Panel** to:
- View webhook delivery status
- Manually replay failed events
- Monitor error rates
- Pause/resume webhook delivery (kill switch)
`
      }
    ]
  },
  {
    id: "gamification",
    title: "Gamification & Rewards",
    icon: "Trophy",
    sections: [
      {
        id: "concept",
        title: "Gamification System",
        content: `# Gamification & Rewards
                
Pandora's integrates a deep gamification layer to drive engagement and reward loyal community members.

## Core Concepts

### Experience Points (XP)
Users earn XP for nearly every positive action on the platform. XP determines a user's **Rank** and standing in the community.

### Tokens & Rewards
Some activities also award platform tokens or protocol-specific rewards (boosts, badges, or NFT traits).

## User Ranks

| Rank | Requirement | Perks |
|------|-------------|-------|
| **🥉 Bronze** | New User | Standard Access |
| **🥈 Silver** | 1,000 XP | Priority Webhooks |
| **🥇 Gold** | 5,000 XP | Early Phase Access |
| **💎 Platinum** | 20,000 XP | Lower Platform Fees |
| **🐋 Whale** | 100,000 XP | Governance Multiplier |
| **🐙 Kraken** | Top 1% | Direct Support Channel |

## Earning XP

✅ **Daily Login**: Earn XP just for checking in.
✅ **Protocol Launch**: Huge XP boost for creators.
✅ **DAO Participation**: Vote on proposals to earn governance XP.
✅ **Donations/Contributions**: Support protocols to climb the leaderboard.
✅ **Referrals**: Bring new creators to the platform.
`
      }
    ]
  },
  {
    id: "referrals",
    title: "Referral & Growth",
    icon: "Users",
    sections: [
      {
        id: "referral-program",
        title: "Referral Program",
        content: `# Referral Program

Grow your protocol's community through our built-in, automated referral system.

## How it Works

1. **Unique Links**: Every user has a referral link tied to their wallet.
2. **Automatic Detection**: When a new user visits via a referral link, the platform tracks the relationship.
3. **On-Chain/Off-Chain Tracking**: Depending on the protocol config, rewards are triggered on-chain (tokens) or off-chain (XP).

## Features

- **No Manual Entry**: Users don't need to type codes; it's all in the URL.
- **Creator Rewards**: Protocols can set a % of their sales to go to referrers.
- **Sybil Protection**: Built-in logic to prevent self-referral and bot abuse.
- **Dashboard Tracking**: See your referral stats, pending rewards, and conversion rates.
`
      }
    ]
  },
  {
    id: "security",
    title: "Security & Trust",
    icon: "Shield",
    sections: [
      {
        id: "security-overview",
        title: "Security Overview",
        content: `# Security & Trust Overview

Pandora's is built with a **security-first, non-custodial architecture**.

## Our Security Philosophy

We prioritize:
- 🔒 **Minimizing trust assumptions**
- 🛡️ **Eliminating single points of failure**
- 🔄 **Designing for safe failure and recovery**

### Critical Principle

**Pandora's does not custody user funds, store private keys, or handle sensitive personal data.**

## Platform Architecture

Pandora's operates on a layered architecture with clear separation of concerns:

### 🏗️ Core Platform
Source of truth for state, events, and integrations

### 🌐 Edge Applications
Dashboards, bots, and APIs for user interaction

### ⛓️ Blockchain Layer
Immutable execution on EVM-compatible networks

Each layer has clearly defined responsibilities and strict isolation boundaries.

## Key Security Controls

### 🔐 Authentication & Access Control

✅ **Wallet-based authentication** for administrative access  
✅ **Role-based authorization** (least privilege principle)  
✅ **Audit logging** for all privileged actions  
✅ **No shared credentials** between environments

Administrative access requires cryptographic wallet signatures, providing stronger security guarantees than traditional username/password authentication.

### 🔁 Secure Webhooks

Pandora's implements **industry-standard webhook security**:

✅ **Cryptographic signature verification** (HMAC-SHA256)  
✅ **Replay protection** using timestamps (±5 min window)  
✅ **HTTPS-only delivery** (no plaintext transmission)  
✅ **Idempotent event processing** (safe replay)

These controls ensure:
- **Authenticity**: Only Pandora's can send valid webhooks
- **Integrity**: Payloads cannot be tampered with in transit
- **Timeliness**: Replayed or stale events are rejected

### 🚨 Operational Kill Switches

Pandora's includes **built-in safety mechanisms** to respond to incidents without data loss:

✅ **Immediate pause** of webhook delivery or integrations  
✅ **Double-confirmation** for critical actions (typed "CONFIRM" required)  
✅ **No data deletion** during incident handling  
✅ **Safe recovery** via manual replay from audit logs

This enables **rapid containment** while preserving **full audit trail** for forensics and recovery.

### 🧾 Auditability & Logging

✅ All operational actions are **logged immutably**  
✅ Administrative changes are **traceable** to specific actors  
✅ Incident response actions are **recorded** with timestamps  
✅ Logs are **retained** for compliance and debugging

**No log deletion** capability exists in production to ensure forensic integrity.

## What We Store

✅ Project metadata (public information)  
✅ Operational event records (status, timestamps)  
✅ API credentials (**SHA-256 hashed**, never plaintext)  
✅ Wallet addresses (public blockchain data)

## What We DO NOT Store

❌ Private keys or seed phrases  
❌ User funds or custody  
❌ Payment card information  
❌ Sensitive personal data (PII)  
❌ Financial account details

**Pandora's is designed to minimize data exposure by default.**

## Environment Isolation

Our platform enforces **strict separation** between staging and production:

✅ Independent databases and credentials  
✅ Separate API keys and webhook secrets  
✅ **No cross-environment data access**  
✅ Production actions require explicit authorization

This prevents accidental production impact during development and testing.

## Incident Response

Pandora's follows a **structured incident response process**:

1. **Detection**: Automated alerts or manual reporting
2. **Isolation**: Kill switch activation to contain impact
3. **Resolution**: Root cause analysis and fix deployment
4. **Recovery**: Manual event replay with validation

This approach ensures:
- ✅ Transparency (all actions logged)
- ✅ Traceability (audit trail preserved)
- ✅ Minimal disruption (graceful degradation)

## Responsible Disclosure

We welcome **responsible security disclosures** from researchers and partners.

If you believe you have found a security vulnerability, please contact us via our designated security channel.

**We commit to**:
- Acknowledging reports within 72 hours
- Providing status updates on investigation and remediation
- Recognizing responsible reporters (with permission)
---

## Trust Summary

### Security Guarantees

✔ **No custody** of funds or private keys  
✔ **Cryptographically secure** integrations (HMAC, HTTPS)  
✔ **Operational kill switches** and safe recovery  
✔ **Environment isolation** (staging ≠ production)  
✔ **Transparent security** posture (documented and auditable)

### Operational Maturity

✔ Real-time monitoring and alerting  
✔ Documented incident response procedures  
✔ Graceful degradation under load  
✔ Immutable audit logging  
✔ Quarterly incident simulations (drills)

---

## For Partners & Integrators

**Pandora's is designed for safe, observable, and resilient integrations.**

If you're evaluating Pandora's for integration:
- Review our **Webhook Specification** for technical details
- Request our **Security Questionnaire Response** for compliance reviews
- Schedule a **technical walkthrough** with our engineering team
`
      }
    ]
  },
  {
    id: "legal",
    title: "Legal & Compliance",
    icon: "FileText",
    sections: [
      {
        id: "terms-of-service",
        title: "Terms of Service",
        content: `# Terms of Service

**Last Updated**: February 2026

## 1. Acceptance of Terms

By accessing or using Pandora's Platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.

## 2. Platform Description

Pandora's provides blockchain infrastructure tooling to deploy and manage Utility Protocols. The Platform is:
- **Non-custodial**: We do not hold, custody, or control user funds or private keys
- **Infrastructure-only**: We provide tools, not financial services
- **Decentralized**: Protocols are deployed to public blockchains

## 3. User Responsibilities

Users are solely responsible for:
- ✅ Safeguarding private keys and wallet credentials
- ✅ Compliance with local laws and regulations
- ✅ All transactions and smart contract interactions
- ✅ Tax reporting and obligations
- ✅ Understanding blockchain risks (irreversibility, gas fees, etc.)

## 4. No Custody, No Control

**Pandora's does NOT**:
- ❌ Custody your funds
- ❌ Control deployed smart contracts
- ❌ Reverse blockchain transactions
- ❌ Provide financial advice
- ❌ Act as a broker, intermediary, or finanical institution

## 5. Disclaimer of Warranties

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
- Merchantability
- Fitness for a particular purpose
- Non-infringement
- Availability or uptime
- Accuracy of data

## 6. Limitation of Liability

Pandora's and its affiliates shall not be liable for:
- Loss of funds due to user error, hacks, or exploits
- Smart contract bugs or vulnerabilities
- Blockchain network failures or congestion
- Third-party integrations or services
- Regulatory actions or legal proceedings

Maximum liability: Amount paid to Pandora's in the 12 months prior to the claim.

## 7. Prohibited Uses

Users may NOT:
- ❌ Use the Platform for illegal activities
- ❌ Violate securities laws or regulations
- ❌ Engage in market manipulation
- ❌ Deploy malicious or fraudulent contracts
- ❌ Abuse or attack the Platform infrastructure

## 8. Intellectual Property

Pandora's retains all rights to the Platform's code, design, and branding. Open-source components remain subject to their respective licenses.

## 9. Modifications to Terms

Pandora's reserves the right to modify these Terms at any time. Continued use after modifications constitutes acceptance.

## 10. Governing Law

These Terms are governed by the laws of [Jurisdiction TBD]. Disputes shall be resolved through binding arbitration.

## 11. Contact

For questions about these Terms:
- Email: legal@pandoras.finance (TBD)
- Website: https://pandoras.finance

---

**By using Pandora's Platform, you acknowledge that you have read, understood, and agree to these Terms of Service.**
`
      },
      {
        id: "privacy-policy",
        title: "Privacy Policy",
        content: `# Privacy Policy

**Last Updated**: February 2026

## 1. Introduction

Pandora's ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard data when you use our Platform.

## 2. Data We Collect

### Automatically Collected
- **Wallet Addresses**: Public blockchain identifiers (publicly visible on-chain)
- **Transaction Hashes**: Public blockchain records
- **Usage Data**: Pages visited, features used (anonymized analytics)
- **IP Addresses**: For security and rate limiting (not linked to identities)

### User-Provided
- **Project Metadata**: Protocol names, descriptions, images (public)
- **API Keys**: Hashed and stored securely (never plaintext)
- **Webhook URLs**: For integration purposes

## 3. Data We DO NOT Collect

❌ **Private Keys or Seed Phrases**  
❌ **Personally Identifiable Information (PII)** (names, emails, addresses)  
❌ **Payment Card Information**  
❌ **Financial Account Details**  
❌ **Biometric Data**

## 4. How We Use Data

We use collected data to:
- ✅ Provide Platform services
- ✅ Monitor system health and performance
- ✅ Detect and prevent abuse
- ✅ Improve user experience
- ✅ Comply with legal obligations

## 5. Data Sharing

We **do NOT** sell or rent your data.

We may share data with:
- **Infrastructure Providers**: Vercel, database hosting (encrypted)
- **Blockchain Networks**: Public data is written to public blockchains
- **Legal Authorities**: If required by law or court order

## 6. Data Retention

- **Operational Logs**: Retained indefinitely for audit purposes
- **Webhook Events**: Retained for replay and debugging
- **API Keys**: Retained until manually revoked
- **Analytics**: Aggregated data retained indefinitely

## 7. User Rights

You have the right to:
- ✅ Access data related to your wallet address
- ✅ Request deletion of non-essential data
- ✅ Revoke API keys at any time
- ✅ Opt-out of analytics (via Do Not Track)

**Note**: Blockchain data is public and immutable; we cannot delete on-chain records.

## 8. Security Measures

We implement:
- ✅ Encryption at rest and in transit
- ✅ Role-based access control
- ✅ Regular security audits
- ✅ Incident response procedures

## 9. Cookies

Pandora's uses essential cookies for:
- Session management
- Authentication
- Security (CSRF protection)

We do **NOT** use third-party advertising cookies.

## 10. Children's Privacy

Pandora's does not knowingly collect data from users under 13 years of age. If we discover underage usage, we will terminate access immediately.

## 11. International Users

Data may be processed in [Jurisdictions TBD]. By using the Platform, you consent to cross-border data transfers.

## 12. Changes to This Policy

We may update this Privacy Policy. Continued use after updates constitutes acceptance.

## 13. Contact

For privacy inquiries:
- Email: privacy@pandoras.finance (TBD)
- Website: https://pandoras.finance

---

**By using Pandora's Platform, you acknowledge that you have read and understood this Privacy Policy.**
`
      },
      {
        id: "disclaimer",
        title: "Non-Custodial Disclaimer",
        content: `# Non-Custodial Disclaimer

## 🔐 Critical Understanding

**Pandora's Platform is a non-custodial Infrastructure provider.**

This means:

### We DO NOT

❌ **Hold your funds**  
Pandora's never takes possession of user assets, cryptocurrencies, or tokens.

❌ **Store your private keys**  
Your wallet, your keys, your responsibility. We cannot access or recover your wallet.

❌ **Control your smart contracts**  
Once deployed, protocols are on-chain and immutable. We cannot modify, pause, or reverse them.

❌ **Act as a financial intermediary**  
We are not a bank, broker, custodian, or money transmitter.

❌ **Provide financial advice**  
Using the Platform is at your own discretion and risk.

### You ARE Responsible For

✅ **Safeguarding your private keys**  
If lost, funds are irrecoverable. We cannot help.

✅ **Understanding blockchain risks**  
Transactions are final, irreversible, and may fail.

✅ **Compliance with laws**  
Ensure your protocol complies with local regulations.

✅ **Smart contract security**  
Deployed contracts may have bugs. Audit code before use.

✅ **Gas fees and costs**  
You pay all blockchain transaction fees.

### Risks You Accept

By using Pandora's, you acknowledge:

⚠️ **Blockchain Irreversibility**: Transactions cannot be undone  
⚠️ **Smart Contract Bugs**: Code may have vulnerabilities  
⚠️ **Network Failures**: Blockchains may become congested or fail  
⚠️ **Regulatory Uncertainty**: Laws may change  
⚠️ **No Insurance**: Funds are not FDIC-insured or protected  
⚠️ **Total Loss Possible**: You may lose all deployed assets

## Legal Classification

Pandora's is:
- ✅ **Infrastructure Tooling** (like GitHub for smart contracts)
- ✅ **Software-as-a-Service** (SaaS)
- ❌ **NOT a financial service**
- ❌ **NOT a custodian**
- ❌ **NOT a securities issuer**

## No Recourse

If you:
- Lose your private keys
- Send funds to the wrong address
- Deploy a buggy contract
- Experience a blockchain failure

**We CANNOT reverse, refund, or recover anything.**

## Your Sole Responsibility

You are 100% responsible for:
- Wallet security
- Contract audits
- Regulatory compliance
- Risk management
- Backups and recovery plans

---

**By using Pandora's, you confirm that you understand and accept these terms.**

**If you are not comfortable with non-custodial platforms, DO NOT USE PANDORA'S.**
`
      }
    ]
  },
  {
    id: "transparency",
    title: "Transparency",
    icon: "Eye",
    sections: [
      {
        id: "platform-metrics",
        title: "Platform Metrics",
        content: `# Platform Metrics & Transparency

Pandora's is committed to operational transparency.

## Real-Time Operational Metrics

Access live platform metrics via the **Admin Operations Panel**:

### System Health (Layer 1)
- **API Uptime**: % of time the platform is responding correctly.
- **Error Rate (5xx)**: Frequency of server-side errors.
- **P95 Latency**: Speed at which 95% of requests are handled.

### Webhooks & Integrations (Layer 2)
- **Success Ratio**: % of webhooks delivered successfully.
- **Retry Count**: Average number of attempts per delivery.
- **DLQ Size**: Count of failed events requiring manual intervention.

### Security & Abuse (Layer 3)
- **Invalid Signatures**: Failed HMAC verifications (attack detection).
- **Rejected Timestamps**: Blocked replay attack attempts.
- **Invalid API Key Hits**: Unauthorized access attempts.

## Audit Logs

All critical actions are logged immutably:
- Deployment events (timestamp, deployer, chain)
- Admin actions (kill switch, replay, config changes)
- Webhook deliveries (success/failure, retries)
- Governance votes (proposals, votes cast)

**Logs are retained indefinitely and cannot be deleted.**

## Open Source Components

Pandora's uses the following open-source technologies:
- **Next.js**: React framework
- **thirdweb**: Web3 SDK
- **Drizzle ORM**: Database toolkit
- **TailwindCSS**: Styling framework

## Security Audits

**Status**: Planned for Q2 2026

- Smart contract audits (external firm)
- Penetration testing (infrastructure)
- Code review (security-critical paths)

Audit reports will be published upon completion.

## Roadmap 2026

### Q1: The Foundation
- ✅ Multi-network deployment support (Base, Poly, Eth)
- ✅ Webhook v2 with signing and DLQ
- ✅ Operations Admin Dashboard
- ✅ GitBook-style Whitepaper Portal

### Q2: Security & Scale
- [ ] External Security Audit
- [ ] Multi-sig Treasury Integration
- [ ] Advanced Referral Engine v2
- [ ] Public API for Custom App Development

### Q3: Governance & Community
- [ ] DAO Governance v2 (Delegation & Quadratic Voting)
- [ ] Revenue Sharing Contracts
- [ ] Protocol Analytics Dashboard for Creators
- [ ] Community Grant Program

### Q4: Ecosystem expansion
- [ ] Mobile App (iOS/Android)
- [ ] Cross-chain Protocol Bridging
- [ ] Institutional Integration SDK
- [ ] Launch of Platform Governance Token ($PBOX)

## Contact for Transparency Inquiries

For questions about platform operations:
- Email: transparency@pandoras.finance (TBD)
- Dashboard: [Operations Panel](/admin/operations) (Super Admin only)
`
      }
    ]
  },
  {
    id: "developer",
    title: "Developer Resources",
    icon: "Code",
    sections: [
      {
        id: "api-docs",
        title: "API Documentation",
        content: `# API Documentation

Pandora's provides REST APIs for programmatic access to platform features.

## Authentication

All API requests require an API key in the header:

\`\`\`bash
Authorization: Bearer YOUR_API_KEY_HERE
\`\`\`

**Get your API key**: Navigate to [Profile Settings](/profile) → API Keys

## Base URL

\`\`\`
https://dashboard.pandoras.finance/api
\`\`\`

## Rate Limits

- **Standard**: 100 requests/minute
- **Premium**: 1000 requests/minute (coming soon)

Rate limit headers:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1673548800
\`\`\`

## Endpoints

### Get Protocol Details

\`\`\`http
GET /api/protocols/{slug}
\`\`\`

**Response**:
\`\`\`json
{
  "id": "abc123",
  "slug": "my-protocol",
  "title": "My Protocol",
  "status": "deployed",
  "chainId": 1,
  "licenseContractAddress": "0x1234...",
  "treasuryAddress": "0x5678...",
  "w2eConfig": { ... }
}
\`\`\`

### List Webhook Events

\`\`\`http
GET /api/webhooks/events?limit=100&offset=0
\`\`\`

**Response**:
\`\`\`json
{
  "events": [
    {
      "id": "evt_123",
      "type": "nft.minted",
      "status": "delivered",
      "timestamp": "2026-02-08T21:00:00Z",
      "data": { ... }
    }
  ],
  "total": 1234,
  "hasMore": true
}
\`\`\`

### Trigger Manual Webhook Replay

\`\`\`http
POST /api/webhooks/replay
Content-Type: application/json

{
  "eventId": "evt_123"
}
\`\`\`

**Response**:
\`\`\`json
{
  "status": "replayed",
  "deliveryStatus": "success",
  "timestamp": "2026-02-08T21:05:00Z"
}
\`\`\`

## Error Handling

Standard HTTP status codes:
- \`200\`: Success
- \`400\`: Bad Request
- \`401\`: Unauthorized (invalid API key)
- \`403\`: Forbidden (insufficient permissions)
- \`404\`: Not Found
- \`429\`: Too Many Requests (rate limit exceeded)
- \`500\`: Internal Server Error

**Error Response**:
\`\`\`json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Protocol slug is required",
    "details": { ... }
  }
}
\`\`\`

## SDKs & Libraries

### TypeScript/JavaScript

\`\`\`bash
npm install @pandoras/sdk
\`\`\`

\`\`\`typescript
import { PandorasClient } from '@pandoras/sdk';

const client = new PandorasClient({ apiKey: 'your_key' });
const protocol = await client.protocols.get('my-protocol');
\`\`\`

### Python (Coming Soon)

\`\`\`bash
pip install pandoras-python
\`\`\`

### Go (Planned)

Community contributions welcome!

## Best Practices

1. **Cache responses**: Avoid redundant API calls
2. **Handle rate limits**: Implement exponential backoff
3. **Secure API keys**: Never commit to version control
4. **Monitor usage**: Track API consumption
5. **Test in staging**: Use testnet protocols first
`
      },
      {
        id: "code-examples",
        title: "Code Examples",
        content: `# Code Examples

Practical examples for common integration patterns.

## Example 1: Verify NFT License Ownership

\`\`\`typescript
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http()
});

async function hasLicense(
  licenseContract: string,
  userAddress: string
): Promise<boolean> {
  const balance = await client.readContract({
    address: licenseContract as \`0x\${string}\`,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [userAddress as \`0x\${string}\`]
  });

  return balance > 0n;
}

// Usage
const hasAccess = await hasLicense(
  '0x1234...', // License contract address
  '0x5678...'  // User wallet address
);

if (hasAccess) {
  console.log('✅ User has access!');
} else {
  console.log('❌ User needs to mint license NFT');
}
\`\`\`

## Example 2: Handle Webhook Events

\`\`\`typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

// IMPORTANT: Use raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.post('/webhooks/pandoras', (req, res) => {
  const signature = req.headers['x-pandoras-signature'];
  const timestamp = req.headers['x-pandoras-timestamp'];
  const rawBody = req.rawBody;

  // 1. VERIFY TIMESTAMP (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(now - requestTime);

  if (timeDiff > 300) { // 5 minutes
    return res.status(400).json({ error: 'Timestamp too old' });
  }

  // 2. VERIFY HMAC SIGNATURE
  const secret = process.env.WEBHOOK_SECRET!;
  const hash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedSig = \`sha256=\${hash}\`;
  
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 3. PROCESS EVENT (with idempotency)
  const event = req.body;
  
  switch (event.type) {
    case 'nft.minted':
      handleNFTMinted(event.data);
      break;
    case 'phase.started':
      handlePhaseStarted(event.data);
      break;
    // ... more events
  }

  // 4. ACKNOWLEDGE IMMEDIATELY
  res.status(200).json({ received: true });
});

function handleNFTMinted(data: any) {
  // TODO: Grant access to user
  // TODO: Send welcome email
  // TODO: Update analytics
  console.log(\`NFT minted: #\${data.tokenId} by \${data.minter}\`);
}

app.listen(3000);
\`\`\`

## Example 3: Query Protocol Metrics

\`\`\`typescript
import { PandorasClient } from '@pandoras/sdk';

const client = new PandorasClient({
  apiKey: process.env.PANDORAS_API_KEY!
});

async function getProtocolMetrics(slug: string) {
  const protocol = await client.protocols.get(slug);
  
  // Calculate metrics
  const totalSupply = await client.contracts.getTotalSupply(
    protocol.licenseContractAddress
  );
  
  const treasuryBalance = await client.contracts.getBalance(
    protocol.treasuryAddress
  );

  const activePhase = protocol.w2eConfig.phases.find(
    (p: any) => p.isActive
  );

  return {
    protocol: protocol.title,
    nftsMinted: totalSupply,
    treasuryUSD: treasuryBalance,
    currentPhase: activePhase?.name || 'N/A',
    progress: (treasuryBalance / protocol.targetAmount) * 100
  };
}

// Usage
const metrics = await getProtocolMetrics('my-protocol');
console.log(JSON.stringify(metrics, null, 2));
\`\`\`

## Example 4: Deploy Protocol Programmatically

\`\`\`typescript
// Coming soon: Full deployment API
// For now, use the Dashboard UI

import { PandorasClient } from '@pandoras/sdk';

const client = new PandorasClient({ apiKey: 'your_key' });

// Future API (not yet available)
const deployment = await client.protocols.deploy({
  title: 'My Protocol',
  description: 'Built via API',
  chainId: 1, // Ethereum mainnet
  tokenomics: {
    maxSupply: 1000,
    price: '0.05', // ETH
  },
  phases: [
    {
      name: 'Public Sale',
      allocation: 1000,
      tokenPrice: '0.05'
    }
  ]
});
\`\`\`

## Example 5: Monitor Operations Panel

\`\`\`typescript
async function monitorPlatform() {
  const status = await fetch('/api/admin/operations/status')
    .then(r => r.json());

  console.log('Platform Health:', {
    webhooksEnabled: status.webhooksEnabled,
    errorRate: status.errorRate,
    dlqSize: status.dlqSize,
    uptime: status.uptime
  });

  if (status.dlqSize > 0) {
    console.warn(\`⚠️ Dead Letter Queue has \${status.dlqSize} events\`);
  }
}

setInterval(monitorPlatform, 10_000); // Every 10 seconds
\`\`\`

## More Examples

Explore the [GitHub Repository](#) (coming soon) for:
- Full Next.js integration example
- Discord bot with license gating
- Telegram bot with webhook triggers
- Analytics dashboard
- DAO governance client
`
      }
    ]
  },
  {
    id: "roadmap",
    title: "Roadmap & Future",
    icon: "Map",
    sections: [
      {
        id: "2025-vision",
        title: "2025 Strategic Vision",
        content: `# Roadmap of Evolution
        
Our vision to democratize investment in real-world assets globally.

## Q4 2024: Beta Launch (Completed)
- **Status**: ✅ Completed
- **Focus**: Initial platform with basic tokenization features.
- **Key Features**:
  - Basic Asset Tokenization
  - Wallet Integration
  - Administrative Panel
  - Initial KYC System

## Q1 2025: Multi-Asset Expansion (Completed)
- **Status**: ✅ Completed
- **Focus**: Support for diverse real-world asset types.
- **Key Features**:
  - Startup Tokenization
  - Art & Collectibles
  - Intellectual Property
  - Renewable Energy Assets

## Q2 2025: Full Gamification (In Progress)
- **Status**: 🔄 In Development
- **Focus**: Advanced engagement and reward systems.
- **Key Features**:
  - XP & Leveling System
  - Achievements & Badges
  - Global Leaderboard
  - Exclusive Rewards

## Q3 2025: Internationalization (Upcoming)
- **Status**: 📅 Planned
- **Focus**: Global expansion and multi-language support.
- **Key Features**:
  - Full Multi-language Support
  - International Regulatory Compliance
  - Local Strategic Partners
  - 24/7 Multi-zone Support

## Q4 2025: Advanced Web3 (Upcoming)
- **Status**: 📅 Planned
- **Focus**: DeFi integration and DAO Governance.
- **Key Features**:
  - Decentralized Governance
  - Staking & Yield Farming
  - Dynamic NFTs
  - Cross-chain Compatibility
`
      },
      {
        id: "nft-lab-future",
        title: "NFT Lab 2.0",
        content: `# NFT Lab 2.0: Scalability & Future Roadmap

We are scaling the **NFT Lab** into a comprehensive ecosystem for Phygital interaction and on-chain loyalty.

## 1. Smart Actions (Dynamic Interactions)
Currently, "Smart QR" redirects to a URL. The evolution is for the QR to **execute on-chain logic** or update NFT state.

- **Proof of Presence (POAP 2.0)**: Scanning QR at a physical event updates metadata to prove attendance.
- **Burn-to-Redeem**: For coupons/gifts. Authenticated owners can "Burn" the NFT to redeem physical products.
- **Dynamic Shortlinks**: Destination URL changes based on NFT state (e.g., Info -> Check-in -> Photo Gallery).

## 2. Physical-Digital Twins (NFC Integration)
Bringing "NFT Lab" to the physical world via NFC chips (IYK, HaLo) embedded in merch or cards.

- **Chip Linking**: Link a unique physical chip ID to a specific NFT in the dashboard.
- **Tap-to-Verify**: Verify authenticity/ownership by tapping a phone against the object.
- **Superpowered Merch**: Wearables that grant VIP access only if the wearer holds the linked NFT.

## 3. Token Gated Commerce & Perks
Turning NFTs into master keys for content and commerce.

- **Shopify Integration**: Auto-discounts for holders of specific "Identity NFTs".
- **Exclusive Content**: Dashboard sections or videos unlocked by wallet verification.

## 4. Gamification & Loyalty (XP System)
Integration with the existing Gamification ecosystem.

- **Level Up**: "Digital Identity" NFTs accumulate XP based on user activity (voting, donating, attending).
- **Soulbound Reputation**: Visual upgrades to the NFT art reflecting user rank and reputation.

## 5. Account Abstraction (Invisible Onboarding)
Removing the "Connect Wallet" barrier for mass adoption.

- **Gasless Minting**: Admins sponsor gas for new users.
- **Email Wallets**: Invisible wallets linked to email/phone.
- **Magic Links**: Airdrops via email links that auto-create wallets.

---

### Architecture Overview

\`\`\`mermaid
graph TD
    User[End User]
    Physical[Physical World (QR/NFC)]
    Lab[NFT Lab Dashboard]
    Contract[Smart Contracts]
    
    User -- Scan/Tap --> Physical
    Physical -- Trigger --> API[API Actions Layer]
    Lab -- Configure --> API
    Lab -- Deploy --> Contract
    API -- Read State --> Contract
    API -- Exec Tx (Gasless) --> Contract
    Contract -- Update Metadata --> User
\`\`\`
`
      }
    ]
  },
  {
    id: "seguridad",
    title: "Seguridad",
    icon: "Lock",
    sections: [
      {
        id: "seguridad-essencial",
        title: "Lo que Debes Saber",
        content: `# Seguridad: Lo que Debes Saber

Aquí te explicamos de forma clara cómo protegemos tu información y tus activos en Pandora's.

## 🔒 Tu Wallet, Tu Control

**Pandora's nunca tiene acceso a tu wallet.**

- ✅ Conectas tu wallet para firmar transacciones
- ✅ Nunca nos das tus claves privadas o seed phrase
- ✅ Todas las transacciones son firmadas por ti directamente
- ✅ Nosotros solo ejecutamos lo que tú autorices

## 🛡️ Cómo Protegemos Tu Información

### Lo que almacenamos (de forma segura):
- 📧 Tu email (solo si lo proporcionas para notificaciones)
- 📊 Metadatos públicos de tus proyectos
- 🔑 Llaves API (encriptadas con SHA-256, nunca visibles)
- 📝 Logs de operaciones para auditoría

### Lo que NUNCA almacenamos:
- ❌ Claves privadas o seed phrases
- ❌ Fondos o criptomonedas
- ❌ Datos personales sensibles (INE,-passaporte)
- ❌ Información financiera bancaria

## ⚡ Transacciones Seguras

### Firmas Criptográficas
Cada acción importante requiere una firma válida de tu wallet:
- Login con mensaje SIWE (Sign-In with Ethereum)
- Despliegue de protocolos
- Cambios de configuración

### Protección contra Ataques
- ✅ Rate limiting (límite de peticiones)
- ✅ Validación de dominio (previene ataques de phishing)
- ✅ Nonces únicos (previene replay attacks)
- ✅ Timestamps con expiración

## 🌐 Webhooks Seguros

Si usas webhooks para integrar Pandora's con tu app:

\`\`\`typescript
// Siempre verifica la firma HMAC
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return \`sha256=\${hash}\` === signature;
}
\`\`\`

## 🚨 Kill Switches

Tenemos mecanismos de emergencia para proteger la plataforma:
- ✅ Pausar entrega de webhooks si hay incidentes
- ✅ Doble confirmación (escribe "CONFIRM") para acciones críticas
- ✅ Logs inmutables de todas las acciones

## 📱 Mejores Prácticas de Seguridad

### Tu Wallet
1. **Nunca compartas tu seed phrase** con nadie
2. Usa hardware wallet (Ledger, Trezor) para grandes cantidades
3. Confirma siempre la URL antes de firmar
4. Revisa el dominio: debe ser \`pandoras.finance\` o \`dashboard.pandoras.finance\`

### Tu Cuenta
1. Usa API keys únicas para cada integración
2. No compartas keys en código público (GitHub)
3. Rota tus keys periódicamente
4. Usa el panel de operaciones para monitorear

## 🔍 Cómo Verificar que es Seguro

1. **Revisa la URL**: Debe terminar en \`pandoras.finance\`
2. **Conexión HTTPS**: Always usa SSL válido
3. **Firma correcta**: El mensaje SIWE siempre muestra el dominio exacto
4. **Wallet conectado**: Nunca pedimos tus claves

## 📞 ¿Algo Sospechoso?

Si notas algo extraño:
- ❌ Emails pedindo tu seed phrase
- ❌ Sitios que parecen Pandora's pero con dominio diferente
- ❌ Transacciones no autorizadas en tu wallet

**Contáctanos inmediatamente** y reporta el incidente.

---

## Resumen Visual

| Lo que sí hacemos | Lo que NO hacemos |
|-------------------|-------------------|
| ✅ Cifrado de datos | ❌ Custodia de fondos |
| ✅ Autenticación wallet | ❌ Acceso a claves privadas |
| ✅ Logs de auditoría | ❌ Almacenamiento de PII |
| ✅ Kill switches | ❌ Reversión de transacciones |
| ✅ HTTPS obligatorio | ❌ Compartir datos a terceros |

**Tu seguridad es nuestra prioridad.**
`
      },
      {
        id: "recursos-seguridad",
        title: "Recursos y Ayuda",
        content: `# Recursos de Seguridad

Enlaces y herramientas para mantenerte seguro en Pandora's.

## 🔗 Enlaces Oficiales

- 🌐 **Web Principal**: https://pandoras.finance
- 📊 **Dashboard**: https://dashboard.pandoras.finance
- 📚 **Documentación**: https://pandoras.finance/whitepaper
- 📧 **Contacto**: support@pandoras.finance

## ⚠️ NUNCA hagas caso a:

- Mensajes directos de supuestos "soporte"
- Emails pidiendo información de wallet
- Sitios que copian nuestro diseño pero con URLs diferentes
- Personas que ofrecen "ayuda" a cambio de tu seed phrase

## 🛠️ Herramientas de Monitoreo

### Panel de Operaciones (Admin)
\`/admin/operations\`
- Estado de webhooks
- Métricas de errores
- Kill switch controls

### Explora Blockchain
- **Etherscan**: https://etherscan.io
- **Basescan**: https://basescan.org
- **Polygonscan**: https://polygonscan.com

## 📖 Más Información

- [Términos de Servicio](/whitepaper#terms-of-service)
- [Política de Privacidad](/whitepaper#privacy-policy)
- [Disclaimer No-Custodial](/whitepaper#disclaimer)

## 💬 ¿Necesitas Ayuda?

Si tienes dudas de seguridad:
1. Revisa esta documentación
2. Consulta el whitepaper completo
3. Contáctanos por canales oficiales

**Stay safe! 🛡️**
`
      }
    ]
  },
  {
    id: "telegram-integration",
    title: "Telegram Integration",
    icon: "MessageCircle",
    sections: [
      {
        id: "telegram-overview",
        title: "Overview",
        content: `# How Telegram Integrates with Pandoras

## Overview

Pandoras integrates with Telegram through a **non-custodial, event-driven bridge layer** that allows users to interact with protocols, earn reputation and rewards, and request on-chain claims — **without exposing private keys or granting Telegram any protocol governance power**.

Telegram is an **external interaction surface**, not a trusted execution environment. All identity resolution, payment intents, and protocol accounting remain inside Pandoras Core.

> **Key principle:**
> Telegram can *signal intent* and *process local UI*, but Pandoras Core is the absolute source of truth (SSOT).

## Design Goals

The Telegram integration is built around:

### 1. Standalone & Federated Identity
- **Telegram First**: Users can interact, earn points, and make purchases without connecting a Web3 Wallet initially (Shadow Profiles).
- **Progressive Onboarding**: Users can act as *Standalone*, connect a temporary wallet in the MiniApp (*Connected Wallet*), or fully merge with a web Pandoras account via a Challenge Code (*Linked Identity*).
- **Security**: HMAC signatures on \`initData\`, strict 5-minute TTL to prevent replays, S2S Guard checks.

### 2. Embedded Payments (Decoupled)
- **Core-First Architecture**: Purchase intents are created and persisted in the Core as \`pending\` *before* the user sees the payment UI.
- Thirdweb PayEmbed acts solely as the payment processor, completely decoupled from the source of truth.
- Idempotent execution using \`idempotencyKey\` and \`txHash\` deduplication.

### 3. Webhook Hardening
- **HMAC Signatures**: All Core-to-Edge events are cryptographically signed.
- **Transactional State**: Database operations are atomic to prevent ghost states or duplicate unlocks.
- **Analytics-Ready**: Funnel tracking from intent, to payment start, to completion and unlock.
`
      },
      {
        id: "telegram-architecture",
        title: "High-Level Architecture",
        content: `# High-Level Architecture

## System Diagram

\`\`\`
User
 ↓
Telegram MiniApp (React + Thirdweb PayEmbed)
 ↓  REST API (Edge)
Pandoras Edge (Gateway)
 │
 ├─> POST /protocols/:slug/purchase-intent
 │    ↓ S2S (Bearer Token Auth)
Pandoras Core (SSOT)
 ├─ Protocol Registry & Accounting
 ├─ Creates 'Pending' Purchase
 └─ Webhook Emitter (HMAC Signed)
      ↓ POST /core/callback
Pandoras Edge
      ↓
User Feedback & Unhooks
\`\`\`

Pandoras Core acts as the **authoritative execution layer**.

## What Telegram Never Does

- ❌ Holds or manages private keys
- ❌ Executes protocol logic independently
- ❌ Updates protocol balances directly
- ❌ Overrides Core payment states

## Interaction Model

Telegram interacts with Pandoras through bounded, secure API surfaces:

| Endpoint | Purpose |
|---|---|
| \`POST /internal/user/resolve\` | Secure Federated Identity resolution |
| \`POST /internal/payments/intent\` | Create Core-authorized payment sessions |
| \`POST /core/callback\` | Receive HMAC-signed state updates |
| \`POST /api/gamification/record\` | Signal user action |
| \`POST /api/pbox/claim-request\` | Request signed claim intent |

Each endpoint is **strictly scoped**, feature-flagged, and auditable.
`
      },
      {
        id: "telegram-binding",
        title: "Identity Binding",
        content: `# Identity Binding (Telegram ↔ Wallet)

## Purpose

Associate a Telegram user with a blockchain wallet **without custody**.

## Flow

1. User signs a message in their wallet
2. Telegram sends \`{ telegramUserId, walletAddress }\`
3. Pandoras Core upserts binding in \`telegram_bindings\`

## Storage

\`\`\`sql
telegram_bindings (
  telegram_user_id TEXT UNIQUE,
  wallet_address   TEXT,
  source           TEXT DEFAULT 'telegram',
  created_at       TIMESTAMPTZ,
  last_seen_at     TIMESTAMPTZ
)
\`\`\`

The \`source\` field is reserved for future multi-platform support (Discord, Farcaster, WhatsApp).

## Security Properties

- ✅ No private keys stored
- ✅ Binding can be revoked or rotated
- ✅ Endpoint is idempotent (safe to call multiple times)
- ✅ Wallet ownership verified upstream in the Telegram App
`
      },
      {
        id: "telegram-readonly",
        title: "Read-Only Protocol Access",
        content: `# Read-Only Protocol Access

Telegram can query protocol data using:

\`\`\`
GET /api/telegram/protocol/:slug
\`\`\`

## Returned Data

- Protocol metadata (slug, title, status)
- Artifacts in V2 format (type, name, symbol, address, price)
- Registry contract address
- **Capability flags** (see below)

## Capability Flags

The endpoint returns a \`capabilities\` object so the Telegram App **never has to infer business logic**:

\`\`\`json
{
  "capabilities": {
    "canMintFreeArtifact": true,
    "canClaimPBOX": true,
    "supportsGamification": true
  }
}
\`\`\`

These are derived server-side from feature flags, protocol version, and artifact configuration.

## Explicitly Excluded

- ❌ Governance configuration
- ❌ Admin functions
- ❌ Mutable parameters
- ❌ Treasury controls

This ensures Telegram users can **explore and interact**, but never govern.
`
      },
      {
        id: "telegram-gamification",
        title: "Gamification Event Bridge",
        content: `# Gamification Event Bridge

## Core Concept

Telegram never applies rewards directly. Instead, it sends **events**, which Pandoras Core evaluates deterministically.

\`\`\`
Telegram → record(event)
Pandoras → evaluate → execute → emit result
\`\`\`

## Event Recording

**Endpoint:**
\`\`\`
POST /api/gamification/record
\`\`\`

**Payload:**
\`\`\`json
{
  "walletAddress": "0x...",
  "eventType": "telegram.claim",
  "metadata": {
    "protocolSlug": "maniacos",
    "artifactId": "gold-pass"
  }
}
\`\`\`

**Optional Header:**
\`\`\`
X-Telegram-User-Id: <telegramUserId>
\`\`\`

## Gamification Engine (Inside Pandoras Core)

### 1. Policy Gate
- Checks source (\`telegram\`)
- Validates feature flags (\`ALLOW_TELEGRAM_GAMIFICATION\`)
- Confirms wallet ↔ Telegram binding exists
- Rate-limits: max 10 events / 60s per wallet

### 2. Event Evaluation
- \`EventSystem.evaluate()\` — pure function: input → ExecutionPlan
- No side-effects inside evaluation (deterministic, replay-safe)

### 3. Action Execution
- Points awarded
- Achievements unlocked
- PBOX off-chain balance updated
- Idempotency enforced at **(eventId, triggerId, actionType)** level

## Deterministic Execution

Each event produces an **ExecutionPlan**:

\`\`\`typescript
ExecutionPlan {
  eventId: string;
  source: 'telegram' | 'dashboard' | 'system';
  triggered: TriggerExecution[];
}
\`\`\`

This guarantees:
- ✅ Replay safety
- ✅ Auditability
- ✅ Cross-client consistency
`
      },
      {
        id: "telegram-pbox",
        title: "Off-Chain PBOX Accounting",
        content: `# Off-Chain PBOX Accounting

## Why Off-Chain?

PBOX is accumulated frequently via micro-events. On-chain minting is expensive and unnecessary at accumulation time.

Pandoras uses **off-chain accounting with cryptographic claims** — a pattern analogous to banking ledgers.

## Accounting Model

\`\`\`sql
pbox_balances (
  wallet_address TEXT PRIMARY KEY,
  total_earned   INTEGER DEFAULT 0,  -- total PBOX earned from all events
  reserved       INTEGER DEFAULT 0,  -- locked for pending claims
  claimed        INTEGER DEFAULT 0,  -- already minted on-chain
  updated_at     TIMESTAMPTZ
)
\`\`\`

**Available balance** = \`total_earned - reserved - claimed\`

## Conversion Rate

Version 1 (current):
\`\`\`
1 PBOX = 10 Points
\`\`\`

The conversion rate is versioned (\`PBOX_CONVERSION_VERSION = 1\`) so future economy changes only apply to new deltas — historical records remain auditable.

## Properties

- ✅ Full reconcilability at any point in time
- ✅ Separation of earned / pending / settled
- ✅ No on-chain gas until user initiates claim
- ✅ Version-safe for future economy adjustments
`
      },
      {
        id: "telegram-claim",
        title: "PBOX Claim Flow",
        content: `# Claim Flow (Non-Custodial)

## Important Design Decision

> **Pandoras Core never executes on-chain claims.**

Claims are **requested**, signed, and **executed by the client** (Telegram App).

## Claim Request

\`\`\`
POST /api/pbox/claim-request
\`\`\`

### Validations
1. Wallet ↔ Telegram binding exists and matches
2. Sufficient unclaimed PBOX (\`total_earned - reserved - claimed > 0\`)
3. Claims enabled via \`PBOX_CLAIM_ENABLED\` flag

### Claim Payload (Signed by Core)

\`\`\`json
{
  "claimId": "claim_abc123...",
  "walletAddress": "0x...",
  "amount": 42,
  "chainId": 137,
  "nonce": "a1b2c3d4...",
  "expiresAt": 1712345678000,
  "signature": "HMAC-SHA256(wallet:amount:nonce:chainId:expiresAt)"
}
\`\`\`

### Security Guarantees

| Property | Mechanism |
|---|---|
| Time-bounded | 15-minute expiry |
| Nonce-protected | Random 16-byte nonce, single-use |
| Chain-specific | \`chainId\` in signature prevents cross-chain replay |
| HMAC-signed | Core signs with \`PBOX_CLAIM_SIGNING_SECRET\` |

## On-Chain Execution (Telegram App)

1. Submit payload to \`PBOXClaimer\` smart contract
2. Contract verifies Core's signature
3. Tokens minted to wallet
4. Off-chain balance reconciled (reserved → claimed)

## Trust Model

Core **verifies intent, reserves balance, and provides proof**.
Blockchain **settles the final state**.
Telegram App **is the executor, never the authorizer**.
`
      },
      {
        id: "telegram-webhook",
        title: "Webhook Feedback Loop",
        content: `# Webhook Feedback Loop

After every gamification event, Pandoras Core emits a signed webhook to all registered edges.

## Event Type

\`\`\`
gamification.event (v1)
\`\`\`

## Payload

\`\`\`json
{
  "id": "evt_abc123...",
  "type": "gamification.event",
  "version": "v1",
  "timestamp": 1712345678000,
  "data": {
    "user": {
      "walletAddress": "0x...",
      "telegramUserId": "123456"
    },
    "source": "telegram",
    "event": {
      "type": "telegram.claim",
      "metadata": { "protocolSlug": "maniacos" }
    },
    "effects": {
      "pointsEarned": 50,
      "pboxDelta": 5,
      "achievementsUnlocked": ["first_claim"],
      "rewardsGranted": [],
      "effectsHash": "sha256(effects)"
    },
    "balances": {
      "totalPoints": 350,
      "pboxBalance": 35,
      "level": 3
    },
    "isSandbox": false
  }
}
\`\`\`

## Delivery Model

| Property | Value |
|---|---|
| Signing | HMAC-SHA256 (\`X-Pandoras-Signature\`) |
| Timestamp | \`X-Pandoras-Timestamp\` (replay protection) |
| Delivery | At-least-once, async |
| Failure mode | **Non-blocking for Core** (fire-and-forget) |
| Retries | Managed by WebhookService + DLQ |

The \`effectsHash\` field is a sha256 of the effects object — enabling downstream consumers to detect duplicates and perform forensic auditing without re-processing full payload.
`
      },
      {
        id: "telegram-flags",
        title: "Feature Flags & Safety Controls",
        content: `# Feature Flags & Safety Controls

All Telegram integration points are guarded by explicit environment flags, manageable via the **Telegram Bridge Control Panel**.

## Emergency Kill Switches & Modes

### 🔴 Paranoia Mode
Maximum security posture. Activated during suspected bot attacks or sudden volume spikes.
- **Effects**: Drastically tightens rate limits, forces Economy to read-only, enables forensic logging mode.
- **Impact**: Some UX degradation, but absolute protection against state corruption. Requires explicit \`CONFIRM\` to toggle.

### 🔴 Telegram Gamification Master Switch
- **Effects**: Setting \`ALLOW_TELEGRAM_GAMIFICATION=false\` instantly blocks ALL \`/record\` endpoints (returns 403). Events won't be processed.
- **Usage**: Hard stop if an exploit is found in event emission. Payments bridge keeps working.

### 🔴 PBOX Claims Switch
- **Effects**: Setting \`PBOX_CLAIM_ENABLED=false\` stops issuing claim signatures.
- **Usage**: Used during blockchain network congestion (e.g. Polygon RPC down) to prevent users from burning gas on failed claims, or when rotating the signing secret.

## Environment Variables Reference

\`\`\`env
# Master gate for all Telegram gamification
ALLOW_TELEGRAM_GAMIFICATION=true

# Protocol read-only access
TELEGRAM_ENABLE_PROTOCOL_READONLY=true

# Enable PBOX claim flow
PBOX_CLAIM_ENABLED=true

# Free artifact minting via Telegram
TELEGRAM_ENABLE_MINT_FREE_ARTIFACT=true

# HMAC secret for signing claim payloads
PBOX_CLAIM_SIGNING_SECRET=<generate-strong-secret>

# Default claim chain (137 = Polygon)
PBOX_DEFAULT_CHAIN_ID=137
\`\`\`

## What Each Flag Controls

| Flag | Effect when \`false\` |
|---|---|
| \`ALLOW_TELEGRAM_GAMIFICATION\` | All record calls return 403 |
| \`PBOX_CLAIM_ENABLED\` | Claim requests return 403 |
| \`ALLOW_TELEGRAM_MUTATIONS\` | Already \`false\` — prevents any write ops |

## Instant Shutdown

Setting \`ALLOW_TELEGRAM_GAMIFICATION=false\` instantly disables the entire bridge without any code deployment. Useful for:
- Incident response
- Maintenance windows
- Environment-specific rollouts

## Rate Limits (Soft, In-Memory)

\`/api/gamification/record\` enforces:
- Max **10 events / 60 seconds** per wallet
- Returns \`429 Too Many Requests\` if exceeded
- Upgrade to Redis-backed counter when traffic scales
`
      },
      {
        id: "telegram-trust-model",
        title: "Trust Model Summary",
        content: `# Trust Model Summary

## Component Trust Levels

| Component | Trust Level | Rationale |
|---|---|---|
| Pandoras Core | ✅ Trusted | Authoritative execution layer |
| Blockchain | ✅ Trusted | Immutable settlement layer |
| Telegram App | ⚠️ Untrusted client | External surface, sandboxed |
| Telegram Edge | ⚠️ Untrusted transport | Webhook recipient, HMAC-verified |

Pandoras is designed so that **even a fully compromised Telegram App cannot steal funds or mutate protocol state**.

## What Telegram Can Do

✅ Register wallet binding  
✅ Read protocol data (filtered)  
✅ Signal gamification events  
✅ Request signed claim proofs  
✅ Display PBOX balances  

## What Telegram Cannot Do

❌ Create or modify protocols  
❌ Change artifact configuration  
❌ Execute on-chain governance  
❌ Emit arbitrary point values  
❌ Sign transactions on behalf of Core  
❌ Access admin or treasury functions  

## Why This Matters

This architecture enables:

- **Mass-market UX** via Telegram without security compromises
- **Protocol-grade security guarantees** even with untrusted clients
- **Clean separation** of off-chain interaction and on-chain settlement
- **Future expansion** to Discord, WhatsApp, Farcaster without rewriting core logic

Telegram is not a shortcut — it is a **first-class, sandboxed interface** to the Pandoras protocol.
`
      }
    ]
  },
  {
    id: "security-architecture",
    title: "Security Architecture",
    icon: "Shield",
    sections: [
      {
        id: "threat-model",
        title: "Security & Threat Model",
        content: `# Security & Threat Model

## Overview

This section documents the formal threat model for Pandoras Core, covering trust boundaries, attack surfaces, and mitigations.

## Trust Boundaries

\`\`\`
[Blockchain]  ←→  [Pandoras Core]  ←→  [External Clients]
  Trusted              Trusted          Untrusted by default
\`\`\`

All external clients (Telegram App, Dashboard users, webhook consumers) are treated as **untrusted** until authenticated.

## Threat Vectors & Mitigations

### T1 — Webhook Spoofing

**Threat:** Attacker sends fake webhook events to a consumer endpoint pretending to be Pandoras Core.

**Mitigation:**
- All webhooks are signed with \`HMAC-SHA256\`
- Consumers verify \`X-Pandoras-Signature\` using \`timingSafeEqual\`
- Timestamp (\`X-Pandoras-Timestamp\`) checked — reject if older than 5 minutes
- Prevents replay attacks

\`\`\`typescript
// Correct verification pattern
const isValid = crypto.timingSafeEqual(
  Buffer.from(receivedSig),
  Buffer.from(expectedSig)
);
\`\`\`

### T2 — Replay Attacks

**Threat:** Attacker re-submits a captured valid request (webhook or claim payload) after it was already processed.

**Mitigation:**
- Webhooks: timestamp validation (5-minute window)
- Claim payloads: 15-minute expiry + single-use nonce
- Gamification events: action-level idempotency table (\`gamification_action_executions\`)
- Primary key: \`(event_id, trigger_id, action_type)\` — prevents double-execution

### T3 — Cross-Chain Claim Replay

**Threat:** A valid PBOX claim signature generated for Polygon is submitted on Ethereum or Base to double-mint tokens.

**Mitigation:**
- \`chainId\` is included in the HMAC-signed payload
- Signature: \`HMAC(wallet:amount:nonce:chainId:expiresAt)\`
- Contract verifies \`chainId\` matches the executing chain

### T4 — Telegram Identity Spoofing

**Threat:** Attacker sends requests claiming to be a specific Telegram user ID to gain another wallet's gamification points.

**Mitigation:**
- \`POST /api/gamification/record\` verifies binding: \`telegramUserId\` must match the \`walletAddress\` in \`telegram_bindings\`
- Mismatch returns \`403 Forbidden\`
- Telegram IDs are weak identifiers — they are **not** used for authorization of monetary actions

### T5 — Gamification Event Flooding

**Threat:** Buggy or malicious bot sends thousands of events per second, flooding the DB and distorting balances.

**Mitigation:**
- In-memory rate limiter: **10 events / 60 seconds** per wallet per source
- Returns \`429 Too Many Requests\` if exceeded
- Upgradeable to Redis-backed counter for distributed instances
- \`ALLOW_TELEGRAM_GAMIFICATION\` master kill switch

### T6 — Unauthorized Protocol Mutation via Telegram

**Threat:** Attacker uses Telegram App to modify protocol configuration, artifacts, or governance settings.

**Mitigation:**
- \`ALLOW_TELEGRAM_MUTATIONS=false\` (hardcoded default)
- Source-based policy in \`GamificationService.assertSourceAllowed()\`
- Telegram source is blocked from: \`protocol_deployed\`, \`sale_certified\`, \`admin_action\` event types
- Protocol endpoints return read-only filtered data — no write paths exposed

### T7 — Private Key Exposure

**Threat:** PBOX claim signing secret or webhook secret is leaked, allowing attackers to forge valid signatures.

**Mitigation:**
- Secrets stored only as environment variables, never in DB or logs
- Separate secrets: \`PBOX_CLAIM_SIGNING_SECRET\` ≠ \`TELEGRAM_WEBHOOK_SECRET\`
- Claims expire in 15 minutes — leaked signatures have limited utility
- Rotate secrets immediately if compromise suspected

### T8 — PBOX Double-Claim

**Threat:** User submits the same claim proof twice before the on-chain transaction is confirmed.

**Mitigation:**
- Core **reserves** PBOX atomically when claim request is issued: \`reserved += amount\`
- Available balance check: \`total_earned - reserved - claimed > 0\`
- If claim fails on-chain, reservation can be released manually (future: automatic release on chain event)

## Security Properties Checklist

| Property | Status |
|---|---|
| No private keys in Telegram | ✅ |
| HMAC-signed webhooks | ✅ |
| Timestamp + replay prevention | ✅ |
| \`timingSafeEqual\` for signature comparison | ✅ |
| Action-level idempotency | ✅ |
| Cross-chain replay prevention (\`chainId\`) | ✅ |
| Rate limiting on sensitive endpoints | ✅ |
| Feature flag master kill switches | ✅ |
| Source-based policy gate | ✅ |
| Non-custodial claim flow | ✅ |

## Audit Surface

All security-critical paths are concentrated in:

- \`core/gamification-service.ts\` — policy gate
- \`lib/webhooks/emit.ts\` — HMAC signing
- \`api/pbox/claim-request/route.ts\` — claim signing
- \`api/gamification/record/route.ts\` — rate limit + binding verification
- \`types/bridge.ts\` — canonical type contracts
`
      }
    ]
  }
];
