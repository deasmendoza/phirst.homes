// Runs once a day (production only: Netlify runs scheduled functions on the published site).
// Deletes every application that the owner marked "saved on my computer" more than 3 days ago,
// together with its uploaded files. Nothing else is touched, and nothing is logged about applicants.

import { purgeDue } from "../lib/admin-data.mjs";

export default async function handler() {
  try {
    const n = await purgeDue({ deploy: { context: "production" } });
    console.log(`admin-purge: ${n} application(s) deleted`);
  } catch (err) {
    console.error("admin-purge failed", err && err.name);
  }
}

export const config = { schedule: "@daily" };
