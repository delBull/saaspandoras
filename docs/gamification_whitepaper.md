# Pandoras Gamification Engine: Internal Whitepaper & Ops Guide

## 1. Executive Summary
The Pandoras Gamification Engine is the core engagement and loyalty layer of the ecosystem. It transforms user activity within the Telegram Mini App (TMA) and the Core Dashboard into on-chain reputation (XP) and future financial value (Harvest Credits).

## 2. Core Architecture
The system follows a "Control Plane / Data Plane" architecture:
- **Data Plane (Telegram App)**: The "untrusted" edge where users interact. It signals intent via cryptographically signed events.
- **Control Plane (Edge API)**: The central authority that evaluates rules, manages risk, and maintains state (Prisma/DB).
- **Settlement Layer (SaaS Core / Blockchain)**: Where credits are eventually minted to ePBOX/PBOX.

## 3. Incentive Tokens
- **Reputation (XP)**: Non-transferable point system representing user loyalty and level. Used for leaderboard ranking.
- **Harvest Credits**: Pre-token points that accumulate in the "Harvest Vault".
  - **Locked**: Earned via daily actions, pending audit or unlock criteria.
  - **Claimable**: Unlocked and ready for conversion to ePBOX.

## 4. Key Systems & Features
### A. Dynamic Leaderboard
Ranks users by `totalXP`. Calculated in real-time on the backend to avoid client-side manipulation.
### B. Daily Streak System
Tracks consecutive days of activity.
- **Consecutive**: +1 day if active between 24h and 48h after last tick.
- **Reset**: Resets to 1 if >48h gap.
- **Benefit**: Multiplier effects and milestone achievements (e.g., "Siempre Presente" at 7 days).
### C. Deterministic Event Ledger
Every action generates a unique `eventId` (Hash of userId + timestamp + action). Prevents double-spending of activity.

## 5. Operational Safety (Admin Panel)
Located at `/admin/dashboard` under the **Telegram Bridge** tab.

### A. Emergency Toggles (Kill-Switches)
- **Telegram Gamification**: Master switch to pause all point earning.
- **PBOX Claiming**: Pause conversion of credits to on-chain tokens.
- **Paranoia Mode**: Drastically increases risk scoring sensitivity.

### B. Incident Response Playbook
1. **Detection**: Monitor "Golden Signals" (Webhook fail rate > 5%, unusual spike in claims).
2. **Containment**: Disable **PBOX Claiming** flag immediately.
3. **Forensics**: Check `ActionLog` for repeated event IDs or bot patterns.
4. **Resolution**: Adjust `EconomyParams.pointsPerPbox` or blacklist `telegramId`.

## 6. Pre-Launch Checklist (Sepolia Public)
- [ ] **Audit Rules**: Verify all 14 seeded rules have correct XP/Credit ratios.
- [ ] **Load Testing**: Ensure Edge API can handle >100 events/second.
- [ ] **Faucet Liquidity**: Verify Relayer has sufficient Sepolia ETH to cover user activity.
- [ ] **Identity Sync**: Trigger a manual sync for all users migrated from the Beta phase.
