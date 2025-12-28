// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

// Using Thirdweb's ERC20Base which matches standards and includes Metadata/Permissions.

contract PBOXToken is ERC20Base {

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol
    )
        ERC20Base(_defaultAdmin, _name, _symbol)
    {
        // Tokenomics: Initial Mint to Admin (Treasury)
        // 1 Billion Tokens (18 decimals)
        _mint(_defaultAdmin, 1_000_000_000 * 10**18);
    }
}
