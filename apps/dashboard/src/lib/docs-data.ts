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
        title: "DAO Governance",
        content: `# DAO Governance

Enable decentralized decision-making for your protocol.

## What is a DAO?

A **Decentralized Autonomous Organization** allows license holders to:
- 🗳️ Vote on proposals
- 💡 Submit ideas
- 💰 Allocate treasury funds
- 📊 Set protocol parameters

## Governance Models

Pandora's supports multiple governance patterns:

### Token-Weighted Voting
- 1 NFT = 1 vote
- Simple majority or supermajority thresholds

### Quadratic Voting
- Prevents whale dominance
- Encourages broad participation

### Delegation
- Token holders can delegate voting power
- Representatives vote on behalf of delegators

## Proposal Types

**Parameter Changes**
- Update protocol settings
- Adjust fee structures

**Treasury Allocation**
- Fund development
- Marketing budgets
- Community rewards

**Partnership Approvals**
- Integrate with other protocols
- Strategic collaborations

**Emergency Actions**
- Pause/unpause features
- Trigger kill switches

## Voting Process

1. **Proposal Submission** (requires minimum license count)
2. **Discussion Period** (e.g., 3 days)
3. **Voting Period** (e.g., 7 days)
4. **Execution** (if passed, automated or manual)

## Security

- ✅ Time-locks on treasury withdrawals
- ✅ Multi-sig execution for high-value actions
- ✅ Veto power for emergency situations (optional)
- ✅ Transparent on-chain voting records

## Integration

Access DAO features via:
- **Dashboard**: \`/projects/{slug}/dao\`
- **Smart Contracts**: Direct governance calls
- **Webhooks**: \`governance.proposal_created\`, \`governance.vote_cast\`
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

### System Health
- API uptime and availability
- Error rates (rolling averages)
- Response times (P50, P95, P99)

### Webhook Performance
- Delivery success rate
- Retry statistics
- Dead Letter Queue size

### Protocol Statistics
- Total protocols deployed
- Active vs inactive protocols
- Total value locked (TVL)
- License NFTs minted

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

## Incident Reports

Any security incidents or outages will be disclosed:
- **Incident Summary**: What happened
- **Impact**: Who was affected
- **Root Cause**: Technical details
- **Resolution**: How it was fixed
- **Prevention**: Steps to avoid recurrence

## Roadmap Transparency

Track upcoming features and improvements:
- **Q1 2026**: Multi-sig treasury support
- **Q2 2026**: External security audit
- **Q3 2026**: Layer 2 network expansion
- **Q4 2026**: DAO governance v2

## Community Governance

Future platform decisions may be governed by:
- Protocol creators (weighted by activity)
- Token holders (if governance token launched)
- Community voting (for non-critical features)

## Financial Transparency

Pandora's revenue model:
- **Platform Fees**: % of protocol sales (configurable)
- **Premium Features**: Advanced integrations (upcoming)
- **No hidden fees**: All costs disclosed upfront

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
  }
];
