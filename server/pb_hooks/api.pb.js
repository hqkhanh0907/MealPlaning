onRecordCreateRequest((event) => {
  const session = require(__hooks + "/session.js");
  const body = event.requestInfo().body;
  if (Object.keys(body).some((key) => !["username", "password", "passwordConfirm", "name"].includes(key))) {
    throw new BadRequestError("Invalid signup fields.");
  }
  event.record.set("name", session.nameOf(body.name));
  event.next();
}, "users");

const workspaceAccess = new Middleware((event) => {
  const session = require(__hooks + "/session.js");
  return session.respond(event, () => session.authorize(event));
}, -1019, "mealplanWorkspaceAccess");

routerAdd("GET", "/health", (event) => {
  const result = new DynamicModel({ alive: 0 });
  $app.db().newQuery("SELECT 1 AS alive").one(result);
  const requestId = $security.randomString(24);
  const release = $os.getenv("MEALPLAN_RELEASE") || "local";
  $app.logger().info("mealplan health", "requestId", requestId, "release", release);
  return event.json(200, { service: "mealplaning", release, requestId, database: result.alive === 1 });
});

routerAdd("GET", "/api/mealplan/workspace", (event) => {
  const api = require(__hooks + "/workspace.js");
  const metadata = event.request.url.query().get("metadata") === "1";
  return event.json(200, api.read(event.app, event.auth.id, metadata));
}, workspaceAccess);

routerAdd("POST", "/api/mealplan/workspace", (event) => {
  const api = require(__hooks + "/workspace.js");
  return event.json(200, api.write(event.app, event.auth.id, event.requestInfo().body));
}, workspaceAccess);

routerAdd("POST", "/api/mealplan/session", (event) => {
  const session = require(__hooks + "/session.js");
  return session.respond(event, () => session.exchange(event));
});

routerAdd("POST", "/api/mealplan/session/refresh", (event) => {
  const session = require(__hooks + "/session.js");
  return session.respond(event, () => session.refresh(event));
});

routerAdd("POST", "/api/mealplan/profile", (event) => {
  const session = require(__hooks + "/session.js");
  return session.updateName(event);
}, workspaceAccess);

routerAdd("POST", "/api/mealplan/logout", (event) => {
  const session = require(__hooks + "/session.js");
  return session.respond(event, () => session.logout(event));
}, (event) => {
  if (typeof event.requestInfo().body.sessionToken === "string") {
    event.request.header.del("Authorization");
  }
  return event.next();
});

routerAdd("GET", "/api/mealplan-admin/workspaces", (event) => {
  const entries = arrayOf(new DynamicModel({ id: "", username: "", name: "", revision: 0 }));
  event.app.db().newQuery(`
    SELECT users.id, users.username, users.name, COALESCE(workspaces.revision, 0) AS revision
    FROM users
    LEFT JOIN mealplan_workspaces AS workspaces ON workspaces.owner = users.id
    ORDER BY users.name, users.username, users.id
  `).all(entries);
  return event.json(200, entries.map((entry) => ({
    id: entry.id, ownerId: entry.id, username: entry.username, name: entry.name, revision: entry.revision,
  })));
}, $apis.requireSuperuserAuth());

routerAdd("GET", "/api/mealplan-admin/workspaces/{owner}", (event) => {
  const api = require(__hooks + "/workspace.js");
  return event.json(200, api.read($app, event.request.pathValue("owner")));
}, $apis.requireSuperuserAuth());

routerAdd("POST", "/api/mealplan-admin/workspaces/{owner}", (event) => {
  const api = require(__hooks + "/workspace.js");
  return event.json(200, api.write($app, event.request.pathValue("owner"), event.requestInfo().body));
}, $apis.requireSuperuserAuth());
