/* Password hashing and session signing for the PHirst admin.
   Passwords are stored only as PBKDF2-SHA256 fingerprints:  pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
   The offline password tool (tools/phirst-password-tool.html) produces exactly this format in the browser. */
import crypto from "node:crypto";

const ITERATIONS = 600000;
const KEYLEN = 32;

function pbkdf2(password, salt, iterations) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(String(password), salt, iterations, KEYLEN, "sha256", (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2-sha256$${ITERATIONS}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function parseHash(stored) {
  const parts = String(stored || "").trim().split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return null;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 5000000) return null;
  const salt = Buffer.from(parts[2], "base64");
  const hash = Buffer.from(parts[3], "base64");
  if (salt.length < 16 || hash.length !== KEYLEN) return null;
  return { iterations, salt, hash };
}

export async function verifyPassword(password, stored) {
  const p = parseHash(stored);
  if (!p) return false;
  const test = await pbkdf2(password, p.salt, p.iterations);
  return crypto.timingSafeEqual(test, p.hash);
}

// A short fingerprint of the current password record. Changing the password changes it,
// which automatically signs out every older session for that person.
export function passwordFingerprint(stored) {
  return crypto.createHash("sha256").update(String(stored || "")).digest("base64url").slice(0, 16);
}

const b64u = (buf) => Buffer.from(buf).toString("base64url");

export function signSession(payload, secret) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token, secret) {
  if (!token || typeof token !== "string" || token.length > 1000) return null;
  const i = token.indexOf(".");
  if (i < 1) return null;
  const body = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1), "base64url");
  const expect = crypto.createHmac("sha256", secret).update(body).digest();
  if (sig.length !== expect.length || !crypto.timingSafeEqual(sig, expect)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!p || typeof p !== "object" || typeof p.u !== "string" || typeof p.exp !== "number") return null;
    if (Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

export const newId = () => crypto.randomBytes(12).toString("base64url");
