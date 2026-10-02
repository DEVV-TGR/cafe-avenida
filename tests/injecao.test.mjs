/**
 * XSS e validação de entrada: conteúdo de menu.json / config.js / i18n e parâmetros do URL.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { elementoFalso, executar, ler } from "./ajudantes.mjs";

const ATAQUE_TAG = `"><img src=x onerror=alert(1)>`;
const ATAQUE_ATRIBUTO = `x" autofocus onfocus="alert(1)`;
const ATAQUE_TAG_ESCAPADO = "&quot;&gt;&lt;img src=x onerror=alert(1)&gt;";

/** Desenha a ementa com um menu.json à escolha e devolve o HTML gerado. */
async function desenharEmenta(menu) {
  const nav = elementoFalso("nav");
  const seccoes = elementoFalso("div");
  const elementos = { "[data-menu-nav]": nav, "[data-menu-sections]": seccoes };
  executar(["js/imagens.js", "js/ementa.js"], {
    document: {
      readyState: "complete",
      documentElement: elementoFalso("html"),
      querySelector: (seletor) => elementos[seletor] ?? null,
      querySelectorAll: () => [],
      createElement: elementoFalso,
    },
    location: { hash: "" },
    CAFE_CONFIG: { colors: {}, phone: "", phoneDisplay: "" },
    CafeI18n: { getLang: () => "pt", t: (chave) => chave, init() {} },
    CafeSeo: { applyPageMeta() {} },
    fetch: async () => ({ ok: true, json: async () => menu }),
    addEventListener() {},
    matchMedia: () => ({ matches: true }),
    requestAnimationFrame: (fn) => fn(),
  });
  await new Promise((resolve) => setImmediate(resolve));
  return seccoes.children.map((seccao) => seccao.innerHTML).join("\n");
}

test("ementa: texto malicioso em menu.json é escapado antes de entrar em innerHTML", async () => {
  const texto = { pt: ATAQUE_TAG };
  const html = await desenharEmenta({
    categories: [
      {
        id: ATAQUE_TAG,
        name: texto,
        note: texto,
        figures: [ATAQUE_ATRIBUTO],
        items: [
          {
            id: ATAQUE_TAG,
            name: texto,
            description: texto,
            price: 1,
            tags: [ATAQUE_TAG],
            allergens: { pt: ATAQUE_ATRIBUTO },
          },
        ],
      },
      {
        id: "sub",
        name: { pt: "Sub" },
        subcategories: [
          {
            id: ATAQUE_TAG,
            name: texto,
            note: texto,
            figures: [ATAQUE_TAG],
            items: [{ id: "tamanhos", name: texto, prices: [{ size: ATAQUE_TAG, value: 2 }] }],
          },
        ],
      },
    ],
  });
  assert.match(html, /menu-item/, "a ementa devia ter sido desenhada");
  assert.ok(!html.includes("<img src=x"), "tag <img> injetada chegou ao HTML");
  assert.ok(!html.includes('" onfocus="'), "atributo injetado saiu das aspas");
  assert.ok(html.includes(ATAQUE_TAG_ESCAPADO), "o texto devia aparecer escapado");
});

test("ementa: o menu.json real continua a desenhar todos os itens", async () => {
  const menu = JSON.parse(ler("menu.json"));
  const total = menu.categories.reduce(
    (soma, c) => soma + (c.items?.length ?? 0) + (c.subcategories ?? []).reduce((s, sub) => s + sub.items.length, 0),
    0
  );
  const html = await desenharEmenta(menu);
  assert.equal(html.match(/<article class="menu-item"/g)?.length, total);
  assert.ok(html.includes("Francesinhas &amp; cachorros"), "& literal é mostrado como &");
});

test("horário: nomes e horas são inseridos como texto, nunca como HTML", () => {
  const lista = elementoFalso("ul");
  const tabela = elementoFalso("tbody");
  const elementos = { "[data-hours-list]": lista, "[data-hours-body]": tabela };
  const contexto = executar(["js/hours.js"], { document: { createElement: elementoFalso } });
  const horario = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, { open: ATAQUE_TAG, close: "10:00" }]));
  contexto.CafeHours.renderHoursPanel({ querySelector: (s) => elementos[s] ?? null }, horario, {
    t: () => ATAQUE_TAG,
    dayNames: () => Array(7).fill(ATAQUE_TAG),
  });
  for (const linha of [...lista.children, ...tabela.children]) {
    assert.equal(linha.innerHTML, "", "não pode haver innerHTML nas linhas do horário");
    assert.equal(linha.children[0].textContent, ATAQUE_TAG);
  }
  assert.equal(lista.children.length, 7);
  assert.equal(tabela.children.length, 7);
});

test("?lang= só aceita idiomas suportados", () => {
  const casos = [
    ["?lang=<script>alert(1)</script>", "pt"],
    ["?lang=javascript:alert(1)", "pt"],
    ["?lang=__proto__", "pt"],
    ["?lang=EN-gb", "en"],
    ["?lang=fr%22%3E%3Csvg%3E", "fr"],
  ];
  for (const [pesquisa, esperado] of casos) {
    const contexto = executar(["js/i18n.js"], {
      location: { search: pesquisa, href: `https://exemplo.invalid/${pesquisa}` },
      localStorage: { getItem: () => null, setItem() {} },
      navigator: { languages: ["de-DE"] },
      URLSearchParams,
    });
    assert.equal(contexto.CafeI18n.getLang(), esperado, pesquisa);
  }
});

test("idioma guardado no localStorage também é validado", () => {
  const contexto = executar(["js/i18n.js"], {
    location: { search: "", href: "https://exemplo.invalid/" },
    localStorage: { getItem: () => "<img src=x onerror=alert(1)>", setItem() {} },
    navigator: { languages: ["de-DE"] },
    URLSearchParams,
  });
  assert.equal(contexto.CafeI18n.getLang(), "pt");
});

test("idioma pelo endereço: /en e /fr; o resto fica em português", () => {
  const casos = [
    ["/", "pt"],
    ["/ementa", "pt"],
    ["/en", "en"],
    ["/en/ementa", "en"],
    ["/fr/ementa", "fr"],
    ["/de/ementa", "pt"],
    ["/%3Cscript%3E/ementa", "pt"],
    ["/__proto__", "pt"],
  ];
  for (const [caminho, esperado] of casos) {
    const contexto = executar(["js/i18n.js"], {
      location: { pathname: caminho, search: "", hash: "", href: `https://exemplo.invalid${caminho}` },
      localStorage: { getItem: () => null, setItem() {} },
      URLSearchParams,
    });
    assert.equal(contexto.CafeI18n.getLang(), esperado, caminho);
  }
});

test("endereços por idioma: pathFor monta /, /ementa, /en, /en/ementa…", () => {
  const caminhos = { "/en/ementa": ["/en", "/en/ementa"], "/ementa": ["/", "/ementa"], "/fr": ["/fr", "/fr/ementa"] };
  for (const [caminho, [inicio, ementa]] of Object.entries(caminhos)) {
    const contexto = executar(["js/i18n.js"], {
      location: { pathname: caminho, search: "", hash: "", href: `https://exemplo.invalid${caminho}` },
      localStorage: { getItem: () => null, setItem() {} },
      URLSearchParams,
    });
    assert.equal(contexto.CafeI18n.pathFor("/"), inicio, `${caminho}: início`);
    assert.equal(contexto.CafeI18n.pathFor("/ementa"), ementa, `${caminho}: ementa`);
  }
});
