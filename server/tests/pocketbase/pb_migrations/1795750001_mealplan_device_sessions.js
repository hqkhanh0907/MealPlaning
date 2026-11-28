migrate((app) => {
  app.db().newQuery(`
    CREATE TABLE mealplan_session_metadata (
      session TEXT PRIMARY KEY REFERENCES mealplan_sessions(digest) ON DELETE CASCADE,
      public_id TEXT NOT NULL UNIQUE DEFAULT (
        lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) ||
        '-4' || substr(lower(hex(randomblob(2))), 2) ||
        '-' || substr('89ab', 1 + (random() & 3), 1) || substr(lower(hex(randomblob(2))), 2) ||
        '-' || lower(hex(randomblob(6)))
      ),
      created_at INTEGER NOT NULL,
      device_label TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX idx_mealplan_sessions_owner ON mealplan_sessions (owner, revoked_at, expires);
    INSERT INTO mealplan_session_metadata (session, created_at)
      SELECT digest, MAX(0, expires - 7776000) FROM mealplan_sessions;
  `).execute();
}, (app) => {
  app.db().newQuery("DROP TABLE mealplan_session_metadata; DROP INDEX idx_mealplan_sessions_owner;").execute();
});
