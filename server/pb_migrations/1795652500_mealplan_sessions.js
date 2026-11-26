migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.add(new BoolField({ name: "mealplan_disabled" }));
  app.save(users);
  app.db().newQuery(`
    CREATE TABLE mealplan_sessions (
      digest TEXT PRIMARY KEY,
      owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL,
      revoked_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX idx_mealplan_sessions_expires ON mealplan_sessions (expires);
    CREATE TABLE mealplan_access (
      digest TEXT PRIMARY KEY,
      session TEXT NOT NULL REFERENCES mealplan_sessions(digest) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE INDEX idx_mealplan_access_session ON mealplan_access (session);
  `).execute();
}, (app) => {
  app.db().newQuery("DROP TABLE mealplan_access; DROP TABLE mealplan_sessions;").execute();
  const users = app.findCollectionByNameOrId("users");
  users.fields.removeByName("mealplan_disabled");
  app.save(users);
});
