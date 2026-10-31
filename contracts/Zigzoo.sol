// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZIGZOO
 * @notice ERC-721 eksperimental, 1.111 supply, AGENT ONLY MINT di BNB Smart Chain.
 *
 * Spesifikasi yang dipertahankan (keputusan Bryan):
 * - MAX_SUPPLY = 1.111, tidak berubah.
 * - MINT_PRICE = 0.0005 BNB per NFT, FLAT (bukan bertingkat), tidak berubah.
 * - Kelebihan bayar dikembalikan (refund) ke minter.
 * - Artwork ACAK lewat metadata yang di-shuffle di luar kontrak (edisi
 *   maksimal 10 per desain). TIDAK ada sistem reveal, TIDAK ada deck/gacha
 *   rarity di kontrak, TIDAK ada harga bertingkat.
 * - Tidak ada batas mint per wallet.
 *
 * Perubahan dari versi sebelumnya (perintah Bryan 2026-11-01, referensi
 * kontrak OOBIX — hanya mekanisme yang disebut ini yang diadopsi, bukan
 * supply/harga/gacha OOBIX):
 * 1. Otorisasi owner (authorizedAgents / setAgentAuthorization) DIHAPUS
 *    dan DIGANTIKAN cek SPACE ID: sebuah wallet hanya bisa mint kalau
 *    memegang minimal 1 SPACE ID .ai Agent ID NFT di registry yang
 *    dikonfigurasi (default registry publik SPACE ID di BSC). Owner TIDAK
 *    lagi mengotorisasi agent satu per satu, dan TIDAK ada saklar untuk
 *    mematikan cek ini — cek ini selalu aktif. Owner hanya bisa mengganti
 *    alamat registry-nya (setAgentIdRegistry) kalau SPACE ID bermigrasi.
 * 2. Pembayaran mint LANGSUNG ke revenue wallet di dalam transaksi mint
 *    yang sama (bukan ditampung di kontrak). Revenue wallet diset saat
 *    deploy (rencana: Agentic Wallet Bryan) dan bisa diubah owner lewat
 *    setRevenueWallet. Kalau pengiriman ke revenue wallet gagal, seluruh
 *    transaksi mint revert, jadi tidak ada token yang tercetak tanpa
 *    pembayaran sampai. withdraw() tinggal sebagai katup pengaman untuk
 *    dana yang masuk ke kontrak di luar mint (misalnya force-sent) — dalam
 *    operasi normal saldo kontrak = 0, jadi withdraw akan revert NoFunds.
 *
 * Keamanan:
 * - MAX_SUPPLY ditegakkan di setiap mint.
 * - Pembayaran divalidasi; refund dilakukan setelah mint, di dalam
 *   nonReentrant, mengikuti checks-effects-interactions.
 * - holdsAgentId memakai staticcall level rendah supaya registry yang
 *   tidak menjawab seperti ERC-721 mengembalikan false, bukan revert
 *   yang merusak pembacaan — registry yang salah hanya memblokir mint,
 *   tidak pernah merusak kontrak.
 */
contract Zigzoo is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 1111;
    uint256 public constant MINT_PRICE = 0.0005 ether;

    /// @notice Registry SPACE ID .ai Agent ID NFT di BNB Smart Chain.
    address public constant DEFAULT_AGENT_ID_REGISTRY =
        0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F;

    uint256 private _nextTokenId = 1;
    uint256 private _totalMinted;

    string private _baseTokenURI;

    /// @notice Wallet penerima pembayaran mint (rencana: Agentic Wallet).
    address public revenueWallet;
    /// @notice Registry yang dipakai cek SPACE ID (bisa diubah owner).
    address public agentIdRegistry;

    event Minted(address indexed minter, uint256 quantity, uint256 firstTokenId);
    event BaseURIUpdated(string baseURI);
    event RevenueWalletUpdated(address indexed revenueWallet);
    event AgentIdRegistryUpdated(address indexed agentIdRegistry);
    event Withdrawn(address indexed revenueWallet, uint256 amount);

    error NoAgentId(address caller);
    error InvalidQuantity();
    error MaxSupplyExceeded(uint256 requested, uint256 available);
    error InsufficientPayment(uint256 sent, uint256 required);
    error PaymentForwardFailed();
    error RefundFailed();
    error InvalidAddress();
    error NoFunds();

    constructor(
        string memory baseURI_,
        address revenueWallet_,
        address agentIdRegistry_
    ) ERC721("ZIGZOO", "ZIGZOO") Ownable(msg.sender) {
        if (revenueWallet_ == address(0)) revert InvalidAddress();
        if (agentIdRegistry_ == address(0)) revert InvalidAddress();
        _baseTokenURI = baseURI_;
        revenueWallet = revenueWallet_;
        agentIdRegistry = agentIdRegistry_;
    }

    // ---------- Views ----------

    function totalSupply() public view returns (uint256) {
        return _totalMinted;
    }

    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - _totalMinted;
    }

    /// @notice True kalau `wallet` memegang minimal 1 SPACE ID .ai Agent ID
    /// NFT di registry yang dikonfigurasi. Registry yang tidak menjawab
    /// seperti ERC-721 mengembalikan false, bukan revert.
    function holdsAgentId(address wallet) public view returns (bool) {
        if (agentIdRegistry == address(0)) return false;
        (bool ok, bytes memory data) = agentIdRegistry.staticcall(
            abi.encodeWithSelector(IERC721.balanceOf.selector, wallet)
        );
        if (!ok || data.length < 32) return false;
        return abi.decode(data, (uint256)) > 0;
    }

    /// @notice Alias holdsAgentId().
    function hasAgentId(address wallet) public view returns (bool) {
        return holdsAgentId(wallet);
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

    // ---------- Agent-only mint (cek SPACE ID) ----------

    /**
     * @notice Mint `quantity` NFT ke msg.sender. Hanya wallet pemegang
     * SPACE ID .ai Agent ID. Harga = quantity x 0.0005 BNB (flat).
     * Pembayaran (harga saja, tanpa kelebihan) langsung diteruskan ke
     * revenueWallet dalam transaksi yang sama; kelebihan bayar
     * dikembalikan ke minter.
     */
    function mint(uint256 quantity) external payable nonReentrant {
        if (!holdsAgentId(msg.sender)) revert NoAgentId(msg.sender);
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

        // Bayar langsung ke revenue wallet — dana mint tidak pernah
        // mengendap di kontrak dalam operasi normal.
        if (required > 0) {
            (bool ok, ) = payable(revenueWallet).call{value: required}("");
            if (!ok) revert PaymentForwardFailed();
        }

        uint256 refund = msg.value - required;
        if (refund > 0) {
            (bool ok, ) = payable(msg.sender).call{value: refund}("");
            if (!ok) revert RefundFailed();
        }
    }

    // ---------- Admin (bukan otorisasi agent) ----------

    function setRevenueWallet(address revenueWallet_) external onlyOwner {
        if (revenueWallet_ == address(0)) revert InvalidAddress();
        revenueWallet = revenueWallet_;
        emit RevenueWalletUpdated(revenueWallet_);
    }

    function setAgentIdRegistry(address agentIdRegistry_) external onlyOwner {
        if (agentIdRegistry_ == address(0)) revert InvalidAddress();
        agentIdRegistry = agentIdRegistry_;
        emit AgentIdRegistryUpdated(agentIdRegistry_);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    /// @notice Katup pengaman saja: kirim saldo kontrak yang masuk di luar
    /// mint() ke revenueWallet. Dalam operasi normal saldo = 0.
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFunds();
        (bool ok, ) = payable(revenueWallet).call{value: balance}("");
        if (!ok) revert PaymentForwardFailed();
        emit Withdrawn(revenueWallet, balance);
    }
}
