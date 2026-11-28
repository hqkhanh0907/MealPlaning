migrate((app) => {
  app.db().newQuery(`
    ALTER TABLE mealplan_receipts ADD COLUMN merged INTEGER NOT NULL DEFAULT 0;
    CREATE TABLE mealplan_workspace_history (
      owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      revision INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      PRIMARY KEY (owner, revision)
    );
  `).execute();
}, (app) => {
  app.db().newQuery(`
    DROP TABLE mealplan_workspace_history;
    ALTER TABLE mealplan_receipts DROP COLUMN merged;
  `).execute();
});
