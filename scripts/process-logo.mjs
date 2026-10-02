#!/usr/bin/env node
/**
 * Converte o logótipo para PNG com fundo transparente e recorte automático.
 * Uso: node scripts/process-logo.mjs [caminho-origem]
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const input = process.argv[2] || join(root, "images/logo.png");
const output = join(root, "images/logo.png");

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum < 24) data[i + 3] = 0;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 10 })
  .png()
  .toFile(output);

const meta = await sharp(output).metadata();
console.log(`Logótipo guardado: ${output} (${meta.width}×${meta.height}, alpha: ${meta.hasAlpha})`);
