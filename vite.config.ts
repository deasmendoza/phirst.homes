import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On Netlify, /api/inventory is a serverless function. This serves the same function
// from `npm run dev` and `npm run preview`, so the calculator has real units when the
// site is viewed without Netlify.
function localInventory(): Plugin {
  const handle: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url || !/^\/api\/inventory(\?|$)/.test(req.url)) return next();
    try {
      // @ts-expect-error plain JavaScript module without type declarations
      const { default: handler } = await import('./netlify/functions/inventory.mjs');
      const response: Response = await handler();
      res.statusCode = response.status;
      res.setHeader('content-type', response.headers.get('content-type') ?? 'application/json');
      res.end(await response.text());
    } catch (err) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: String(err) }));
    }
  };
  return {
    name: 'local-inventory',
    configureServer: (server) => void server.middlewares.use(handle),
    configurePreviewServer: (server) => void server.middlewares.use(handle),
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localInventory()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
});
