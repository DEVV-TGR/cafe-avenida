# Café Avenida

Site estático do **Café Avenida** (Alpendurada · Marco de Canaveses) — HTML, CSS e JavaScript vanilla, sem framework.

O conteúdo do estabelecimento vive em **`config.js`**, **`menu.json`** e **`images/`**. Serve para GitHub Pages ou Netlify sem passo de build.

**Local:** Av. Francisco Sá Carneiro 760, 4575-052 Alpendurada e Matos · **Tel.:** 255 619 414

---

## Funcionalidades

- Página principal com hero a ecrã inteiro, sobre nós, galeria, sugestões, opiniões Google, localização e ligação à ementa
- Ementa bilingue (PT/EN) com categorias comprimíveis, pensada para telemóvel e QR nas mesas
- Galeria com mosaico editorial no desktop, carrossel no telemóvel e lightbox
- Opiniões e classificação Google (atualizadas à mão em `config.js`)
- Horário com estado **Aberto agora** / **Fechado** (fuso `Europe/Lisbon`, incluindo fecho após meia-noite)
- Mapa ilustrado da zona (SVG gerado a partir do OpenStreetMap)
- Transições entre páginas, header em ilha e tipografia própria (Cormorant + Manrope)
- QR codes para a ementa (`qr/` + cartão imprimível)

---

## Começar

É preciso um servidor local (o browser bloqueia `fetch` do `menu.json` em `file://`).

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). O Vite só serve em desenvolvimento; em produção publica-se a pasta tal como está.

---

## Estrutura

```
├── index.html          # Página principal
├── ementa.html         # Ementa (telemóvel / QR)
├── qr-print.html       # Cartão imprimível com QR
├── config.js           # Nome, morada, horário, cores, media, reviews, domínio
├── menu.json           # Categorias e itens da ementa (pt/en)
├── i18n/               # Textos da interface (pt.js, en.js)
├── css/                # Estilos
├── js/                 # i18n, horário, mapa, galeria, ementa, SEO…
├── images/             # Fotos, vídeos e logo
├── mapa/               # SVG ilustrado da zona
├── scripts/            # QR codes e regeneração do mapa (Node)
└── qr/                 # QR gerados (SVG + PNG)
```

---

## Editar conteúdo

### Dados do café — `config.js`

Nome, logo, tagline, sobre nós, telefone, morada, coordenadas, horário, cores, domínio, redes sociais, hero, galeria, sugestões e críticas Google.

| Campo | Notas |
| --- | --- |
| `openingHours` | `0` = domingo … `6` = sábado; `null` = fechado; `closeNextDay: true` se fecha na madrugada |
| `domain` | URL pública sem barra final (QR + meta tags) |
| `email` | Email real do café; vazio esconde o contacto. Nunca usar endereços de exemplo (`exemplo.pt` é um domínio real que recebe correio) |
| `googleReviews` | `rating`, `count`, `placeId` — atualizar à mão |
| `media.gallery` | Fotos do espaço; alts em `pt` / `en` |

### Ementa — `menu.json`

1. Cada categoria tem `id`, `name.pt` / `name.en` e `items`.
2. Itens: `name`, `description`, `price`; opcionais `tags` (`vegetarian`, `glutenFree`) e `allergens` (`pt`/`en`).
3. A página `ementa.html` lê este ficheiro em tempo de execução.

### Interface — `i18n/`

Textos fixos da UI (botões, secções, acessibilidade) em `i18n/pt.js` e `i18n/en.js`.

### Imagens — `images/`

Substituir ficheiros ou apontar novos caminhos em `config.js`. Preferir JPG/WebP razoáveis para a web; o hero e a galeria usam lazy-load onde faz sentido.

---

## Idioma (PT / EN)

- Seletor no header (bandeira + código).
- Primeira visita: idioma do browser; fallback **PT**.
- Preferência guardada em `localStorage`.
- Forçar via URL: `?lang=pt` ou `?lang=en` (ex.: `ementa.html?lang=en`).

---

## Mapa ilustrado

```bash
cd scripts
npm install
npm run mapa
# se o Overpass falhar:
npm run mapa:cache
```

Saída em `mapa/alpendurada.svg`. A posição do pin ajusta-se em `config.js` → `map.pinPosition`.

---

## QR codes

1. Definir `domain` em `config.js`.
2. Gerar:

```bash
cd scripts
npm install
npm run generate-qr
# ou:
node generate-qr.mjs --domain https://oseudominio.pt
```

Ficheiros em `qr/` (`ementa`, `ementa-pt`, `ementa-en` em SVG/PNG). Para imprimir mesas: abrir `qr-print.html` no browser.

---

## Publicar

- **GitHub Pages:** Settings → Pages → branch `main`, pasta `/ (root)`.
- **Netlify / similar:** ligar o repositório ou arrastar a pasta; **sem comando de build**.
- **Vercel:** importar o repositório; o `vercel.json` já desliga o build do Vite e publica a raiz (e repete os cabeçalhos do `_headers`).

Antes de publicar, preencher em `config.js` o `domain`, email e links das redes sociais (ainda há placeholders de exemplo).

---

## Segurança

- **CSP:** cada página tem a mesma `<meta http-equiv="Content-Security-Policy">`. Não usar scripts inline nem `onclick=`: o código vai para `js/`. Ao alterar um `<style>` inline (ou o script do `<base>` no `404.html`), o hash na CSP tem de mudar — `npm test` indica o valor certo.
- **Cabeçalhos HTTP:** `_headers` aplica HSTS, proteção contra clickjacking, `nosniff`, Referrer-Policy e Permissions-Policy **só no Netlify**. O GitHub Pages não permite cabeçalhos próprios; aí só vale a CSP da `<meta>`.
- **Testes:** `npm test` (sem dependências) verifica CSP, cabeçalhos, escaping da ementa, segredos nos ficheiros publicados e terceiros. Corre também no GitHub Actions (`.github/workflows/seguranca.yml`) com `npm audit`.
- **Tudo o que está no repositório é público** (o repositório e o site): nunca guardar aqui chaves, palavras-passe ou dados pessoais.

---

## Reutilizar noutro café

1. Editar `config.js` (identidade, contactos, horário, media, reviews).
2. Substituir `menu.json` e as imagens.
3. Regenerar mapa e QR com o novo domínio.

---

## Créditos

Site desenvolvido para o Café Avenida · [DevPlus](https://github.com/adriano2212)


## Sugestões e idiomas

O site e a ementa têm traduções em português, inglês e francês (`i18n/`, `config.js` e `menu.json`).

Para acrescentar as fotografias das sugestões, editar `suggestions` em `config.js`:

- `category`: `sweet` (doce), `savory` (salgado) ou `drink` (bebida).
- `name` e `description`: textos com `pt`, `en` e `fr`.
- `image`: caminho da fotografia; `imagePosition`: enquadramento opcional.
- `featured: false`: só aparece no seletor “Não sabes o que escolher?”. Retirar esta propriedade para mostrar também nos cartões.
- `menuId`: identificador de um produto de `menu.json`, para ligar diretamente à ementa.

O seletor usa estas categorias automaticamente e evita repetir a última escolha quando existe mais de uma opção. Até chegarem as novas fotos, o Crepe Avenida e o cappuccino aparecem apenas no seletor, sem imagens inventadas.
