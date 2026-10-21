// Creates the judge demo accounts and sample data. Safe to re-run.
// Needs these environment variables, set in PowerShell and never saved in this file:
//   SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_EMAIL_BASE, JUDGE_PASSWORD
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const { SUPABASE_URL, SUPABASE_SECRET_KEY, DEMO_EMAIL_BASE, JUDGE_PASSWORD } =
  process.env;

if (
  !SUPABASE_URL ||
  !SUPABASE_SECRET_KEY ||
  !DEMO_EMAIL_BASE ||
  !JUDGE_PASSWORD
) {
  console.error(
    "Missing environment variables. See the comment at the top of this file.",
  );
  process.exit(1);
}
if (JUDGE_PASSWORD.length < 8) {
  console.error("JUDGE_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// demo@gmail.com becomes demo+employer@gmail.com, demo+worker@gmail.com, and so on
const [localPart, domain] = DEMO_EMAIL_BASE.split("@");
const addr = (tag) => `${localPart}+${tag}@${domain}`;

// Demo area: Johannesburg CBD (also the app's fallback location)
const BASE = { lng: 28.0473, lat: -26.2041 };
const point = (dLng, dLat) =>
  `SRID=4326;POINT(${BASE.lng + dLng} ${BASE.lat + dLat})`;

async function getOrCreateUser(email, password) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { demo: true },
  });
  if (data?.user) return data.user;

  // Already exists: find it and reset its password
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;
  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!existing) throw error ?? new Error(`Could not create or find ${email}`);
  await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  return existing;
}

// at: [east-west offset, north-south offset] in degrees from the demo point (about 100 m per 0.001)
const workers = [
  { tag: "seed1", name: "Thabo M.", skill: "gardening", at: [0.003, 0.004] },
  { tag: "seed2", name: "Lerato K.", skill: "gardening", at: [0.008, -0.012] },
  { tag: "seed3", name: "Sipho D.", skill: "gardening", at: [-0.015, 0.02] },
  { tag: "seed4", name: "Nomsa P.", skill: "domestic", at: [-0.004, 0.006] },
  { tag: "seed5", name: "Zanele S.", skill: "domestic", at: [-0.012, -0.018] },
  { tag: "seed6", name: "Palesa M.", skill: "domestic", at: [0.02, 0.03] },
  {
    tag: "seed7",
    name: "Bongani N.",
    skill: "piece_work",
    at: [0.015, -0.008],
  },
  { tag: "seed8", name: "Kagiso T.", skill: "piece_work", at: [-0.02, 0.025] },
];

async function upsertWorker(userId, name, skill, at) {
  const { error } = await admin
    .from("workers")
    .upsert(
      { user_id: userId, name, skill, location: point(...at) },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

// Filler workers: real accounts nobody logs into (random passwords)
for (const w of workers) {
  const user = await getOrCreateUser(addr(w.tag), randomUUID() + randomUUID());
  await upsertWorker(user.id, w.name, w.skill, w.at);
}

// Judge worker account
const judgeWorker = await getOrCreateUser(addr("worker"), JUDGE_PASSWORD);
await upsertWorker(judgeWorker.id, "Demo Worker", "gardening", [0.002, -0.006]);

// Judge employer account, with two jobs already posted (the last one shows on Home)
const judgeEmployer = await getOrCreateUser(addr("employer"), JUDGE_PASSWORD);
const { error: clearError } = await admin
  .from("jobs")
  .delete()
  .eq("employer_id", judgeEmployer.id);
if (clearError) throw clearError;

const jobs = [
  { title: "Need the garden cleared this weekend", skill_needed: "gardening" },
  { title: "Weekly house cleaning", skill_needed: "domestic" },
];
for (const job of jobs) {
  const { error } = await admin
    .from("jobs")
    .insert({ employer_id: judgeEmployer.id, ...job, location: point(0, 0) });
  if (error) throw error;
}

console.log("Done.");
console.log(`Judge employer: ${addr("employer")}`);
console.log(`Judge worker:   ${addr("worker")}`);
console.log("Password: the value you set in JUDGE_PASSWORD");
