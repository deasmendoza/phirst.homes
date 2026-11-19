import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Connect, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On Netlify, /api/inventory is a serverless function. This serves the same function
// from `npm run dev` and `npm run preview`, so the calculator has real units when the
// site is viewed without Netlify.
function localInventory(): Plugin {
  const handle: Connect.NextHandleFunction = async (req, res, next) => {
    // Bookings, applications and uploaded files are only saved on Netlify. Locally they are
    // checked the same way, then dropped.
    const form = req.url && req.method === 'POST' ? /^\/api\/(bookings|applications|application-files)(\?.*)?$/.exec(req.url) : null;
    if (form) {
      const chunks: Buffer[] = [];
      for await (const c of req) chunks.push(c as Buffer);
      const raw = Buffer.concat(chunks);
      let result: { error?: string; id?: string };
      try {
        if (form[1] === 'application-files') {
          // @ts-expect-error plain JavaScript module without type declarations
          const { checkFile } = await import('./netlify/functions/application-files.mjs');
          const kind = new URL(req.url!, 'http://local').searchParams.get('kind') ?? '';
          result = checkFile(new Uint8Array(raw), kind);
          if (!result.error) result = { id: `local-${Date.now()}` };
        } else if (form[1] === 'bookings') {
          // @ts-expect-error plain JavaScript module without type declarations
          result = (await import('./netlify/functions/bookings.mjs')).readBooking(JSON.parse(raw.toString('utf8')));
        } else {
          // @ts-expect-error plain JavaScript module without type declarations
          result = (await import('./netlify/functions/applications.mjs')).readApplication(JSON.parse(raw.toString('utf8')));
        }
      } catch {
        result = { error: 'The form could not be read.' };
      }
      res.statusCode = result.error ? 422 : 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(result.error ? { error: result.error } : { ok: true, local: true, id: result.id }));
      return;
    }
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
