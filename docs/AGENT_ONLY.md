# ZIGZOO — Arsitektur Agent-Only Minting

## Prinsip

ZIGZOO bukan mint publik. Satu-satunya gerbang otorisasi adalah state
on-chain di kontrak, bukan jenis wallet, bukan user-agent browser, dan
bukan klaim dari frontend.

## Komponen

1. **Cek SPACE ID di kontrak (v2, menggantikan otorisasi owner)**
   - `holdsAgentId(address)` — true kalau wallet memegang minimal 1
     SPACE ID .ai Agent ID NFT di registry yang dikonfigurasi
     (default registry publik SPACE ID di BSC).
   - TIDAK ADA lagi `authorizedAgents`, `setAgentAuthorization`, atau
     saklar untuk mematikan cek ini. Owner hanya bisa mengganti alamat
     registry (`setAgentIdRegistry`) kalau SPACE ID bermigrasi, dan
     mengubah revenue wallet (`setRevenueWallet`) / baseURI.

2. **Pemeriksaan di `mint()`**
   - Baris pertama yang relevan: `if (!holdsAgentId(msg.sender)) revert NoAgentId(msg.sender);`
   - Tidak ada jalur lain untuk mint. Tidak ada fungsi mint publik,
     tidak ada allowlist off-chain yang bisa dipalsukan di frontend.

3. **Pemeriksaan di frontend (`frontend/app.js`)**
   - Setelah connect, frontend memanggil `holdsAgentId(alamat)` di chain.
   - Bila `false`, tombol Mint dinonaktifkan dan pesan penolakan ditampilkan.
   - Bila kontrak belum dikonfigurasi, frontend menampilkan status
     "menunggu deployment" — bukan status verified palsu.

## Tentang Binance Agentic Wallet

Binance Agentic Wallet dan wallet EIP-1193 lain terhubung lewat provider
yang sama (`window.ethereum`). Dari sisi kontrak, yang diverifikasi adalah
**kepemilikan SPACE ID .ai Agent ID**, bukan label wallet dan bukan
otorisasi owner.

Artinya alur yang benar adalah:

1. Wallet agent memegang minimal 1 SPACE ID .ai Agent ID NFT.
2. Kontrak memeriksa kepemilikan itu on-chain di setiap `mint()`
   (lihat `scripts/check-agent-id.js`).
3. Baru setelah itu frontend + kontrak mengizinkan mint.

Klaim "wallet ini adalah Agentic Wallet, jadi otomatis terverifikasi"
**tidak** dipakai di proyek ini, karena label saja tidak membuktikan
kepemilikan SPACE ID.

## Serangan yang ditangani

| Serangan / kesalahan | Penanganan |
|---|---|
| Wallet tanpa SPACE ID memanggil `mint` langsung ke kontrak | Revert `NoAgentId` |
| Frontend dimodifikasi untuk mengaktifkan tombol | Kontrak tetap menolak; frontend bukan otoritas |
| Pembayaran kurang | Revert `InsufficientPayment` |
| Mint melebihi 1.111 | Revert `MaxSupplyExceeded` |
| Kelebihan bayar "nyangkut" | Refund otomatis dalam `mint()` |
| Reentrancy saat refund/withdraw | `ReentrancyGuard` + checks-effects-interactions |
| Registry SPACE ID berubah | Owner mengganti `agentIdRegistry` lewat `setAgentIdRegistry` |

## Batasan yang jujur

- Otorisasi allowlist berarti owner memegang kendali siapa yang bisa mint.
  Ini disengaja sesuai spesifikasi "agent only", bukan kelemahan tersembunyi.
- Bila owner key bocor, penyerang bisa mengotorisasi dirinya sendiri.
  Gunakan multisig / wallet khusus owner dan simpan key dengan aman.
- Bila di masa depan ingin otorisasi berbasis tanda tangan (EIP-712),
  tambahkan sebagai fungsi terpisah dengan nonce + deadline, dan audit
  sebelum mengganti mekanisme ini — jangan menumpuk dua mekanisme tanpa audit.
