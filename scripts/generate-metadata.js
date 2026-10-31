/**
 * Generate kerangka metadata 1..1111 dari sistem trait yang sama dengan
 * frontend (frontend/monsters.js). Script ini HANYA menghasilkan JSON
 * trait + placeholder image — file artwork PNG/SVG final tetap harus
 * diproduksi dari arahan seni (lihat docs/ARTWORK.md) lalu di-upload
 * ke IPFS, dan CID-nya menggantikan placeholder di bawah.
 *
 * Jalankan: node scripts/generate-metadata.js
 * Output: metadata/generated/*.json (tidak menimpa metadata/1.json contoh)
 *
 * Catatan kejujuran: jangan klaim metadata ini sudah final / sudah
 * di-upload sebelum CID asli benar-benar ada.
 */
const fs = require("fs");
const path = require("path");

// Duplikasi ringan logika trait (agar script ini bisa jalan tanpa DOM).
function mulberry32(seed) {
  let t = (seed >>> 0) + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const BODIES = ["Blob Bulat", "Menjulang", "Kotak Robot", "Segitiga", "Hantu Bergelombang", "Kubah", "Pir Terbalik", "Cacing Melingkar", "Kucing Bertelinga", "Belah Ketupat", "Bunga Aneh", "Bintang Berduri"];
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)];

const outDir = path.join(__dirname, "..", "metadata", "generated");
fs.mkdirSync(outDir, { recursive: true });
for (let id = 1; id <= 1111; id++) {
  const rnd = mulberry32(id * 2654435761 + 97);
  const meta = {
    name: `ZIGZOO #${id}`,
    description: "Koleksi eksperimental berisi karakter monster kartun orisinal di BNB Smart Chain.",
    image: `ipfs://GANTI_DENGAN_CID_SETELAH_UPLOAD/${id}.png`,
    external_url: "",
    attributes: [
      { trait_type: "Bentuk", value: pick(rnd, BODIES) },
      { trait_type: "Mata", value: pick(rnd, ["yellow", "white", "slit", "double", "stalk"]) },
      { trait_type: "Mulut", value: pick(rnd, ["zigzag", "wide", "checker", "zigzag", "none"]) },
      { trait_type: "Pola", value: pick(rnd, ["stripes", "dots", "spots", "plain", "dots", "stripes"]) },
      { trait_type: "Antena", value: pick(rnd, ["single", "double", "horns", "spikes", "none"]) },
    ],
  };
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(meta, null, 2) + "\n");
}
console.log("Selesai: 1.111 file metadata kerangka ditulis ke metadata/generated/");
console.log("Ganti placeholder ipfs://GANTI_DENGAN_CID_SETELAH_UPLOAD/ dengan CID IPFS asli setelah upload.");
