// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZIGZOO
 * @notice ERC-721 eksperimental, 1.111 supply, AGENT ONLY MINT di BNB Smart Chain.
 *
 * Otorisasi agent TIDAK ditebak dari alamat wallet dan TIDAK otomatis
 * mengenali "Binance Agentic Wallet" dari alamat saja. Sebuah alamat hanya
 * bisa mint setelah owner secara eksplisit mengotorisasinya lewat
 * setAgentAuthorization / setAgentAuthorizations. Alamat yang belum
 * diotorisasi akan revert dengan NotAuthorizedAgent.
 *
 * Keamanan:
 * - MAX_SUPPLY ditegakkan di setiap mint.
 * - Pembayaran divalidasi; kelebihan bayar dikembalikan (refund) sebelum
 *   interaksi eksternal berikutnya, di dalam nonReentrant.
 * - Tidak ada batas mint per wallet (sesuai spesifikasi).
 * - Dana hanya bisa ditarik owner lewat withdraw() dengan ReentrancyGuard.
 * - baseURI hanya bisa diubah owner.
 */
contract Zigzoo is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 1111;
    uint256 public constant MINT_PRICE = 0.0005 ether;

    uint256 private _nextTokenId = 1;
    uint256 private _totalMinted;

    string private _baseTokenURI;

    mapping(address => bool) public authorizedAgents;

    event AgentAuthorizationUpdated(address indexed agent, bool authorized);
    event Minted(address indexed minter, uint256 quantity, uint256 firstTokenId);
    event BaseURIUpdated(string baseURI);
    event Withdrawn(address indexed owner, uint256 amount);

    error NotAuthorizedAgent(address caller);
    error InvalidQuantity();
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error InsufficientPayment(uint256 sent, uint256 required);
    error WithdrawFailed();

    constructor(string memory baseURI_) ERC721("ZIGZOO", "ZIGZOO") Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    // ---------- Views ----------

    function totalSupply() public view returns (uint256) {
        return _totalMinted;
    }

    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _totalMinted;
    }

    function isAuthorizedAgent(address account) public view returns (bool) {
        return authorizedAgents[account];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        address tokenOwner = _ownerOf(tokenId);
        if (tokenOwner == address(0)) revert ERC721NonexistentToken(tokenId);
        string memory base = _baseURI();
        if (bytes(base).length == 0) return "";
        return string.concat(base, tokenId.toString(), ".json");
    }

    // ---------- Agent-only mint ----------

    /**
     * @notice Mint `quantity` NFT. Hanya agent terotorisasi.
     * @dev Refund kelebihan pembayaran dilakukan setelah mint, di dalam
     * nonReentrant, mengikuti checks-effects-interactions.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        if (!authorizedAgents[msg.sender]) revert NotAuthorizedAgent(msg.sender);
        if (quantity == 0) revert InvalidQuantity();
        if (_totalMinted + quantity > MAX_SUPPLY) {
            revert MaxSupplyExceeded(quantity, MAX_SUPPLY - _totalMinted);
        }

        uint256 required = MINT_PRICE * quantity;
        if (msg.value < required) revert InsufficientPayment(msg.value, required);

        uint256 firstTokenId = _nextTokenId;
        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(msg.sender, _nextTokenId);
            _nextTokenId++;
        }
        _totalMinted += quantity;

        emit Minted(msg.sender, quantity, firstTokenId);

        uint256 refund = msg.value - required;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert WithdrawFailed();
        }
    }

    // ---------- Admin ----------

    function setAgentAuthorization(address agent, bool authorized) external onlyOwner {
        require(agent != address(0), "ZIGZOO: zero address");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationUpdated(agent, authorized);
    }

    function setAgentAuthorizations(address[] calldata agents, bool authorized) external onlyOwner {
        for (uint256 i = 0; i < agents.length; i++) {
            require(agents[i] != address(0), "ZIGZOO: zero address");
            authorizedAgents[agents[i]] = authorized;
            emit AgentAuthorizationUpdated(agents[i], authorized);
        }
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "ZIGZOO: nothing to withdraw");
        (bool ok, ) = payable(owner()).call{value: balance}("");
        if (!ok) revert WithdrawFailed();
        emit Withdrawn(owner(), balance);
    }
}
