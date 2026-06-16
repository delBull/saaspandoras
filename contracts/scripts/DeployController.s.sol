// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/src/Script.sol";
import "../treasury/AllowanceController.sol";

// Usar para Sepolia (staging) — no tocar
contract DeployControllerScript is Script {
    function run() external {
        address _owner = 0x5aeaE3D13F480a4231dD09D873f5A094424A2ed6;
        address _delegate = 0xDB798e90256C2FDD341ef525C9AFc48d9c7B90Fd;
        address _token = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
        uint256 _dailyLimit = 1000e6;

        vm.startBroadcast();
        new AllowanceController(_owner, _delegate, _token, _dailyLimit);
        vm.stopBroadcast();
    }
}

// Usar para Base Mainnet (producción)
contract DeployControllerMainnetScript is Script {
    function run() external {
        address _owner = 0xc52BB6f53C91ff7134e7508B102E5A22BA415954;        // Admin wallet
        address _delegate = 0xaBA8a0d027FbaFa7316fBc08C5f4F2a78Be4f0E9;    // Oracle 2 (nueva, segura)
        address _token = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;         // USDC Base
        uint256 _dailyLimit = 1000e6;

        vm.startBroadcast();
        new AllowanceController(_owner, _delegate, _token, _dailyLimit);
        vm.stopBroadcast();
    }
}
