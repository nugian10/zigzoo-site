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

> Proyek ini **SUDAH di-deploy dan MINT LIVE sejak 1 Nov 2026**.
> Kontrak: `0xc65754c1d0EdaBf231B1Df399c58062fEE85f03C` (BNB Smart Chain,
> source-verified di BscScan). Situs live di https://zigzoo.xyz.
> Ter-mint 19 dari 1.111 per cek 4 Nov 2026 — cek jumlah terbaru langsung
> di chain (`totalSupply()`), bukan dari angka di file ini.

## Isi proyek

```
zigzoo/
├── frontend/
│   ├── index.html      # Website minting (mobile-first, section 01–04)
│   ├── style.css       # Desain gelap editorial + aksen kuning / merah / hijau / turquoise
│   ├── config.js       # CONTRACT_ADDRESS sudah terisi (kontrak deploy 1 Nov 2026)
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

Kontrak sudah terkonfigurasi di `config.js`, jadi angka mint di website
dibaca langsung dari chain (`totalSupply()`). Tidak ada counter palsu
dan tidak ada simulasi sukses.

## Jalankan test kontrak

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Deployment

Deployment SUDAH selesai 1 Nov 2026 (kontrak di atas, terverifikasi di
BscScan, baseURI sudah di-set). Untuk referensi, prosedur awalnya:
Ikuti `docs/DEPLOYMENT.md` secara berurutan: testnet dulu, verifikasi
BscScan, isi `CONTRACT_ADDRESS`, cek SPACE ID, upload metadata,
lalu `setBaseURI`. Jangan lewati verifikasi sebelum mengumumkan alamat.

## Keamanan — ringkas

- Otorisasi agent = cek SPACE ID (`holdsAgentId`) di kontrak v2, tanpa
  daftar otorisasi owner. Koneksi wallet saja bukan bukti kepemilikan SPACE ID.
- Pembayaran divalidasi, supply dibatasi 1.111, kelebihan bayar dikembalikan.
- Tidak ada private key di repo ini. Gunakan `.env` lokal (lihat `.env.example`).
