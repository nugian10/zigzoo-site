# ZIGZOO — Panduan Instalasi, Pengujian, dan Deployment (Manual)

> **Tidak ada deployment otomatis dalam paket ini.** Semua langkah di bawah
> dilakukan manual oleh pemilik proyek, setelah peninjauan. Tidak ada BNB
> yang dikeluarkan oleh pembuatan proyek ini.

## 1. Prasyarat

- Node.js 18+ dan npm
- Wallet deployment khusus (bukan wallet utama) dengan BNB secukupnya untuk gas
- API key BscScan (opsional, untuk verifikasi)

## 2. Instalasi & pengujian lokal

```bash
cd zigzoo
cp .env.example .env   # isi hanya bila perlu; JANGAN commit .env
npm install
npx hardhat compile
npx hardhat test
```

Test mencakup: cek SPACE ID, penolakan wallet tanpa SPACE ID, validasi pembayaran,
refund kelebihan bayar, pembayaran langsung ke revenue wallet, batas supply 1.111,
withdraw hanya-owner (katup pengaman), dan tokenURI.

## 3. Uji di BSC Testnet dulu (sangat disarankan)

```bash
# .env: BSC_TESTNET_RPC_URL, DEPLOYER_PRIVATE_KEY, BASE_URI (boleh kosong dulu)
npx hardhat run scripts/deploy.js --network bscTestnet
# Catat alamat kontrak testnet, lalu cek SPACE ID (tidak ada authorize):
CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... npx hardhat run scripts/check-agent-id.js --network bscTestnet
```

Uji mint dari frontend dengan `CONTRACT_ADDRESS` testnet di
`frontend/config.js` (sementara) dan wallet agent testnet.

## 4. Deployment Mainnet (manual)

```bash
# .env: BSC_RPC_URL, DEPLOYER_PRIVATE_KEY, BASE_URI (isi bila metadata siap)
npx hardhat run scripts/deploy.js --network bsc
```

Catat alamat kontrak. **Jangan** mengumumkan alamat sebelum verifikasi.

## 5. Verifikasi kontrak di BscScan

```bash
npx hardhat verify --network bsc <ALAMAT_KONTRAK> "<BASE_URI>" <REVENUE_WALLET> <AGENT_ID_REGISTRY>
```

Atau verifikasi manual di BscScan dengan source `contracts/Zigzoo.sol`
dan pengaturan compiler Solidity 0.8.28, optimizer enabled, runs 200, EVM version Cancun (lihat `hardhat.config.js`).
Cocokkan bytecode sebelum mengumumkan alamat.

## 6. Aktifkan frontend

1. Isi `CONTRACT_ADDRESS` di `frontend/config.js` dengan alamat mainnet terverifikasi.
2. Isi `SOCIALS` hanya dengan akun resmi yang sudah ada.
3. Deploy frontend statis (folder `frontend/`) ke hosting pilihan kamu.
   Frontend tidak butuh server backend; semua Web3 lewat wallet pengguna.

## 7. Cek SPACE ID (tidak ada otorisasi agent di v2)

```bash
CONTRACT_ADDRESS=0x... AGENT_ADDRESS=0x... npx hardhat run scripts/check-agent-id.js --network bsc
```

Verifikasi di BscScan → Read Contract → `holdsAgentId` dengan alamat
agent. Frontend akan menampilkan "Agent terverifikasi" hanya bila fungsi
ini mengembalikan `true`. Tidak ada langkah authorize dan tidak ada cara
mencabut per-wallet — yang bisa mint hanyalah pemegang SPACE ID.

## 8. Metadata

1. Produksi artwork final sesuai `docs/ARTWORK.md`.
2. Upload artwork + JSON metadata ke IPFS (mis. Pinata / nft.storage).
3. Dapatkan CID folder metadata, lalu panggil `setBaseURI` dari owner:
   `ipfs://<CID>/` (akhiri dengan `/`).
4. Periksa `tokenURI(1)` di BscScan → harus mengembalikan
   `ipfs://<CID>/1.json`.

## 9. Checklist sebelum pengumuman

- [ ] Kontrak terverifikasi di BscScan, MAX_SUPPLY = 1111, MINT_PRICE = 0.0005 BNB
- [ ] `totalSupply()` awal = 0 (tidak ada pre-mint tersembunyi)
- [ ] Agent resmi sudah diotorisasi; wallet biasa ditolak saat uji mint
- [ ] Frontend menampilkan alamat kontrak asli, bukan placeholder
- [ ] Metadata IPFS bisa dibuka dari `tokenURI`
- [ ] Tidak ada private key di repo, tidak ada tautan sosial palsu
