# ZIGZOO — Arsitektur Agent-Only Minting

## Prinsip

ZIGZOO bukan mint publik. Satu-satunya gerbang otorisasi adalah state
on-chain di kontrak, bukan jenis wallet, bukan user-agent browser, dan
bukan klaim dari frontend.

## Komponen

1. **Registry di kontrak (`authorizedAgents`)**
   - `mapping(address => bool) public authorizedAgents`
   - Hanya owner yang bisa mengubah lewat `setAgentAuthorization` /
     `setAgentAuthorizations`.
   - Setiap perubahan memancarkan `AgentAuthorizationUpdated`.

2. **Pemeriksaan di `mint()`**
   - Baris pertama yang relevan: `if (!authorizedAgents[msg.sender]) revert NotAuthorizedAgent(msg.sender);`
   - Tidak ada jalur lain untuk mint. Tidak ada fungsi mint publik,
     tidak ada allowlist off-chain yang bisa dipalsukan di frontend.

3. **Pemeriksaan di frontend (`frontend/app.js`)**
   - Setelah connect, frontend memanggil `isAuthorizedAgent(alamat)` di chain.
   - Bila `false`, tombol Mint dinonaktifkan dan pesan penolakan ditampilkan.
   - Bila kontrak belum dikonfigurasi, frontend menampilkan status
     "menunggu deployment" — bukan status verified palsu.

## Tentang Binance Agentic Wallet

Binance Agentic Wallet dan wallet EIP-1193 lain terhubung lewat provider
yang sama (`window.ethereum`). Dari sisi kontrak, yang diverifikasi adalah
**alamat agent yang sudah diotorisasi owner**, bukan label wallet.

Artinya alur yang benar adalah:

1. Agent memberikan alamat wallet-nya kepada pemilik proyek lewat kanal resmi.
2. Pemilik memverifikasi identitas/afiliasi agent di luar chain.
3. Pemilik mengotorisasi alamat itu on-chain (lihat `scripts/authorize-agent.js`).
4. Baru setelah itu frontend + kontrak mengizinkan mint.

Klaim "wallet ini adalah Agentic Wallet, jadi otomatis terverifikasi"
**tidak** dipakai di proyek ini, karena alamat saja tidak membuktikan
otorisasi.

## Serangan yang ditangani

| Serangan / kesalahan | Penanganan |
|---|---|
| Wallet biasa memanggil `mint` langsung ke kontrak | Revert `NotAuthorizedAgent` |
| Frontend dimodifikasi untuk mengaktifkan tombol | Kontrak tetap menolak; frontend bukan otoritas |
| Pembayaran kurang | Revert `InsufficientPayment` |
| Mint melebihi 1.111 | Revert `MaxSupplyExceeded` |
| Kelebihan bayar "nyangkut" | Refund otomatis dalam `mint()` |
| Reentrancy saat refund/withdraw | `ReentrancyGuard` + checks-effects-interactions |
| Owner lama / agent dicabut | `setAgentAuthorization(..., false)` langsung efektif |

## Batasan yang jujur

- Otorisasi allowlist berarti owner memegang kendali siapa yang bisa mint.
  Ini disengaja sesuai spesifikasi "agent only", bukan kelemahan tersembunyi.
- Bila owner key bocor, penyerang bisa mengotorisasi dirinya sendiri.
  Gunakan multisig / wallet khusus owner dan simpan key dengan aman.
- Bila di masa depan ingin otorisasi berbasis tanda tangan (EIP-712),
  tambahkan sebagai fungsi terpisah dengan nonce + deadline, dan audit
  sebelum mengganti mekanisme ini — jangan menumpuk dua mekanisme tanpa audit.
