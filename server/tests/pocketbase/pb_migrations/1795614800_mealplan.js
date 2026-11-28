migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.fields.getByName("email").required = false;
  users.fields.add(new TextField({
    name: "username", required: true, min: 3, max: 32, pattern: "^[a-z0-9_]+$",
  }));
  users.passwordAuth.enabled = true;
  users.passwordAuth.identityFields = ["username"];
  users.authToken.duration = 3600;
  users.oauth2.enabled = false;
  users.otp.enabled = false;
  users.listRule = null;
  users.viewRule = null;
  users.createRule = "";
  users.updateRule = null;
  users.deleteRule = null;
  users.addIndex("idx_mealplan_username", true, "username", "");
  app.save(users);

  const workspaces = new Collection({
    name: "mealplan_workspaces",
    fields: [
      { type: "relation", name: "owner", collectionId: users.id, required: true, cascadeDelete: true },
      { type: "number", name: "revision", required: true, onlyInt: true, min: 1 },
      { type: "json", name: "snapshot", required: true, maxSize: 4_000_000 },
    ],
  });
  workspaces.addIndex("idx_mealplan_workspace_owner", true, "owner", "");
  app.save(workspaces);

  app.db().newQuery(`
    CREATE TABLE mealplan_receipts (
      owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      operation TEXT NOT NULL,
      request_hash TEXT NOT NULL,
      revision INTEGER NOT NULL,
      PRIMARY KEY (owner, operation)
    );
    CREATE TABLE mealplan_revoked (
      digest TEXT PRIMARY KEY,
      expires INTEGER NOT NULL
    );
  `).execute();
}, (app) => {
  app.db().newQuery("DROP TABLE mealplan_revoked; DROP TABLE mealplan_receipts;").execute();
  app.delete(app.findCollectionByNameOrId("mealplan_workspaces"));
  const users = app.findCollectionByNameOrId("users");
  users.passwordAuth.identityFields = ["email"];
  users.fields.getByName("email").required = true;
  users.removeIndex("idx_mealplan_username");
  users.fields.removeByName("username");
  users.createRule = null;
  app.save(users);
});
