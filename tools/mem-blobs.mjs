/* In-memory stand-in for Netlify Blobs. Used only by tools/admin-dev-server.mjs for local testing. */
import crypto from "node:crypto";

const stores = new Map();
export function memStore(name) {
  if (!stores.has(name)) stores.set(name, new Map());
  const m = stores.get(name);
  const tick = () => new Promise((r) => setImmediate(r));
  const etag = () => crypto.randomBytes(6).toString("hex");
  const cond = (key, o = {}) => {
    const cur = m.get(key);
    if (o.onlyIfNew && cur) return false;
    if (o.onlyIfMatch && (!cur || cur.etag !== o.onlyIfMatch)) return false;
    return true;
  };
  const parse = (e, type) => {
    if (type === "json") return JSON.parse(e.data);
    if (type === "arrayBuffer") return e.bin.slice(0);
    return e.data;
  };
  return {
    async getWithMetadata(key, o = {}) { await tick(); const e = m.get(key); return e ? { data: parse(e, o.type), etag: e.etag, metadata: e.metadata || {} } : null; },
    async get(key, o = {}) { await tick(); const e = m.get(key); return e ? parse(e, o.type) : null; },
    async getMetadata(key) { await tick(); const e = m.get(key); return e ? { etag: e.etag, metadata: e.metadata || {} } : null; },
    async setJSON(key, v, o = {}) { await tick(); if (!cond(key, o)) return { modified: false }; const t = etag(); m.set(key, { data: JSON.stringify(v), etag: t, metadata: o.metadata }); return { modified: true, etag: t }; },
    async set(key, v, o = {}) { await tick(); if (!cond(key, o)) return { modified: false }; const t = etag(); const bin = v instanceof ArrayBuffer ? v.slice(0) : new TextEncoder().encode(String(v)).buffer; m.set(key, { bin, etag: t, metadata: o.metadata }); return { modified: true, etag: t }; },
    async delete(key) { await tick(); m.delete(key); },
    list(o = {}) {
      const keys = [...m.keys()].filter((k) => k.startsWith(o.prefix || "")).sort();
      const page = { blobs: keys.map((k) => ({ key: k, etag: m.get(k).etag })), directories: [] };
      if (o.paginate) return (async function* () { yield page; })();
      return Promise.resolve(page);
    }
  };
}
export function _stores() { return stores; }
