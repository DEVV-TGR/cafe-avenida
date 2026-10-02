/**
 * Versões leves das imagens (geradas por scripts/otimizar-imagens.mjs, lista em js/imagens-lista.js).
 * Sem versões para uma imagem, devolve o original: o site continua a funcionar.
 */
(function () {
  /** "images/ementa/../x.jpg" → "images/x.jpg", como no script que gera a lista. */
  function normalize(src) {
    const parts = [];
    String(src || "").split("/").forEach((part) => {
      if (part === "..") parts.pop();
      else if (part && part !== ".") parts.push(part);
    });
    return parts.join("/");
  }

  function list(src) {
    return window.CAFE_IMAGENS?.[normalize(src)] || [];
  }

  /** Atributo srcset ("… 480w, … 960w") ou "" se não houver versões. */
  function srcset(src) {
    return list(src).map(([width, file]) => `${file} ${width}w`).join(", ");
  }

  /** Versão mais pequena com pelo menos `width` px (ou a maior que existir). */
  function best(src, width = Infinity) {
    const options = list(src);
    if (!options.length) return src;
    return (options.find(([w]) => w >= width) || options.at(-1))[1];
  }

  /** Aplica src + srcset + sizes a um <img>. */
  function apply(img, src, sizes) {
    const set = srcset(src);
    if (set) {
      img.srcset = set;
      img.sizes = sizes;
    } else {
      img.removeAttribute("srcset");
    }
    img.src = best(src, 960);
  }

  window.CafeImagens = { srcset, best, apply };
})();
