// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title PandorasKey
 * @dev An access gate NFT (SBT-like) with gasless minting and NFT-as-wallet features.
 */
contract PandorasKey is ERC721, Ownable, AccessControl, ERC2771Context, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public maxPerWallet;
    uint256 private _nextTokenId;

    mapping(address => address) public payoutAddressOfHolder;
    mapping(address => uint256) public ethDepositsOfHolder;
    mapping(address => mapping(address => uint256)) public erc20DepositsOfHolder;

    event DepositToHolder(address indexed holder, address indexed from, uint256 amount);
    event DepositERC20ToHolder(address indexed holder, address indexed from, address indexed token, uint256 amount);
    event WithdrawETH(address indexed holder, address indexed to, uint256 amount);
    event WithdrawERC20(address indexed holder, address indexed to, address indexed token, uint256 amount);
    event PayoutAddressSet(address indexed holder, address indexed payoutAddress);

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner,
        address trustedForwarder
    ) ERC721(name, symbol) ERC2771Context(trustedForwarder) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(ADMIN_ROLE, initialOwner);
        _grantRole(MINTER_ROLE, initialOwner);
        maxPerWallet = 1;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view virtual override(ERC2771Context, Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        if (_ownerOf(tokenId) != address(0) && to != address(0)) {
            revert("PandorasKey: This NFT is non-transferable.");
        }
        return super._update(to, tokenId, auth);
    }

    function freeMint() external nonReentrant {
        address recipient = _msgSender();
        require(balanceOf(recipient) < maxPerWallet, "PandorasKey: Max per wallet reached.");
        _safeMint(recipient, _nextTokenId);
        _nextTokenId++;
    }

    function adminMint(address to) external nonReentrant onlyRole(ADMIN_ROLE) {
        require(balanceOf(to) < maxPerWallet, "PandorasKey: Max per wallet reached for recipient.");
        _safeMint(to, _nextTokenId);
        _nextTokenId++;
    }

    function isGateHolder(address _user) external view returns (bool) {
        return balanceOf(_user) > 0;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(tokenId < _nextTokenId, "ERC721Metadata: URI query for nonexistent token");

        string memory name = "Pandora\'s Key";
        string memory description = "Your key to the Pandora\'s ecosystem. Unlocks exclusive access and opportunities.";
        string memory image = "https://pandoras.finance/images/coin.png";

        string memory json = Base64.encode(
            bytes(
                string.concat(
                    '{"name":"', name, '", ',
                    '"description":"', description, '", ',
                    '"image":"', image, '"}'
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function depositToHolder(address holder) external payable nonReentrant {
        require(balanceOf(holder) > 0, "PandorasKey: Recipient is not a key holder.");
        ethDepositsOfHolder[holder] += msg.value;
        emit DepositToHolder(holder, _msgSender(), msg.value);
    }

    function depositERC20ToHolder(address holder, address token, uint256 amount) external nonReentrant {
        require(balanceOf(holder) > 0, "PandorasKey: Recipient is not a key holder.");
        require(amount > 0, "PandorasKey: Amount must be greater than 0.");
        
        IERC20 erc20 = IERC20(token);
        uint256 allowance = erc20.allowance(_msgSender(), address(this));
        require(allowance >= amount, "PandorasKey: Check token allowance.");
        
        erc20.transferFrom(_msgSender(), address(this), amount);
        erc20DepositsOfHolder[holder][token] += amount;
        
        emit DepositERC20ToHolder(holder, _msgSender(), token, amount);
    }

    function withdrawHolderETH() external nonReentrant {
        address holder = _msgSender();
        uint256 amount = ethDepositsOfHolder[holder];
        require(amount > 0, "PandorasKey: No ETH balance to withdraw.");

        ethDepositsOfHolder[holder] = 0;

        address recipient = payoutAddressOfHolder[holder] != address(0) ? payoutAddressOfHolder[holder] : holder;
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "PandorasKey: ETH transfer failed.");

        emit WithdrawETH(holder, recipient, amount);
    }

    function withdrawHolderERC20(address token) external nonReentrant {
        address holder = _msgSender();
        uint256 amount = erc20DepositsOfHolder[holder][token];
        require(amount > 0, "PandorasKey: No token balance to withdraw.");

        erc20DepositsOfHolder[holder][token] = 0;

        address recipient = payoutAddressOfHolder[holder] != address(0) ? payoutAddressOfHolder[holder] : holder;
        IERC20(token).transfer(recipient, amount);

        emit WithdrawERC20(holder, recipient, token, amount);
    }

    function setPayoutAddress(address _payoutAddress) external {
        address holder = _msgSender();
        require(balanceOf(holder) > 0, "PandorasKey: Only holders can set a payout address.");
        payoutAddressOfHolder[holder] = _payoutAddress;
        emit PayoutAddressSet(holder, _payoutAddress);
    }

    function rescueETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "PandorasKey: Cannot send to zero address.");
        require(address(this).balance >= amount, "PandorasKey: Insufficient contract balance.");
        (bool success, ) = to.call{value: amount}("");
        require(success, "PandorasKey: ETH transfer failed.");
    }

    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "PandorasKey: Cannot send to zero address.");
        IERC20 erc20 = IERC20(token);
        require(erc20.balanceOf(address(this)) >= amount, "PandorasKey: Insufficient contract token balance.");
        erc20.transfer(to, amount);
    }
    
    function setMaxPerWallet(uint256 _maxPerWallet) external onlyRole(ADMIN_ROLE) {
        maxPerWallet = _maxPerWallet;
    }

    function burn(address owner, uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) == owner, "PandorasKey: Not the owner of the token.");
        _burn(tokenId);
    }
}
