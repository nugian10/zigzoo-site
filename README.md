# ZIGZOO

Koleksi eksperimental berisi 1.111 karakter monster kartun orisinal di
BNB Smart Chain. **Agent Only Mint** — bukan mint publik.

- **Total supply:** 1.111 NFT
- **Harga mint:** 0.0005 BNB per NFT
- **Blockchain:** BNB Smart Chain Mainnet, Chain ID 56
- **Sistem mint:** Agent only, lewat registry otorisasi on-chain
- **Batas per wallet:** tidak ada
- **Desain website:** sistem editorial ala referensi Subsonic (latar gelap,
  section bernomor 01–04, panel progress, kipas kartu hero, marquee,
  label monospace, tombol primer putih, dan perintah agent yang bisa
  disalin) yang diterjemahkan ke palet dan monster ZIGZOO sendiri.
  Supply, harga, nama, dan artwork Subsonic tidak disalin.

> Proyek ini **belum di-deploy**. Tidak ada transaksi blockchain yang
> dijalankan dan tidak ada BNB yang dikeluarkan saat proyek ini dibuat.
> Alamat kontrak dan akun media sosial sengaja dibiarkan kosong sampai
> deployment manual dan pengumuman resmi — tidak ada alamat atau akun palsu.

## Isi proyek

```
zigzoo/
├── frontend/
│   ├── index.html      # Website minting (mobile-first, section 01–04)
│   ├── style.css       # Desain gelap editorial + aksen kuning / merah / hijau / turquoise
│   ├── config.js       # ← ISI CONTRACT_ADDRESS SETELAH DEPLOYMENT
│   ├── agent-skill.md  # Instruksi mint untuk AI agent (ditautkan dari website)
│   ├── artwork/characters/ # 60 tile karakter asli (zigzoo-01..60)
│   └── app.js          # Web3: validasi chain 56, cek agent, mint, baca counter dari chain
├── contracts/
│   └── Zigzoo.sol      # ERC-721 agent-only v2, MAX_SUPPLY 1111, refund, direct payout, cek SPACE ID
├── scripts/
│   ├── deploy.js
│   ├── check-agent-id.js  # Cek holdsAgentId (v2, tanpa otorisasi owner)
│   └── generate-metadata.js
├── test/
│   └── Zigzoo.test.js  # Test otomatis (cek SPACE ID, pembayaran langsung, supply, withdraw)
├── metadata/
│   ├── 1.json, 2.json  # Contoh struktur metadata
│   └── generated/      # Dibuat oleh generate-metadata.js (kerangka 1..1111)
├── docs/
│   ├── DEPLOYMENT.md   # Instalasi, test, deployment manual, verifikasi
│   ├── AGENT_ONLY.md   # Arsitektur otorisasi agent
│   └── ARTWORK.md      # Arahan seni + sistem trait
├── hardhat.config.js
├── package.json
├── .env.example
└── README.md
```

## Jalankan website secara lokal

```bash
cd zigzoo/frontend
python3 -m http.server 8000
# buka http://localhost:8000
```

Website akan menampilkan status "kontrak belum dikonfigurasi" dan
menonaktifkan Mint sampai `config.js` diisi alamat kontrak terverifikasi.
Ini disengaja: tidak ada counter palsu dan tidak ada simulasi sukses.

## Jalankan test kontrak

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

Ikuti `docs/DEPLOYMENT.md` secara berurutan: testnet dulu, verifikasi
BscScan, isi `CONTRACT_ADDRESS`, cek SPACE ID, upload metadata,
lalu `setBaseURI`. Jangan lewati verifikasi sebelum mengumumkan alamat.

## Keamanan — ringkas

- Otorisasi agent = cek SPACE ID (`holdsAgentId`) di kontrak v2, tanpa
  daftar otorisasi owner. Koneksi wallet saja bukan bukti kepemilikan SPACE ID.
- Pembayaran divalidasi, supply dibatasi 1.111, kelebihan bayar dikembalikan.
- Tidak ada private key di repo ini. Gunakan `.env` lokal (lihat `.env.example`).
