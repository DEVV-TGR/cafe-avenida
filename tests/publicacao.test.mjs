/**
 * O que vai para produção: o site é publicado tal como está no repositório (sem build),
 * por isso qualquer ficheiro versionado chega ao browser de quem visita.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PAGINAS, RAIZ, executar, ler, lerPagina } from "./ajudantes.mjs";

/** Padrões de credenciais conhecidos. Os relatórios mostram só ficheiro, linha e tipo, nunca o valor. */
const SEGREDOS = [
  ["chave privada", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["GitHub token", /\b(gh[pousr]_[0-9A-Za-z]{36}|github_pat_[0-9A-Za-z_]{22,})\b/],
  ["Slack token", /\bxox[abprs]-[0-9A-Za-z-]{10,}/],
  ["webhook Slack/Discord", /hooks\.slack\.com\/services\/|discord(app)?\.com\/api\/webhooks\//],
  ["Stripe live key", /\b[rs]k_live_[0-9A-Za-z]{16,}/],
  ["chave OpenAI/Anthropic", /\bsk-(ant-|proj-)?[0-9A-Za-z_-]{32,}/],
  ["JWT", /\beyJ[0-9A-Za-z_-]{10,}\.eyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}/],
  ["URL com credenciais", /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@"']+:[^/\s:@"']+@/i],
  ["atribuição de segredo", /\b(api[_-]?key|secret|token|password|passwd|senha)\b["']?\s*[:=]\s*["'][^"'\s]{12,}["']/i],
];

function ficheirosPublicados() {
  const saida = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: RAIZ });
  return saida.toString("utf8").split("\0").filter(Boolean);
}

test("nenhum ficheiro publicado contém credenciais", () => {
  const achados = [];
  for (const ficheiro of ficheirosPublicados()) {
    let conteudo;
    try {
      conteudo = readFileSync(join(RAIZ, ficheiro));
    } catch {
      continue; // apagado na árvore de trabalho
    }
    if (conteudo.includes(0)) continue; // binário (imagens, vídeo)
    conteudo
      .toString("utf8")
      .split("\n")
      .forEach((linha, i) => {
        for (const [tipo, padrao] of SEGREDOS) {
          if (padrao.test(linha)) achados.push(`${ficheiro}:${i + 1} (${tipo})`);
        }
      });
  }
  assert.deepEqual(achados, [], `Possíveis segredos — remover, revogar e rodar:\n${achados.join("\n")}`);
});

test("ficheiros de ambiente e chaves não são versionados", () => {
  const sensiveis = ficheirosPublicados().filter((f) => /(^|\/)\.env(\.|$)|\.(pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519)/i.test(f));
  assert.deepEqual(sensiveis.filter((f) => !f.endsWith(".env.example")), []);
  const ignorados = ler(".gitignore");
  for (const regra of [".env", "*.pem", "*.key"]) {
    assert.ok(ignorados.split("\n").includes(regra), `.gitignore devia incluir ${regra}`);
  }
});

test("config.js: contactos sem endereços de exemplo e ligações só por HTTPS", () => {
  const { CAFE_CONFIG: cfg } = executar(["config.js"]);
  const email = cfg.email?.trim();
  if (email) {
    assert.match(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email inválido");
    assert.doesNotMatch(email, /@(exemplo|example)\./i, "email de exemplo: esse domínio pode receber o correio");
  }
  for (const [rede, url] of Object.entries(cfg.social ?? {})) {
    assert.match(url, /^https:\/\//, `social.${rede} tem de usar https://`);
  }
  assert.match(cfg.domain, /^https:\/\//, "domain tem de usar https://");
});

test("páginas só carregam recursos externos de origens aprovadas", () => {
  const permitidos = new Set(); // tudo é servido pelo próprio site
  for (const pagina of PAGINAS) {
    const html = lerPagina(pagina);
    const recursos = [
      ...html.matchAll(/<(?:script|img|iframe|video|audio|source|embed)\b[^>]*\ssrc="(https?:[^"]+)"/gi),
      ...html.matchAll(/<link\b[^>]*rel="(?:stylesheet|preload|modulepreload|icon)"[^>]*href="(https?:[^"]+)"/gi),
      ...html.matchAll(/<link\b[^>]*href="(https?:[^"]+)"[^>]*rel="(?:stylesheet|preload|modulepreload|icon)"/gi),
    ].map((m) => new URL(m[1]).host);
    for (const host of recursos) {
      assert.ok(permitidos.has(host), `${pagina}: recurso de terceiro não aprovado (${host}); rever privacidade e CSP`);
    }
  }
});

test("o site continua sem formulários nem campos de palavra-passe", () => {
  for (const pagina of PAGINAS) {
    const html = lerPagina(pagina);
    assert.doesNotMatch(html, /<form\b/i, `${pagina}: formulário novo exige rever CSRF, abuso e privacidade`);
    assert.doesNotMatch(html, /type="password"/i, `${pagina}: campo de palavra-passe`);
  }
});

test("dependências: lockfiles presentes e sem scripts de instalação próprios", () => {
  for (const pasta of [".", "scripts"]) {
    const pacote = JSON.parse(ler(join(pasta, "package.json")));
    const lock = JSON.parse(ler(join(pasta, "package-lock.json")));
    assert.ok(lock.lockfileVersion >= 2, `${pasta}: lockfile antigo`);
    for (const gancho of ["preinstall", "install", "postinstall", "prepare"]) {
      assert.equal(pacote.scripts?.[gancho], undefined, `${pasta}/package.json: script ${gancho}`);
    }
  }
});
