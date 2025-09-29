-- Magic link authentication and reservation tables
CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  type TEXT NOT NULL,
  context TEXT DEFAULT '{}' NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash
  ON auth_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_email_type
  ON auth_tokens(email, type);

ALTER TABLE users
  ADD COLUMN email_verified_at INTEGER;

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reservation_data TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  verification_pending INTEGER DEFAULT 1,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  created_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL,
  updated_at INTEGER DEFAULT (strftime('%s','now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservations_user_id
  ON reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON reservations(status);
