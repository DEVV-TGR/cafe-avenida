/**
 * CSP, cabeçalhos HTTP e regras do browser.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGINAS, blocosInline, cspDaPagina, diretivas, hashCsp, ler, lerPagina } from "./ajudantes.mjs";

const FONTES_PROIBIDAS = ["'unsafe-eval'", "'unsafe-inline'", "'unsafe-hashes'", "*", "http:", "https:", "data:", "blob:"];
/** Sem terceiros: as fontes passaram a estar alojadas no próprio site. */
const TERCEIROS_PERMITIDOS = {};

const csps = Object.fromEntries(PAGINAS.map((p) => [p, cspDaPagina(lerPagina(p))]));

test("todas as páginas HTML têm CSP em <meta>", () => {
  assert.ok(PAGINAS.length > 0);
  for (const [pagina, csp] of Object.entries(csps)) {
    assert.ok(csp, `${pagina} não tem <meta http-equiv="Content-Security-Policy">`);
  }
});

test("a CSP é igual em todas as páginas", () => {
  const unicas = new Set(Object.values(csps));
  assert.equal(unicas.size, 1, `CSP diferente entre páginas: ${JSON.stringify(csps, null, 2)}`);
});

test("a CSP vem antes de qualquer script, estilo ou folha externa", () => {
  for (const pagina of PAGINAS) {
    const html = lerPagina(pagina);
    const posCsp = html.search(/<meta\s+http-equiv="Content-Security-Policy"/i);
    const posRecurso = html.search(/<(script|style|link)\b/i);
    assert.ok(posCsp >= 0 && (posRecurso < 0 || posCsp < posRecurso), `${pagina}: a CSP tem de aparecer antes de <script>/<style>/<link>`);
  }
});

test("CSP fecha por omissão e não usa fontes inseguras", () => {
  const d = diretivas(Object.values(csps)[0]);
  assert.deepEqual(d["default-src"], ["'none'"]);
  assert.deepEqual(d["object-src"], ["'none'"]);
  assert.deepEqual(d["base-uri"], ["'self'"]);
  assert.deepEqual(d["form-action"], ["'none'"]);
  for (const [nome, valores] of Object.entries(d)) {
    for (const proibida of FONTES_PROIBIDAS) {
      assert.ok(!valores.includes(proibida), `${nome} não pode conter ${proibida}`);
    }
  }
});

test("CSP só autoriza scripts próprios e terceiros aprovados", () => {
  const d = diretivas(Object.values(csps)[0]);
  for (const [nome, valores] of Object.entries(d)) {
    const externos = valores.filter((v) => /^https?:\/\//.test(v));
    assert.deepEqual(externos, TERCEIROS_PERMITIDOS[nome] ?? [], `${nome}: terceiros não aprovados ${externos.join(", ")}`);
  }
  const scriptSrc = d["script-src"].filter((v) => !v.startsWith("'sha256-"));
  assert.deepEqual(scriptSrc, ["'self'"]);
});

test("cada <script>/<style> inline está autorizado por hash na CSP", () => {
  for (const pagina of PAGINAS) {
    const html = lerPagina(pagina);
    const d = diretivas(cspDaPagina(html));
    const { scripts, estilos } = blocosInline(html);
    for (const s of scripts) {
      const h = hashCsp(s);
      assert.ok(d["script-src"].includes(h), `${pagina}: script inline sem hash na CSP; acrescentar ${h} a script-src`);
    }
    for (const s of estilos) {
      const h = hashCsp(s);
      assert.ok(d["style-src"].includes(h), `${pagina}: <style> inline sem hash na CSP; acrescentar ${h} a style-src`);
    }
  }
});

test("sem handlers inline (onclick=…) nem URLs javascript:", () => {
  for (const pagina of PAGINAS) {
    const html = lerPagina(pagina);
    assert.doesNotMatch(html, /<[^>]*\son[a-z]+\s*=/i, `${pagina}: handler inline`);
    assert.doesNotMatch(html, /(href|src)\s*=\s*["']\s*javascript:/i, `${pagina}: URL javascript:`);
  }
});

test("ligações com target=_blank usam rel=noopener", () => {
  for (const pagina of PAGINAS) {
    for (const [tag] of lerPagina(pagina).matchAll(/<a\b[^>]*target="_blank"[^>]*>/gi)) {
      assert.match(tag, /rel="[^"]*noopener/i, `${pagina}: ${tag}`);
    }
  }
});

test("_headers (Netlify) define os cabeçalhos de segurança", () => {
  const linhas = ler("_headers").split("\n");
  const inicio = linhas.findIndex((l) => l.trim() === "/*");
  assert.ok(inicio >= 0, "_headers precisa de uma regra /*");
  const cabecalhos = {};
  for (const linha of linhas.slice(inicio + 1)) {
    if (!/^\s+\S/.test(linha)) break;
    const [nome, ...valor] = linha.trim().split(":");
    cabecalhos[nome.toLowerCase()] = valor.join(":").trim();
  }
  const maxAge = Number(cabecalhos["strict-transport-security"]?.match(/max-age=(\d+)/)?.[1]);
  assert.ok(maxAge >= 31536000, "HSTS com max-age de pelo menos um ano");
  assert.equal(cabecalhos["x-content-type-options"], "nosniff");
  assert.match(cabecalhos["x-frame-options"] ?? "", /^(DENY|SAMEORIGIN)$/);
  assert.match(cabecalhos["content-security-policy"] ?? "", /frame-ancestors '(self|none)'/);
  assert.equal(cabecalhos["referrer-policy"], "strict-origin-when-cross-origin");
  for (const recurso of ["camera", "microphone", "geolocation", "payment"]) {
    assert.match(cabecalhos["permissions-policy"] ?? "", new RegExp(`${recurso}=\\(\\)`));
  }
  assert.equal(cabecalhos["cross-origin-opener-policy"], "same-origin");
});
