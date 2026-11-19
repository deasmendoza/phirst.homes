// The private admin: /api/admin/*
//
//   auth:   GET auth/session · POST auth/login · POST auth/logout
//   data:   GET applications · GET applications/<id> · PUT applications/<id>/edits · DELETE applications/<id>/edits
//           PUT applications/<id>/status · PUT applications/<id>/saved · DELETE applications/<id>
//           GET files/<id>[?download=1]
//           GET bookings · GET bookings/<id> · PUT bookings/<id>/status
//
// Every data route checks the signed-in person first. Nothing here is public, cached or logged.
// People, roles and passwords: see netlify/lib/config.mjs and tools/phirst-password-tool.html.

import { HttpError, handle, json, readJson, requireSameOrigin, segments } from "../lib/http.mjs";
import { findUser, dataSpace } from "../lib/config.mjs";
import { verifyPassword } from "../lib/crypto.mjs";
import {
  clearCookie, clearFailures, isLocked, lockMinutesLeft, lockState, passwordHash, publicUser,
  recordFailure, requirePermission, requireUser, sessionCookie
} from "../lib/auth.mjs";
import * as data from "../lib/admin-data.mjs";

// Checked against when the username does not exist, so a wrong username takes as long as a wrong password.
const DUMMY = "pbkdf2-sha256$600000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const BAD_LOGIN = "Incorrect username or password.";

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

async function login(req, context) {
  const body = await readJson(req, 10000);
  const id = String(body.username || "").trim().toLowerCase();
  const user = findUser(id);
  const hash = user && passwordHash(id);
  if (!user || !hash) {
    await verifyPassword(String(body.password || ""), DUMMY);
    throw new HttpError(401, BAD_LOGIN);
  }
  const lock = await lockState(id, context);
  if (isLocked(lock)) throw new HttpError(429, `Too many incorrect attempts. Please try again in ${lockMinutesLeft(lock)} minutes.`);
  if (!(await verifyPassword(String(body.password || ""), hash))) {
    const after = await recordFailure(id, context);
    if (isLocked(after)) throw new HttpError(429, `Too many incorrect attempts. Please try again in ${lockMinutesLeft(after)} minutes.`);
    throw new HttpError(401, BAD_LOGIN);
  }
  await clearFailures(id, context);
  return json({ ok: true, user: publicUser(user), space: dataSpace(context) }, 200, { "Set-Cookie": sessionCookie(req, id, hash) });
}

export default handle(async (req, context) => {
  const seg = segments(req, "/api/admin") || [];
  const method = req.method;
  requireSameOrigin(req);

  // ---- sign-in
  if (seg[0] === "auth") {
    if (method === "POST" && seg[1] === "login") return login(req, context);
    if (method === "POST" && seg[1] === "logout") return json({ ok: true }, 200, { "Set-Cookie": clearCookie(req) });
    if (method === "GET" && seg[1] === "session") return json({ ok: true, user: publicUser(requireUser(req)), space: dataSpace(context) });
    throw new HttpError(404, "Not found.");
  }

  const user = requireUser(req);
  const [area, id, action] = seg;

  if (area === "applications") {
    requirePermission(user, "applications");
    if (method === "GET" && !id) return json({ ok: true, applications: await data.listApplications(context) });
    if (method === "GET" && id && !action) return json({ ok: true, ...(await data.getApplication(id, context)) });
    if (method === "PUT" && action === "edits") {
      requirePermission(user, "edit");
      return json({ ok: true, edits: await data.saveEdits(id, await readJson(req, 60000), user, context) });
    }
    if (method === "DELETE" && action === "edits") {
      requirePermission(user, "edit");
      await data.clearEdits(id, context);
      return json({ ok: true });
    }
    if (method === "PUT" && action === "status") {
      requirePermission(user, "edit");
      return json({ ok: true, meta: await data.setApplicationStatus(id, (await readJson(req, 2000)).status, user, context) });
    }
    if (method === "PUT" && action === "saved") {
      requirePermission(user, "edit");
      return json({ ok: true, meta: await data.setSavedOnComputer(id, (await readJson(req, 2000)).saved === true, user, context) });
    }
    if (method === "DELETE" && id && !action) {
      requirePermission(user, "remove");
      await data.deleteApplication(id, context);
      return json({ ok: true });
    }
  }

  if (area === "files" && method === "GET" && id) {
    requirePermission(user, "applications");
    const f = await data.getFile(id, context);
    const type = EXT[f.metadata?.type] ? f.metadata.type : "application/octet-stream";
    const kind = String(f.metadata?.kind || "file").replace(/[^a-z]/g, "");
    const dl = new URL(req.url).searchParams.get("download") === "1";
    return new Response(f.data, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${dl ? "attachment" : "inline"}; filename="${kind}-${id.slice(0, 8)}.${EXT[type] || "bin"}"`,
        "Cache-Control": "no-store, private",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow"
      }
    });
  }

  if (area === "bookings") {
    requirePermission(user, "bookings");
    if (method === "GET" && !id) return json({ ok: true, bookings: await data.listBookings(context) });
    if (method === "GET" && id && !action) return json({ ok: true, ...(await data.getBooking(id, context)) });
    if (method === "PUT" && action === "status") {
      requirePermission(user, "edit");
      return json({ ok: true, meta: await data.setBookingStatus(id, (await readJson(req, 2000)).status, user, context) });
    }
  }

  throw new HttpError(404, "Not found.");
});

export const config = { path: "/api/admin/*" };
