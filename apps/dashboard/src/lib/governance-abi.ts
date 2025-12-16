export const governanceABI = [
    // ... existing vault functions ...
    {
        "inputs": [],
        "name": "getVaultStats",
        "outputs": [
            { "internalType": "uint256", "name": "ethInVault", "type": "uint256" },
            { "internalType": "uint256", "name": "usdcInVault", "type": "uint256" },
            { "internalType": "uint256", "name": "totalDepositedETH_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalDepositedUSDC_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWithdrawnETH_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalWithdrawnUSDC_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalUtilityETH_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalUtilityUSDC_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalReinvestedETH_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalReinvestedUSDC_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalInvestedETH_", "type": "uint256" },
            { "internalType": "uint256", "name": "totalInvestedUSDC_", "type": "uint256" },
            { "internalType": "uint256", "name": "numDepositors", "type": "uint256" },
            { "internalType": "uint256", "name": "numWithdrawnUsers", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getUserStats",
        "outputs": [
            { "internalType": "uint256", "name": "depositedETH", "type": "uint256" },
            { "internalType": "uint256", "name": "depositedUSDC", "type": "uint256" },
            { "internalType": "uint256", "name": "withdrawnETH", "type": "uint256" },
            { "internalType": "uint256", "name": "withdrawnUSDC", "type": "uint256" },
            { "internalType": "uint256", "name": "claimableUtilityETH", "type": "uint256" },
            { "internalType": "uint256", "name": "claimableUtilityUSDC", "type": "uint256" },
            { "internalType": "uint256", "name": "reinvestedETH", "type": "uint256" },
            { "internalType": "uint256", "name": "reinvestedUSDC", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "type": "function",
        "name": "getUserDeposits",
        "inputs": [{ "name": "user", "type": "address", "internalType": "address" }],
        "outputs": [
            {
                "name": "",
                "type": "tuple[]",
                "internalType": "struct PoolPandorasSepolia.DepositInfo[]",
                "components": [
                    { "name": "amount", "type": "uint96", "internalType": "uint96" },
                    { "name": "yieldReceived", "type": "uint96", "internalType": "uint96" },
                    { "name": "timestamp", "type": "uint48", "internalType": "uint48" },
                    { "name": "withdrawnAt", "type": "uint48", "internalType": "uint48" },
                    { "name": "token", "type": "uint8", "internalType": "enum PoolPandorasSepolia.TokenType" },
                    { "name": "flags", "type": "uint8", "internalType": "uint8" }
                ]
            }
        ],
        "stateMutability": "view"
    },
    // --- GOVERNANCE ---
    {
        "inputs": [
            { "internalType": "string", "name": "title", "type": "string" },
            { "internalType": "string", "name": "description", "type": "string" },
            { "internalType": "uint256", "name": "daysOpen", "type": "uint256" }
        ],
        "name": "createProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "proposalId", "type": "uint256" },
            { "internalType": "bool", "name": "support", "type": "bool" }
        ],
        "name": "vote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
        "name": "closeProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
        "name": "getVotingPower",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllProposals",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint256", "name": "id", "type": "uint256" },
                    { "internalType": "address", "name": "proposer", "type": "address" },
                    { "internalType": "string", "name": "title", "type": "string" },
                    { "internalType": "string", "name": "description", "type": "string" },
                    { "internalType": "uint256", "name": "startTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "endTime", "type": "uint256" },
                    { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
                    { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
                    { "internalType": "bool", "name": "active", "type": "bool" },
                    { "internalType": "bool", "name": "executed", "type": "bool" }
                ],
                "internalType": "struct PoolPandorasSepolia.Proposal[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "proposer", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256" }
        ],
        "name": "ProposalCreated",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "depositETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
        "name": "depositUSDC",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "bytes32", "name": "role", "type": "bytes32" },
            { "internalType": "address", "name": "account", "type": "address" }
        ],
        "name": "hasRole",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;
