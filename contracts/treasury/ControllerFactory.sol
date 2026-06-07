// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AllowanceController.sol";

/// @title ControllerFactory — Deploys per-project AllowanceControllers
/// @author Pandora's Finance
/// @notice One-stop deploy: creates AllowanceController with specific params
///         Admin wallet deploys via Multicall3 so the project owner doesn't pay gas.
contract ControllerFactory {
    event ControllerDeployed(
        address indexed controller,
        address indexed owner,
        address delegate,
        address token,
        uint256 dailyLimit
    );

    /// @notice Deploy a new AllowanceController for a project
    function deployController(
        address _owner,
        address _delegate,
        address _token,
        uint256 _dailyLimit
    ) external returns (address) {
        AllowanceController controller = new AllowanceController(_owner, _delegate, _token, _dailyLimit);
        emit ControllerDeployed(
            address(controller),
            _owner,
            _delegate,
            _token,
            _dailyLimit
        );
        return address(controller);
    }
}
