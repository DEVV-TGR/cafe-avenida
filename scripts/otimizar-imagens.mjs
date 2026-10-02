#!/usr/bin/env node
/**
 * Gera versões leves das imagens do site (os originais ficam intactos):
 * - images/web/*.webp em várias larguras, para srcset (fotos de config.js e menu.json);
 * - logótipos redimensionados, imagem de partilha (Open Graph) e ícones;
 * - js/imagens.js com a lista de versões, usado pelas páginas para escolher o tamanho certo.
 * Uso (na raiz): node scripts/otimizar-imagens.mjs — correr de novo sempre que mudarem fotos.
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "images/web";
const FOTO = [480, 960, 1600];
const FIGURA = [240, 480];

async function readConfig() {
  const sandbox = { window: {} };
  vm.runInNewContext(await readFile(join(root, "config.js"), "utf8"), sandbox);
  return sandbox.window.CAFE_CONFIG;
}

/** "images/ementa/../x.jpg" → "images/x.jpg" (a mesma regra que js/imagens.js usa). */
const normalize = (src) => posix.normalize(src);

function outName(src, width) {
  const base = normalize(src).replace(/^images\//, "").replace(/\.[^.]+$/, "").replace(/\//g, "-");
  return `${OUT}/${base}-${width}.webp`;
}

async function variants(src, widths) {
  const input = join(root, normalize(src));
  const { width: original } = await sharp(input).metadata();
  const list = [];
  for (const target of widths) {
    const width = Math.min(target, original);
    if (list.some(([w]) => w === width)) break;
    const file = outName(src, width);
    await sharp(input).rotate().resize({ width }).webp({ quality: 72, effort: 6 }).toFile(join(root, file));
    list.push([width, file]);
    if (width === original) break;
  }
  return list;
}

const cfg = await readConfig();
const menu = JSON.parse(await readFile(join(root, "menu.json"), "utf8"));
await mkdir(join(root, OUT), { recursive: true });

const photos = new Set([
  cfg.media.hero.image,
  ...cfg.media.gallery.filter((item) => item.type !== "video").map((item) => item.src),
  ...cfg.suggestions.filter((item) => item.image).map((item) => item.image),
].map(normalize));

const figures = new Set();
(function walk(list) {
  list.forEach((cat) => {
    (cat.figures || []).forEach((src) => figures.add(normalize(src)));
    if (cat.subcategories) walk(cat.subcategories);
  });
})(menu.categories);

const manifest = {};
for (const src of photos) manifest[src] = await variants(src, FOTO);
for (const src of figures) if (!manifest[src]) manifest[src] = await variants(src, FIGURA);
manifest["images/logo-linha.png"] = await variants("images/logo-linha.png", [600, 1200]);

// Logótipo: mostrado no máximo a 160 px, por isso 320 px chega para ecrãs de alta densidade.
await sharp(join(root, "images/logo.png")).resize({ width: 320 }).png({ palette: true, quality: 90, effort: 10 })
  .toFile(join(root, "images/logo-320.png"));

// Imagem de partilha (WhatsApp, Facebook…): 1200×630 a partir da foto principal.
await sharp(join(root, cfg.media.hero.image)).rotate().resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(join(root, "images/partilha.jpg"));

// Ícones: logótipo sobre fundo claro (o iOS pinta de preto o que for transparente).
const icon = (size) => sharp(join(root, "images/logo.png"))
  .resize(size, size, { fit: "contain", background: "#EBE5DC" })
  .flatten({ background: "#EBE5DC" }).png();
await icon(180).toFile(join(root, "images/icone-180.png"));
await icon(32).toFile(join(root, "images/icone-32.png"));

// favicon.ico com PNG 16 e 32 lá dentro (formato aceite por todos os browsers atuais).
const pngs = await Promise.all([16, 32].map((size) => icon(size).toBuffer()));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const size = [16, 32][i];
  const entry = 6 + i * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(join(root, "favicon.ico"), Buffer.concat([header, ...pngs]));

const js = `/* Gerado por scripts/otimizar-imagens.mjs — não editar à mão. */
window.CAFE_IMAGENS = ${JSON.stringify(manifest)};
`;
await writeFile(join(root, "js/imagens-lista.js"), js);

const total = Object.values(manifest).reduce((n, list) => n + list.length, 0);
console.log(`✓ ${Object.keys(manifest).length} imagens, ${total} versões em ${OUT}/`);
console.log("✓ images/logo-320.png, images/partilha.jpg, images/icone-180.png, images/icone-32.png, favicon.ico");
