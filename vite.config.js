import { defineConfig } from "vite";

/** Servidor de desenvolvimento — o deploy continua a ser ficheiros estáticos na raiz. */
export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
});
