import { defineConfig } from 'vite';

// GitHub Pages 部署在 https://<user>.github.io/<repo>/ 子路径下，需设置 base
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  server: {
    port: 5173,
    open: true,
  },
});
