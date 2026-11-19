/* PHirst admin: who may sign in and what they may see.
   Usernames and roles are not secret. Passwords are NEVER here: they live in Netlify settings as
   PBKDF2 fingerprints (PHIRST_PASSWORD_<USERNAME>), made with tools/phirst-password-tool.html. */

// Default team. To change it without touching code, set PHIRST_USERS in Netlify:
//   PHIRST_USERS = username:role:Display Name, username:role:Display Name, ...
// roles: superadmin | admin | agent.  Up to 10 people.
const DEFAULT_USERS = "marielle:admin:Marielle,andrea:superadmin:Andrea,mike:agent:Mike";
export const MAX_USERS = 10;

// What each role may do. Agents see nothing yet: add permissions here when they are ready.
const ROLE_PERMISSIONS = {
  superadmin: { applications: true, bookings: true, edit: true, remove: true },
  admin: { applications: true, bookings: true, edit: true, remove: true },
  agent: { applications: false, bookings: false, edit: false, remove: false }
};

export function users() {
  const raw = String(process.env.PHIRST_USERS || "").trim() || DEFAULT_USERS;
  const out = [];
  for (const part of raw.split(",")) {
    const [u, role, ...name] = part.split(":").map((s) => s.trim());
    if (!/^[a-z0-9][a-z0-9._-]{0,29}$/.test(u || "") || !ROLE_PERMISSIONS[role]) continue;
    if (out.some((x) => x.id === u)) continue;
    out.push({ id: u, role, name: name.join(":") || u, permissions: ROLE_PERMISSIONS[role] });
  }
  return out.slice(0, MAX_USERS);
}
export const findUser = (id) => users().find((u) => u.id === id) || null;

export const SESSION_HOURS = 12;
export const LOCKOUT = { maxFailures: 5, minutes: 15 };

export const STATUSES = ["New", "Contacted", "Done"];
// After the owner marks an application as saved on her computer, it is deleted this many days later.
export const DELETE_AFTER_DAYS = 3;

/* Preview deploys and live keep their data apart, exactly like the public functions:
   "live" only on the production deploy, "preview" everywhere else (and when testing locally). */
export function dataSpace(context) {
  return context?.deploy?.context === "production" ? "live" : "preview";
}
