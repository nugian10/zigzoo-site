# ZIGZOO — Arahan Artwork

Referensi yang dilampirkan dipakai sebagai **acuan bahasa visual**, bukan
untuk disalin. Karakter referensi tidak boleh dijiplak, ditjiplak ulang,
atau hanya diganti warnanya.

## Bahasa visual yang dipertahankan

- Ilustrasi retro vintage cartoon, flat 2D, bukan 3D mengilap.
- Siluet hitam tebal dengan bentuk tidak beraturan.
- Mata besar: satu mata, atau susunan mata yang tidak biasa.
- Proporsi tubuh tidak lazim; tangan, kaki, antena, duri, ekor yang unik.
- Aksen: kuning (#FFC400), merah (#E8442E), hijau (#7AB648), turquoise (#2EB5A6), hitam.
- Latar cream hangat (#FFF3D6).
- Tekstur distressed screen-print: tinta kasar, goresan, grain, cetakan tidak sempurna.

## Yang harus dihindari

- Monster generik buatan AI, template karakter berulang.
- Duplikasi karakter hanya dengan mengganti warna.
- Gaya cyberpunk futuristik, ilustrasi korporat terlalu rapi.
- Tampilan marketplace NFT generik.

## Sistem trait (dipakai galeri frontend + metadata)

- **Bentuk (12):** Blob Bulat, Menjulang, Kotak Robot, Segitiga,
  Hantu Bergelombang, Kubah, Pir Terbalik, Cacing Melingkar,
  Kucing Bertelinga, Belah Ketupat, Bunga Aneh, Bintang Berduri.
- **Mata (5):** yellow, white, slit, double, stalk.
- **Mulut (4):** zigzag, wide, checker, none.
- **Pola (4):** stripes, dots, spots, plain.
- **Antena (5):** single, double, horns, spikes, none.

Setiap tokenId di frontend (`frontend/monsters.js`) menghasilkan kombinasi
baru secara deterministik dari nomor tokennya. Untuk produksi final:

1. Artis / tim seni membuat 1.111 artwork final mengikuti sistem trait ini,
   dengan variasi komposisi tangan, ekspresi, dan siluet — bukan sekadar
   pergantian warna.
2. Ekspor tiap artwork sebagai PNG (disarankan 1024×1024, latar cream).
3. Beri nama `<id>.png`, upload ke IPFS bersama JSON di `metadata/`.
4. Struktur metadata mengikuti contoh `metadata/1.json` dan
   `metadata/2.json` (OpenSea-compatible: name, description, image, attributes).
5. Uji `tokenURI` setelah `setBaseURI` sebelum pengumuman.

## Status galeri di website saat ini

Galeri di website adalah **pratinjau generatif SVG** dari sistem trait di
atas, sehingga setiap nomor token langsung punya visual individual yang
bisa diklik dan dilihat trait-nya. Ini bukan klaim bahwa artwork PNG
final sudah selesai — ganti pratinjau dengan artwork final pada tahap
produksi, atau arahkan `image` metadata ke file PNG final di IPFS.

## Real characters now on the site (2026-10-31)

The generated character sheet is saved at `artwork/media-generation-zigzoo-character-sheet-1-*.webp`
and cropped into 12 individual tiles at `frontend/artwork/characters/zigzoo-01.webp`
through `zigzoo-12.webp`:

1. Spiral Horn, 2. Jar, 3. Crystal Coffin, 4. Berry Cloud,
5. Spring Robot, 6. Ink Drop, 7. Puzzle, 8. Padlock,
9. Acorn, 10. Rocket, 11. Compass Star, 12. Vine Tangle.

The website hero fan uses #1, #10, and #12, and gallery cards #1–#12
use these tiles. Tokens #13+ still use generative SVG previews until
final artwork for those tokens is produced. The manual mint button was
removed: minting on the site now happens only through the agent command
(copy → paste to agent → confirm in the agent wallet), with wallet /
authorization checking kept for verification.

## Expansion to 60 real characters (2026-10-31)

Four more character sheets were generated in the same style and cropped
into tiles zigzoo-13.webp through zigzoo-60.webp:

- #13–#24: Lighthouse, Teapot, Umbrella, Clock, Cactus, Open Book,
  Balloon, Guitar, Camera, Anchor, Pineapple, Snowman
- #25–#36: Rotary Telephone, Lamp, Dice, Magnet, Battery, Feather,
  Seashell, Mushroom, Carrot, Donut, Pretzel, Chess Pawn
- #37–#48: Tire Wheel, Mailbox, Pencil, Scissors, Traffic Cone,
  Ice Cream Cone, Watermelon Slice, Butterfly, Crescent Moon,
  Rain Cloud, Volcano, Castle Tower
- #49–#60: Train Locomotive, Submarine, Hot Air Balloon, Tent,
  Igloo, Windmill, Ferris Wheel, Drum, Trumpet, Violin,
  Typewriter, Satellite

The previous generative SVG preview system (`frontend/monsters.js`)
was deleted from the site, and the gallery now shows only these
60 real characters. Tokens #61–#1,111 still need final artwork
production in the same style.

## Expansion to 100 real characters (2026-10-31)

Three more 12-character sheets plus one 4-character sheet were
generated in the same style and cropped into tiles
zigzoo-61.webp through zigzoo-100.webp:

- #61–#72: Penguin, Fox, Owl, Frog, Bee, Ladybug, Crab,
  Octopus, Turtle, Shark, Elephant, Lion
- #73–#84: Astronaut, Pirate, Wizard, Chef, Firefighter,
  Doctor, Farmer, Sailor, Superhero, Ninja, Knight, Clown
- #85–#96: Cottage House, Water Tower, Mountain, Beach Ball,
  Surfboard, Skateboard, Bicycle, Car, Airplane, Boat,
  Hot Dog, Cupcake
- #97–#100: Popcorn, Soda Can, Pizza Slice, Cookie

The site gallery now shows 100 real characters. Tokens #101–#1,111
still need final artwork production in the same style.
