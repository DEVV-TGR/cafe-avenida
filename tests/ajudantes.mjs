/**
 * Utilitários dos testes de segurança (só módulos nativos do Node, sem dependências).
 */
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

export const ler = (caminho) => readFileSync(join(RAIZ, caminho), "utf8");

/** HTML sem comentários, como o browser o interpreta. */
export const lerPagina = (pagina) => ler(pagina).replace(/<!--[\s\S]*?-->/g, "");

/** Páginas publicadas na raiz do site. */
export const PAGINAS = readdirSync(RAIZ).filter((f) => f.endsWith(".html")).sort();

export function cspDaPagina(html) {
  return html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i)?.[1] ?? null;
}

/** "a b; c d" → { a: ["b"], c: ["d"] } */
export function diretivas(csp) {
  return Object.fromEntries(
    csp
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [nome, ...valores] = d.split(/\s+/);
        return [nome.toLowerCase(), valores];
      })
  );
}

/** Fonte CSP para um bloco inline: 'sha256-…' sobre o texto exato entre as tags. */
export function hashCsp(conteudo) {
  return `'sha256-${createHash("sha256").update(conteudo, "utf8").digest("base64")}'`;
}

export function blocosInline(html) {
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((m) => !/type="application\/ld\+json"/i.test(m[1]))
    .map((m) => m[2]);
  const estilos = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  return { scripts, estilos };
}

/** Elemento DOM mínimo: guarda innerHTML/textContent como texto, sem interpretar HTML. */
export function elementoFalso(tag = "div") {
  return {
    tagName: tag.toUpperCase(),
    children: [],
    attributes: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    style: { setProperty() {} },
    innerHTML: "",
    textContent: "",
    setAttribute(nome, valor) {
      this.attributes[nome] = String(valor);
    },
    removeAttribute(nome) {
      delete this.attributes[nome];
    },
    appendChild(filho) {
      this.children.push(filho);
      return filho;
    },
    append(...filhos) {
      this.children.push(...filhos);
    },
    addEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
}

/** Corre scripts do site num contexto isolado, com `window` igual ao objeto global. */
export function executar(ficheiros, globais = {}) {
  const contexto = vm.createContext({ ...globais });
  contexto.window = contexto;
  for (const ficheiro of ficheiros) {
    vm.runInContext(ler(ficheiro), contexto, { filename: ficheiro });
  }
  return contexto;
}
