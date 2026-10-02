#!/usr/bin/env node
/**
 * Gera QR codes (SVG + PNG) para a ementa.
 * Uso: node scripts/generate-qr.mjs [--domain https://exemplo.pt]
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "qr");

async function readDomainFromConfig() {
  const raw = await readFile(join(root, "config.js"), "utf8");
  const match = raw.match(/domain:\s*["']([^"']+)["']/);
  return match?.[1] ?? "https://NOME_DO_DOMINIO.example";
}

function parseArgs(defaultDomain) {
  const args = process.argv.slice(2);
  const domainIdx = args.indexOf("--domain");
  const domain = domainIdx >= 0 ? args[domainIdx + 1] : defaultDomain;
  return domain.replace(/\/$/, "");
}

async function generate(label, url) {
  const base = join(outDir, label);
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 1024,
  });
  const png = await QRCode.toBuffer(url, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 2048,
  });
  await writeFile(`${base}.svg`, svg);
  await writeFile(`${base}.png`, png);
  console.log(`✓ ${label}: ${url}`);
}

async function main() {
  const configDomain = await readDomainFromConfig();
  const domain = parseArgs(configDomain);
  await mkdir(outDir, { recursive: true });

  const targets = [
    ["ementa", `${domain}/ementa`],
    ["ementa-pt", `${domain}/ementa`],
    ["ementa-en", `${domain}/en/ementa`],
    ["ementa-fr", `${domain}/fr/ementa`],
  ];

  for (const [name, url] of targets) {
    await generate(name, url);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
