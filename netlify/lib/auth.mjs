/* Sign-in checks shared by every admin function. */
import { SESSION_HOURS, LOCKOUT, findUser, users } from "./config.mjs";
import { HttpError, getCookie } from "./http.mjs";
import { store, getJSON } from "./store.mjs";
import { passwordFingerprint, readSession, signSession } from "./crypto.mjs";

export const COOKIE = "phirst_admin";

export function sessionSecret() {
  const s = String(process.env.PHIRST_SESSION_SECRET || "");
  if (s.length < 32) throw new HttpError(503, "The admin is not set up yet (the session key is missing in Netlify).");
  return s;
}

// The stored password fingerprint of a person, from Netlify settings (PHIRST_PASSWORD_<USERNAME>).
export function passwordHash(userId) {
  const key = `PHIRST_PASSWORD_${userId.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
  const v = String(process.env[key] || "").trim();
  return v || null;
}

export async function lockState(userId, context) {
  return getJSON(store("admin-auth", context), `lock/${userId}`);
}
export const isLocked = (lock) => !!(lock && lock.until && Date.now() < lock.until);
export const lockMinutesLeft = (lock) => Math.max(1, Math.ceil((lock.until - Date.now()) / 60000));

export async function recordFailure(userId, context) {
  const st = store("admin-auth", context);
  const key = `lock/${userId}`;
  const cur = await getJSON(st, key);
  const windowMs = LOCKOUT.minutes * 60000;
  const recent = cur && !isLocked(cur) && Date.now() - (cur.last || 0) < windowMs;
  const fails = (recent ? cur.fails || 0 : 0) + 1;
  const next = { fails, last: Date.now(), until: fails >= LOCKOUT.maxFailures ? Date.now() + windowMs : 0 };
  if (next.until) next.fails = 0;
  await st.setJSON(key, next);
  return next;
}
export async function clearFailures(userId, context) {
  await store("admin-auth", context).delete(`lock/${userId}`);
}

// Localhost (testing on a computer) cannot use the Secure flag; the real site always does.
const secure = (req) => (["localhost", "127.0.0.1"].includes(new URL(req.url).hostname) ? "" : " Secure;");

export function sessionCookie(req, userId, hash) {
  const now = Date.now();
  const token = signSession({ u: userId, f: passwordFingerprint(hash), iat: now, exp: now + SESSION_HOURS * 3600000 }, sessionSecret());
  return `${COOKIE}=${token}; Path=/api/admin; HttpOnly;${secure(req)} SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}
export const clearCookie = (req) => `${COOKIE}=; Path=/api/admin; HttpOnly;${secure(req)} SameSite=Strict; Max-Age=0`;

// Returns the signed-in person, or throws 401. A changed password signs older sessions out.
export function requireUser(req) {
  const p = readSession(getCookie(req, COOKIE), sessionSecret());
  const user = p && findUser(p.u);
  if (!user) throw new HttpError(401, "Please sign in.");
  const hash = passwordHash(user.id);
  if (!hash || passwordFingerprint(hash) !== p.f) throw new HttpError(401, "Your password was changed. Please sign in again.");
  return user;
}

export function requirePermission(user, what) {
  if (!user.permissions[what]) throw new HttpError(403, "You do not have access to this yet.");
}

export const publicUser = (u) => ({ id: u.id, name: u.name, role: u.role, permissions: u.permissions });
export const knownUsers = users;
