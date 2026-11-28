/* Reading and changing applications and bookings for the admin.
   The original submissions are never modified. The admin's own things are kept apart in the
   "admin-notes" store:  meta/<id> (status, saved-on-computer date)  and  edits/<id> (corrected answers). */
import { HttpError } from "./http.mjs";
import { DELETE_AFTER_DAYS, STATUSES } from "./config.mjs";
import { store, getJSON, listKeys } from "./store.mjs";

const ID = /^[0-9TZ:.\-]{10,40}-[0-9a-f]{8}$/;
export const checkId = (id) => { if (!ID.test(String(id))) throw new HttpError(404, "Not found."); return id; };
export const checkFileId = (id) => { if (!/^[0-9a-f-]{36}$/i.test(String(id))) throw new HttpError(404, "Not found."); return id; };

// Answers the admin may correct (text only; files, date received and consents never change).
const TEXT_FIELDS = {
  lastName: 80, firstName: 80, middleName: 80, nickName: 40, birthDate: 10, gender: 20, civilStatus: 30, licenseNo: 40,
  citizenship: 60, houseNo: 60, street: 120, city: 80, province: 80, mobile: 40, homePhone: 40, email: 160, source: 60,
  tin: 30, position: 80, salesChannel: 40, focusProject: 20, manager: 80, director: 80, attainment: 60, course: 100,
  school: 120, yearGraduated: 20, schoolYears: 10
};
const CHECKS = ["privacy", "cor", "or", "prc", "dhsud", "nbi", "photo"];
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Turns what the admin page sends into a safe edits record. Throws 400 when it is not valid. */
export function readEdits(body) {
  const answers = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) {
    if (body.answers && k in body.answers) answers[k] = clean(body.answers[k], max);
  }
  if (answers.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(answers.birthDate)) throw new HttpError(400, "The date of birth is not valid (YYYY-MM-DD).");
  let history;
  if (Array.isArray(body.answers?.history)) {
    history = body.answers.history.slice(0, 3).map((r) => ({
      year: clean(r?.year, 10), company: clean(r?.company, 100), position: clean(r?.position, 100), address: clean(r?.address, 120)
    }));
  }
  const checklist = {};
  for (const k of CHECKS) if (typeof body.checklist?.[k] === "boolean") checklist[k] = body.checklist[k];
  return { answers: history ? { ...answers, history } : answers, photoRemoved: body.photoRemoved === true, checklist };
}

const notes = (context) => store("admin-notes", context);

async function readMany(keys, read, size = 20) {
  const out = [];
  for (let i = 0; i < keys.length; i += size) out.push(...(await Promise.all(keys.slice(i, i + size).map(read))));
  return out.filter(Boolean);
}

export async function listApplications(context) {
  const keys = await listKeys(store("applications", context));
  const rows = await readMany(keys, async (k) => {
    const a = await getJSON(store("applications", context), k);
    if (!a) return null;
    const m = (await getJSON(notes(context), `meta/${k}`)) || {};
    const e = await getJSON(notes(context), `edits/${k}`);
    const ans = { ...a, ...(e?.answers || {}) };
    return {
      id: k, receivedAt: a.receivedAt, name: `${ans.firstName} ${ans.lastName}`.trim(), email: ans.email, mobile: ans.mobile,
      focusProject: ans.focusProject, position: ans.position, manager: ans.manager, status: m.status || "New", edited: !!e, deleteAfter: m.deleteAfter || null,
      hasFiles: Object.keys(a.files || {}).filter((x) => x !== "signature").length
    };
  });
  return rows.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
}

export async function getApplication(id, context) {
  const application = await getJSON(store("applications", context), checkId(id));
  if (!application) throw new HttpError(404, "Application not found.");
  const files = {};
  for (const [kind, fid] of Object.entries(application.files || {})) {
    const f = await store("application-files", context).getMetadata(fid);
    files[kind] = f ? { id: fid, type: f.metadata?.type, size: f.metadata?.size } : null;
  }
  return {
    application, files,
    edits: await getJSON(notes(context), `edits/${id}`),
    meta: (await getJSON(notes(context), `meta/${id}`)) || { status: "New" }
  };
}

async function exists(id, context) {
  if (!(await store("applications", context).getMetadata(checkId(id)))) throw new HttpError(404, "Application not found.");
}

export async function saveEdits(id, body, user, context) {
  await exists(id, context);
  const prev = await getJSON(notes(context), `edits/${id}`);
  const e = readEdits(body);
  const log = [...(prev?.log || []), { by: user.id, at: new Date().toISOString() }].slice(-30);
  const next = { ...e, editedBy: user.id, editedAt: new Date().toISOString(), log };
  await notes(context).setJSON(`edits/${id}`, next);
  return next;
}

// Goes back to the original submission (the edits are removed; the original was never touched).
export async function clearEdits(id, context) {
  await exists(id, context);
  await notes(context).delete(`edits/${id}`);
}

async function updateMeta(kindStore, key, change) {
  const cur = (await getJSON(kindStore, key)) || { status: "New" };
  const next = change(cur);
  await kindStore.setJSON(key, next);
  return next;
}

export async function setApplicationStatus(id, status, user, context) {
  if (!STATUSES.includes(status)) throw new HttpError(400, "Invalid status.");
  await exists(id, context);
  return updateMeta(notes(context), `meta/${id}`, (m) => ({ ...m, status, statusBy: user.id, statusAt: new Date().toISOString() }));
}

/** The owner says she saved this application on her computer: it will be deleted in DELETE_AFTER_DAYS days. */
export async function setSavedOnComputer(id, saved, user, context) {
  await exists(id, context);
  return updateMeta(notes(context), `meta/${id}`, (m) => {
    const { deleteAfter, savedBy, savedAt, ...rest } = m;
    return saved
      ? { ...rest, savedBy: user.id, savedAt: new Date().toISOString(), deleteAfter: new Date(Date.now() + DELETE_AFTER_DAYS * 86400000).toISOString() }
      : rest;
  });
}

/** Deletes the application, its uploaded files and the admin's notes about it. */
export async function deleteApplication(id, context) {
  const a = await getJSON(store("applications", context), checkId(id));
  if (!a) return;
  for (const fid of Object.values(a.files || {})) await store("application-files", context).delete(fid);
  await store("applications", context).delete(id);
  await notes(context).delete(`edits/${id}`);
  await notes(context).delete(`meta/${id}`);
}

/** Deletes every application whose 3 days are over. Returns how many. */
export async function purgeDue(context) {
  let n = 0;
  for (const key of await listKeys(notes(context), "meta/")) {
    const m = await getJSON(notes(context), key);
    if (m?.deleteAfter && Date.parse(m.deleteAfter) <= Date.now()) {
      await deleteApplication(key.slice(5), context);
      await notes(context).delete(key);
      n++;
    }
  }
  return n;
}

export async function getFile(fid, context) {
  const r = await store("application-files", context).getWithMetadata(checkFileId(fid), { type: "arrayBuffer" });
  if (!r) throw new HttpError(404, "File not found.");
  return r;
}

// ---- Bookings
/** Every booking, complete (the admin shows one booking as one card), newest first. */
export async function listBookings(context) {
  const keys = await listKeys(store("bookings", context));
  const rows = await readMany(keys, async (k) => {
    const b = await getJSON(store("bookings", context), k);
    if (!b) return null;
    const m = (await getJSON(notes(context), `bmeta/${k}`)) || {};
    return { ...b, id: k, status: m.status || "New" };
  });
  return rows.sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
}

export async function getBooking(id, context) {
  const booking = await getJSON(store("bookings", context), checkId(id));
  if (!booking) throw new HttpError(404, "Booking not found.");
  return { booking, meta: (await getJSON(notes(context), `bmeta/${id}`)) || { status: "New" } };
}

export async function setBookingStatus(id, status, user, context) {
  if (!STATUSES.includes(status)) throw new HttpError(400, "Invalid status.");
  if (!(await store("bookings", context).getMetadata(checkId(id)))) throw new HttpError(404, "Booking not found.");
  return updateMeta(notes(context), `bmeta/${id}`, (m) => ({ ...m, status, statusBy: user.id, statusAt: new Date().toISOString() }));
}

/** A booking the staff wrote in by hand. It lands in the same store as the ones from the public form, as a new record. */
export async function createBooking(booking, user, context) {
  const receivedAt = new Date().toISOString();
  const id = `${receivedAt}-${crypto.randomUUID().slice(0, 8)}`;
  await store("bookings", context).setJSON(id, { id, receivedAt, ...booking, addedBy: user.id });
  return id;
}

/** Deletes one booking and the admin's notes about it. */
export async function deleteBooking(id, context) {
  checkId(id);
  await store("bookings", context).delete(id);
  await notes(context).delete(`bmeta/${id}`);
}

/** What the dashboard needs, and nothing personal: dates, statuses and who it belongs to. Safe for every signed-in role. */
export async function dashboardStats(context) {
  const [apps, books] = await Promise.all([listApplications(context), listBookings(context)]);
  return {
    applications: apps.map((a) => ({ receivedAt: a.receivedAt, status: a.status, owner: a.manager || "" })),
    bookings: books.map((b) => ({ receivedAt: b.receivedAt, status: b.status, owner: b.sellerName || "" }))
  };
}
