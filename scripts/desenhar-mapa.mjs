/**
 * Mapa SVG estático (estilo Cafe-Preguiça) a partir do OpenStreetMap.
 * npm run mapa  |  npm run mapa -- --cache
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const CASA = { lat: 41.08755, lon: -8.2481 };
const LARGURA = 1600;
const ALTURA = 820;
/** Menor = mais zoom. ~1.1 ≈ quadro do Google Maps (Miratâmega + N108 + Intermarché). */
const METROS_POR_UNIDADE = 1.1;
/** Um pouco abaixo do centro → estádio e piscina a norte. */
const POSICAO_CASA = { x: 0.58, y: 0.52 };

const M_POR_GRAU_LAT = 111_132;
const M_POR_GRAU_LON = 111_320 * Math.cos((CASA.lat * Math.PI) / 180);

const lonOeste = CASA.lon - (LARGURA * POSICAO_CASA.x * METROS_POR_UNIDADE) / M_POR_GRAU_LON;
const latNorte = CASA.lat + (ALTURA * POSICAO_CASA.y * METROS_POR_UNIDADE) / M_POR_GRAU_LAT;
const lonEste = lonOeste + (LARGURA * METROS_POR_UNIDADE) / M_POR_GRAU_LON;
const latSul = latNorte - (ALTURA * METROS_POR_UNIDADE) / M_POR_GRAU_LAT;

const x = (lon) => ((lon - lonOeste) * M_POR_GRAU_LON) / METROS_POR_UNIDADE;
const y = (lat) => ((latNorte - lat) * M_POR_GRAU_LAT) / METROS_POR_UNIDADE;

const CACHE = join(root, "data/osm/alpendurada.json");
const DESTINO = join(root, "mapa/alpendurada.svg");

async function descarregar() {
  const m = 0.0048;
  const bbox = [latSul - m, lonOeste - m, latNorte + m, lonEste + m].join(",");
  const consulta = `[out:json][timeout:120];
(
  way[highway](${bbox});
  way[building](${bbox});
  way["building:part"](${bbox});
  way[leisure~"^(park|garden|pitch|playground|stadium|sports_centre|swimming_pool)$"](${bbox});
  node[leisure=swimming_pool](${bbox});
  way[landuse~"^(grass|recreation_ground|forest|meadow|cemetery|village_green)$"](${bbox});
  way[natural~"^(water|wood|scrub)$"](${bbox});
  way[waterway](${bbox});
);
out geom;`;

  const servidores = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  let dados = null;
  for (let tentativa = 0; tentativa < 6 && !dados; tentativa++) {
    const servidor = servidores[tentativa % servidores.length];
    try {
      const resposta = await fetch(servidor, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "cafe-avenida-site (mapa estático)",
        },
        body: new URLSearchParams({ data: consulta }),
      });
      if (!resposta.ok) throw new Error(`respondeu ${resposta.status}`);
      dados = await resposta.json();
    } catch (erro) {
      console.warn(`${servidor}: ${erro.message}; a tentar outra vez…`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  if (!dados) throw new Error("O Overpass não respondeu. Tentar mais tarde.");
  await mkdir(dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(dados));
  return dados;
}

let dados = process.argv.includes("--cache")
  ? JSON.parse(await readFile(CACHE, "utf8"))
  : await descarregar();

/** Alguns servidores Overpass devolvem vias só com `nodes` — montamos `geometry`. */
function normalizarGeometrias(osm) {
  const nos = new Map();
  for (const el of osm.elements) {
    if (el.type === "node" && el.lat != null) nos.set(el.id, el);
  }
  for (const el of osm.elements) {
    if (el.type !== "way" || el.geometry || !el.nodes?.length) continue;
    const geometry = el.nodes.map((id) => nos.get(id)).filter((n) => n?.lat != null);
    if (geometry.length >= 2) el.geometry = geometry.map((n) => ({ lat: n.lat, lon: n.lon }));
  }
  return osm;
}
dados = normalizarGeometrias(dados);

const r = (n) => Math.round(n * 10) / 10;
const pontos = (geom) => geom.map((p) => [x(p.lon), y(p.lat)]);
const caminho = (pts, fechar = false) =>
  "M" + pts.map(([a, b]) => `${r(a)} ${r(b)}`).join("L") + (fechar ? "Z" : "");

const fora = (pts) =>
  pts.every(([a]) => a < -50) || pts.every(([a]) => a > LARGURA + 50) ||
  pts.every(([, b]) => b < -50) || pts.every(([, b]) => b > ALTURA + 50);

const RUAS = [
  { classe: "principal", tipos: ["motorway", "trunk", "primary", "motorway_link", "trunk_link", "primary_link"], largura: 12 },
  { classe: "secundaria", tipos: ["secondary", "secondary_link", "tertiary", "tertiary_link"], largura: 9 },
  { classe: "local", tipos: ["residential", "unclassified", "living_street", "road"], largura: 6.5 },
  { classe: "servico", tipos: ["service"], largura: 3 },
  { classe: "pe", tipos: ["pedestrian", "footway", "path", "steps", "cycleway", "track"], largura: 1.4 },
];

const camadas = { verde: [], estadio: [], agua: [], predios: [], linha: [] };
const ruas = Object.fromEntries(RUAS.map((c) => [c.classe, []]));
const nomes = [];
const predioIds = new Set();
/** Eixos residenciais para “casinhas” sintéticas onde o OSM ainda não tem edifícios. */
const eixosResidenciais = [];
const centrosPredios = [];
const centrosEstadio = [];

const waysPorId = new Map();
for (const el of dados.elements) {
  if (el.type === "way" && el.geometry) waysPorId.set(el.id, el);
}

function addPredio(wayId, geom) {
  if (predioIds.has(wayId)) return;
  const pts = pontos(geom);
  if (fora(pts)) return;
  predioIds.add(wayId);
  camadas.predios.push(caminho(pts, true));
  const cx = pts.reduce((s, [a]) => s + a, 0) / pts.length;
  const cy = pts.reduce((s, [, b]) => s + b, 0) / pts.length;
  centrosPredios.push([cx, cy]);
}

const comprimento = (pts) =>
  pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

for (const el of dados.elements) {
  if (el.type === "relation" && el.tags?.building) {
    for (const mem of el.members ?? []) {
      if (mem.type === "way" && mem.role === "outer") {
        const w = waysPorId.get(mem.ref);
        if (w?.geometry) addPredio(w.id, w.geometry);
      }
    }
    continue;
  }
  if (el.type !== "way" || !el.geometry) continue;
  const t = el.tags ?? {};
  const pts = pontos(el.geometry);
  if (fora(pts)) continue;

  if (t.highway) {
    const tipo = RUAS.find((c) => c.tipos.includes(t.highway));
    if (!tipo) continue;
    ruas[tipo.classe].push(caminho(pts));
    const eixoPredios = [
      "residential",
      "living_street",
      "unclassified",
      "tertiary",
      "tertiary_link",
      "secondary",
      "secondary_link",
      "service",
    ];
    if (eixoPredios.includes(t.highway) && comprimento(pts) > 16) {
      eixosResidenciais.push({ pts, servico: t.highway === "service" });
    }
    if (t.name && ["principal", "secundaria", "local"].includes(tipo.classe)) {
      nomes.push({ nome: t.name, pts, classe: tipo.classe });
    }
  } else if (t.building || t["building:part"]) {
    addPredio(el.id, el.geometry);
  } else if (
    t.leisure === "pitch" ||
    t.leisure === "stadium" ||
    t.leisure === "sports_centre" ||
    t.leisure === "swimming_pool" ||
    (t.leisure === "playground" && t.sport)
  ) {
    camadas.estadio.push(caminho(pts, true));
    centrosEstadio.push([
      pts.reduce((s, [a]) => s + a, 0) / pts.length,
      pts.reduce((s, [, b]) => s + b, 0) / pts.length,
    ]);
  } else if (t.natural === "water" || t.waterway) {
    (t.waterway ? camadas.linha : camadas.agua).push({ d: caminho(pts, !t.waterway), agua: true });
  } else if (t.landuse === "recreation_ground") {
    camadas.estadio.push(caminho(pts, true));
    centrosEstadio.push([
      pts.reduce((s, [a]) => s + a, 0) / pts.length,
      pts.reduce((s, [, b]) => s + b, 0) / pts.length,
    ]);
  } else {
    camadas.verde.push(caminho(pts, true));
  }
}

const pertoCentro = ([px, py], lim = 22) =>
  centrosPredios.some(([a, b]) => Math.hypot(a - px, b - py) < lim);

const pertoEstadio = ([px, py]) =>
  centrosEstadio.some(([a, b]) => Math.hypot(a - px, b - py) < 95);

function rectPredio(cx, cy, nx, ny, larg, prof) {
  const hx = (nx * larg) / 2;
  const hy = (ny * larg) / 2;
  const px = (-ny * prof) / 2;
  const py = (nx * prof) / 2;
  const corners = [
    [cx - hx + px, cy - hy + py],
    [cx + hx + px, cy + hy + py],
    [cx + hx - px, cy + hy - py],
    [cx - hx - px, cy - hy - py],
  ];
  return caminho(corners, true);
}

let sinteticos = 0;
const MAX_SINTETICOS = 420;
const PASSO = 19;
const DISTANCIAS_FACHADA = [8.5, 13.5, 18];

for (const { pts, servico } of eixosResidenciais) {
  if (sinteticos >= MAX_SINTETICOS) break;
  const passo = servico ? PASSO * 1.35 : PASSO;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (seg < 6) continue;
    const nx = (x1 - x0) / seg;
    const ny = (y1 - y0) / seg;
    for (let d = passo * 0.5; d < seg - passo * 0.35; d += passo) {
      if (sinteticos >= MAX_SINTETICOS) break;
      const px = x0 + nx * d;
      const py = y0 + ny * d;
      if (px < 24 || px > LARGURA - 24 || py < 20 || py > ALTURA - 20) continue;
      for (const dist of DISTANCIAS_FACHADA) {
        for (const lado of [-1, 1]) {
          if (sinteticos >= MAX_SINTETICOS) break;
          if (servico && dist > 13.5) continue;
          const ox = px + (-ny * lado * dist);
          const oy = py + (nx * lado * dist);
          if (pertoCentro([ox, oy], 17) || pertoEstadio([ox, oy])) continue;
          const larg = 6.5 + (sinteticos % 4) * 1.4;
          const prof = 9 + (sinteticos % 5) * 1.1;
          camadas.predios.push(rectPredio(ox, oy, nx, ny, larg, prof));
          centrosPredios.push([ox, oy]);
          sinteticos++;
        }
      }
    }
  }
}

for (const el of dados.elements) {
  if (el.type !== "node" || el.tags?.leisure !== "swimming_pool") continue;
  const px = x(el.lon);
  const py = y(el.lat);
  if (px < 0 || px > LARGURA || py < 0 || py > ALTURA) continue;
  const w = 28;
  const h = 18;
  camadas.estadio.push(
    caminho([[px - w, py - h], [px + w, py - h], [px + w, py + h], [px - w, py + h]], true),
  );
}

const perto = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 1;

function encadear(trocos) {
  const livres = trocos.map((t) => [...t]);
  const cadeias = [];
  while (livres.length) {
    let cadeia = livres.shift();
    for (let juntou = true; juntou; ) {
      juntou = false;
      for (let i = 0; i < livres.length; i++) {
        const t = livres[i];
        const [ini, fim] = [cadeia[0], cadeia[cadeia.length - 1]];
        if (perto(fim, t[0])) cadeia = [...cadeia, ...t.slice(1)];
        else if (perto(fim, t[t.length - 1])) cadeia = [...cadeia, ...[...t].reverse().slice(1)];
        else if (perto(ini, t[t.length - 1])) cadeia = [...t, ...cadeia.slice(1)];
        else if (perto(ini, t[0])) cadeia = [...[...t].reverse(), ...cadeia.slice(1)];
        else continue;
        livres.splice(i, 1);
        juntou = true;
        break;
      }
    }
    cadeias.push(cadeia);
  }
  return cadeias;
}

const agrupados = new Map();
for (const n of nomes) {
  if (!agrupados.has(n.nome)) agrupados.set(n.nome, { classe: n.classe, trocos: [] });
  agrupados.get(n.nome).trocos.push(n.pts);
}

const porNome = new Map();
for (const [nome, { classe, trocos }] of agrupados) {
  const dentro = encadear(trocos).map((c) =>
    c.filter(([a, b]) => a > 0 && a < LARGURA && b > 0 && b < ALTURA),
  );
  const maior = dentro.sort((a, b) => comprimento(b) - comprimento(a))[0];
  if (maior && maior.length > 1) porNome.set(nome, { nome, classe, pts: maior, c: comprimento(maior) });
}

const TAMANHO = { principal: 12, secundaria: 11, local: 10 };
const rotulos = [];
const ocupados = [[LARGURA * POSICAO_CASA.x, ALTURA * POSICAO_CASA.y]];
const PESO = { principal: 0, secundaria: 1, local: 2 };

const RUA_DA_CASA = "Avenida Doutor Francisco Sá Carneiro";
const daCasa = porNome.get(RUA_DA_CASA) ?? [...porNome.entries()].find(([k]) => k.includes("Francisco Sá Carneiro"))?.[1];
if (daCasa) {
  const [cx, cy] = [LARGURA * POSICAO_CASA.x, ALTURA * POSICAO_CASA.y];
  const dist = daCasa.pts.map(([a, b]) => Math.hypot(a - cx, b - cy));
  const i = dist.indexOf(Math.min(...dist));
  const lados = [daCasa.pts.slice(0, i + 1), daCasa.pts.slice(i)];
  const lado = lados.sort((a, b) => comprimento(b) - comprimento(a))[0];
  const longe = lado.filter(([a, b]) => Math.hypot(a - cx, b - cy) > 70);
  porNome.set(RUA_DA_CASA, {
    ...daCasa,
    nome: "Av. F. Sá Carneiro",
    classe: "secundaria",
    pts: longe.length > 1 ? longe : lado,
    c: comprimento(longe.length > 1 ? longe : lado),
    casa: true,
  });
}

for (const n of [...porNome.values()].sort(
  (a, b) => (b.casa ? 1 : 0) - (a.casa ? 1 : 0) || PESO[a.classe] - PESO[b.classe] || b.c - a.c,
)) {
  const precisa = n.nome.length * TAMANHO[n.classe] * 0.55 + 50;
  if (n.c < precisa) continue;
  const corda = Math.hypot(n.pts.at(-1)[0] - n.pts[0][0], n.pts.at(-1)[1] - n.pts[0][1]);
  if (corda / n.c < 0.75) continue;
  let pts = n.pts;
  if (pts[pts.length - 1][0] < pts[0][0]) pts = [...pts].reverse();
  const meio = pts[Math.floor(pts.length / 2)];
  if (meio[0] < 40 || meio[0] > LARGURA - 40 || meio[1] < 30 || meio[1] > ALTURA - 30) continue;
  if (!n.casa && ocupados.some(([a, b], i) => Math.hypot(a - meio[0], b - meio[1]) < (i === 0 ? 60 : 100))) continue;
  ocupados.push(meio);
  rotulos.push({ id: `r${rotulos.length}`, d: caminho(pts), nome: n.nome, classe: n.classe });
  if (rotulos.length >= 12) break;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LARGURA} ${ALTURA}" preserveAspectRatio="xMidYMid slice">
<!-- Dados © OpenStreetMap (ODbL). Gerado por scripts/desenhar-mapa.mjs -->
<defs>${rotulos.map((l) => `<path id="${l.id}" d="${l.d}"/>`).join("")}</defs>
<rect width="100%" height="100%" fill="#ebe3d8"/>
<g fill="#ddd4c8">${camadas.verde.map((d) => `<path d="${d}"/>`).join("")}</g>
<g fill="#c5d4b0" stroke="#a8b892" stroke-width="1.2">${camadas.estadio.map((d) => `<path d="${d}"/>`).join("")}</g>
<g fill="#b8cdd4">${camadas.agua.map((a) => `<path d="${a.d}"/>`).join("")}</g>
<g fill="#d8c8b0" stroke="#e8ddd0" stroke-width="0.95">${camadas.predios.map((d) => `<path d="${d}"/>`).join("")}</g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<g stroke="#c9bdb0" stroke-width="1.4" stroke-dasharray="3 4">${ruas.pe.map((d) => `<path d="${d}"/>`).join("")}</g>
<g stroke="#e0c898" stroke-width="3.2">${ruas.servico.map((d) => `<path d="${d}"/>`).join("")}</g>
<g stroke="#e8d4a0" stroke-width="6.5">${ruas.local.map((d) => `<path d="${d}"/>`).join("")}</g>
<g stroke="#ddb878" stroke-width="9">${ruas.secundaria.map((d) => `<path d="${d}"/>`).join("")}</g>
<g stroke="#d4a85a" stroke-width="11.5">${ruas.principal.map((d) => `<path d="${d}"/>`).join("")}</g>
${camadas.linha.map((l) => `<path d="${l.d}" stroke="#8eb0bc" stroke-width="2.5"/>`).join("")}
</g>
<g font-family="DM Sans, Helvetica, Arial, sans-serif" fill="#7a5c38" stroke="#ebe3d8" stroke-width="3" paint-order="stroke" letter-spacing="0.15">
${rotulos.map((l) => `<text font-size="${TAMANHO[l.classe]}" dy="4"><textPath href="#${l.id}" startOffset="50%" text-anchor="middle">${esc(l.nome)}</textPath></text>`).join("\n")}
</g>
</svg>
`;

await mkdir(dirname(DESTINO), { recursive: true });
await writeFile(DESTINO, svg);
console.log(
  `${DESTINO}: ${(svg.length / 1024).toFixed(0)} KB · ${camadas.predios.length} edifícios (${predioIds.size} OSM + sintéticos) · ${camadas.estadio.length} relvados · ${rotulos.length} nomes`,
);
