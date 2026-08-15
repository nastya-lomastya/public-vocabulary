import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local or Vercel project env vars.");
}

export const sql = neon(process.env.DATABASE_URL);

let usersTableReady: Promise<unknown> | null = null;

// Called by anything that touches the users table (including ensureTable,
// since words.user_id references it). Cheap no-op after the first successful
// call within a warm function instance.
export function ensureUsersTable() {
  if (!usersTableReady) {
    usersTableReady = sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_iterations INT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;
  }
  return usersTableReady;
}

let tableReady: Promise<unknown> | null = null;

export function ensureTable() {
  if (!tableReady) {
    tableReady = ensureUsersTable().then(
      () => sql`
        CREATE TABLE IF NOT EXISTS words (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          tr TEXT NOT NULL,
          ru TEXT NOT NULL,
          added BIGINT NOT NULL,
          correct INT NOT NULL DEFAULT 0,
          wrong INT NOT NULL DEFAULT 0,
          transcription TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT ''
        )
      `
    ).then(() => sql`CREATE INDEX IF NOT EXISTS words_user_id_idx ON words(user_id)`);
  }
  return tableReady;
}

let streakTableReady: Promise<unknown> | null = null;

// One row per user per calendar day (client's local date), tracking active
// quiz seconds toward that day's streak goal.
export function ensureStreakTable() {
  if (!streakTableReady) {
    streakTableReady = ensureUsersTable().then(
      () => sql`
        CREATE TABLE IF NOT EXISTS streak_days (
          user_id TEXT NOT NULL REFERENCES users(id),
          day TEXT NOT NULL,
          seconds INT NOT NULL DEFAULT 0,
          PRIMARY KEY (user_id, day)
        )
      `
    );
  }
  return streakTableReady;
}
