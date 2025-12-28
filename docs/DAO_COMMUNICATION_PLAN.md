
# DAO Communication Strategy: Chat & Forums

To foster a vibrant and decentralized community, Independent DAOs on the platform require robust communication tools. This document outlines the strategy for integrating Chat and Forum capabilities.

## 1. Objectives
- **Decentralization**: Minimize reliance on centralized servers where possible, or offer "Exit to Community" paths.
- **Token-Gating**: Ensure only valid members (Access Card holders) can access private channels.
- **Integration**: Seamless embedding within the dashboard.

## 2. Recommended Solutions

### A. Real-Time Chat (Discord/Telegram vs. Matrix)
**Recommendation: Internal Light Chat + External Community (Discord)**
For the MVP, custom-building a full chat app is resource-intensive. 
- **Short Term**: Integrate a simple internal "Shoutbox" or "Daily Discuss" in the dashboard for verified members (`dao_chat_messages` table).
- **Long Term**: Matrix (Element) integration for fully decentralized, encrypted chat.

### B. Forums & Proposals (Discourse vs. On-Chain)
**Recommendation: Discourse (Hosted) or Snapshot Integration**
For detailed governance discussions:
- **Snapshot**: Already industry standard for off-chain signalling. We should deepen our integration to show Snapshot comments if possible.
- **Discourse**: Can be hosted per-DAO, but requires infra.
- **Internal Solution**: A simple `dao_forum_posts` schema linked to our existing `dao_activities` can serve as a lightweight replacement for small DAOs.

## 3. Implementation Plan (Phase 2)

### 3.1 Internal "Town Square" (Lightweight Forum)
Create a dedicated "Discusión" tab in the DAO Dashboard.
- **Schema**: `dao_threads`, `dao_posts`.
- **Features**: 
    - Token-gated read/write.
    - Markdown support.
    - Upvote/Downvote (Reputation).
    - Pinning by Admins.

### 3.2 External Integrations
- **Discord Bot**: A bot that verifies wallet holdings and assigns roles in the DAO's Discord server.
- **Telegram Bot**: Invite links generated for Access Card holders.

## 4. Next Steps
1. **Database**: Design schema for `dao_threads` and `dao_posts`.
2. **UI**: Build a "Discussion" component similar to "Activities".
3. **Bot**: Develop the verification bot service.
