// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/src/Script.sol";
import "../treasury/AllowanceController.sol";

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
