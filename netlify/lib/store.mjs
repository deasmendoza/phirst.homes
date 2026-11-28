/* Access to Netlify Blobs for the admin, in one place. Store names match the public functions
   (bookings-<space>, applications-<space>, application-files-<space>); the admin's own notes
   (status, edits, lock-outs) live in separate stores so the original submissions are never changed. */
import { getStore } from "@netlify/blobs";
import { dataSpace } from "./config.mjs";

let factory = (name) => getStore({ name, consistency: "strong" });
// Used only by the local test server (tools/admin-dev-server.mjs), which has no Netlify Blobs.
export function _setStoreFactory(fn) { factory = fn; }

// kind: bookings | applications | application-files | admin-auth | admin-notes
export function store(kind, context) {
  return factory(`${kind}-${dataSpace(context)}`);
}

export async function getJSON(st, key) {
  const r = await st.getWithMetadata(key, { type: "json" });
  return r ? r.data : null;
}

export async function listKeys(st, prefix = "") {
  const out = [];
  for await (const page of st.list({ prefix, paginate: true })) for (const b of page.blobs) out.push(b.key);
  return out;
}
