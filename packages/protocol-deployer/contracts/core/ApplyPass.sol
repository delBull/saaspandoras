// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Manual implementation of Ownable and Context logic to avoid Immutable/Constructor circular dependency issues in OZ v4/v5 mix
contract ApplyPass is ERC721 {
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    bool public paused;
    
    // Ownable State
    address private _owner;
    
    // ERC2771 State
    address private _trustedForwarder;

    // Config
    bool public publicMintOpen = false;

    mapping(address => bool) public hasMinted;

    event BaseURIUpdated(string newBaseURI);
    event PausedUpdated(bool isPaused);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(_owner == _msgSender(), "ApplyPass: caller is not the owner");
        _;
    }

    constructor(
        string memory name, 
        string memory symbol, 
        address initialOwner, 
        address trustedForwarder
    ) 
        ERC721(name, symbol) 
    {
        _nextTokenId = 1;
        _trustedForwarder = trustedForwarder;
        _transferOwnership(initialOwner != address(0) ? initialOwner : msg.sender);
    }

    // --- Ownable Logic ---

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "ApplyPass: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    // --- Business Logic ---

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedUpdated(_paused);
    }

    function setPublicMintOpen(bool _open) external onlyOwner {
        publicMintOpen = _open;
    }
    
    // Enable ability to change forwarder if needed
    function setTrustedForwarder(address forwarder) external onlyOwner {
        _trustedForwarder = forwarder;
    }

    function getTrustedForwarder() external view returns (address) {
        return _trustedForwarder;
    }

    /**
     * @notice Free mint function (User self-service).
     * @dev One per wallet. Only if publicMintOpen is true.
     */
    function freeMint() external {
        require(!paused, "ApplyPass: Minting is paused");
        require(publicMintOpen, "ApplyPass: Public mint is closed");
        address sender = _msgSender();
        require(!hasMinted[sender], "ApplyPass: One pass per wallet");
        
        uint256 tokenId = _nextTokenId++;
        hasMinted[sender] = true;
        _safeMint(sender, tokenId);
    }

    /**
     * @notice Admin airdrop function.
     * @param to Address to receive the pass.
     */
    function adminMint(address to) external onlyOwner {
        require(to != address(0), "ApplyPass: Invalid address");
        // We allow admin to mint multiple times to same user if needed, or we can restrict it.
        // Assuming strict one-pass policy for now to stay consistent?
        // Let's NOT restrict admin. Admin knows best.
        
        uint256 tokenId = _nextTokenId++;
        hasMinted[to] = true; // Mark as having a pass so they can't freeClaim later if opened
        _safeMint(to, tokenId);
    }
    
    /**
     * @notice Helper to check if a user is a holder.
     */
    function isGateHolder(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }

    /**
     * @notice Returns total minted tokens.
     */
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // --- ERC2771Context Logic ---

    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return forwarder == _trustedForwarder;
    }

    function _msgSender() internal view virtual override returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `msg.data`
            /// @solidity memory-safe-assembly
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return msg.sender;
        }
    }

    function _msgData() internal view virtual override returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
