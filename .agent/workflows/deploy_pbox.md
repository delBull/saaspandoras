---
description: Deploy PBOX Governance Token
---

# Deploy PBOX Governance Token

The logic for redemption is ready, but the actual Token Contract must be live on blockchain (Base Mainnet).

## Prerequisites
- Wallet with Funds (ETH on Base).
- Thirdweb Account (optional but recommended).

## Steps

1.  **Run Deploy Command**:
    The standard "Token" contract from Thirdweb includes `ERC20Votes` capability (Check functionality enabled in settings).
    ```bash
    npx thirdweb deploy --contract TokenERC20
    ```

2.  **Configuration**:
    - **Name**: Pandoras Box
    - **Symbol**: PBOX
    - **Description**: Governance Token for Pandoras DAO.
    - **Primary Sale Recipient**: Your Admin Wallet.
    - **Platform Choice**: Select `Base` (for Prod) or `Sepolia` (for Test).

3.  **Post-Deploy Setup**:
    - Manage the contract in Thirdweb Dashboard.
    - Go to **Permissions**.
    - Ensure your Admin Wallet (used in `.env`) has `MINTER_ROLE` or `admin` rights to generate signatures.

4.  **Update Environment**:
    Copy the deployed `Contract Address` and update your `.env`:
    ```env
    NEXT_PUBLIC_PBOX_TOKEN_ADDRESS=0x...
    ```

5.  **Restart Server**:
    ```bash
    npm run dev
    ```

## Verification
- Go to Dashboard.
- Try "Canjear" -> "$PBOX".
- It should now correctly mint tokens to your wallet.
