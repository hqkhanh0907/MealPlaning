migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  users.createRule = '@request.auth.id = ""';
  app.save(users);

  const operators = new Collection({
    type: "auth",
    name: "mealplan_operators",
    authRule: "",
    listRule: null,
    viewRule: null,
    createRule: null,
    updateRule: null,
    deleteRule: null,
    manageRule: null,
  });
  operators.passwordAuth.enabled = true;
  operators.passwordAuth.identityFields = ["email"];
  operators.authToken.duration = 3600;
  app.save(operators);

  app.db().newQuery(`
    CREATE TABLE mealplan_operations (
      code TEXT PRIMARY KEY CHECK (code IN ('upload', 'download', 'conflict', 'invalid_request', 'unavailable')),
      count INTEGER NOT NULL CHECK (count > 0),
      last_seen_at TEXT NOT NULL
    )
  `).execute();
}, (app) => {
  app.db().newQuery("DROP TABLE mealplan_operations").execute();
  app.delete(app.findCollectionByNameOrId("mealplan_operators"));
  const users = app.findCollectionByNameOrId("users");
  users.createRule = "";
  app.save(users);
});
