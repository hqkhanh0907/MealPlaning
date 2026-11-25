onRecordCreateRequest((event) => {
  const body = event.requestInfo().body;
  if (Object.keys(body).some((key) => !["username", "password", "passwordConfirm"].includes(key))) {
    throw new BadRequestError("Invalid signup fields.");
  }
  event.next();
}, "users");

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
  return event.json(200, api.read($app, api.owner(event)));
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/mealplan/workspace", (event) => {
  const api = require(__hooks + "/workspace.js");
  return event.json(200, api.write($app, api.owner(event), event.requestInfo().body));
}, $apis.requireAuth("users"));

routerAdd("POST", "/api/mealplan/logout", (event) => {
  const api = require(__hooks + "/workspace.js");
  api.revoke($app, event);
  return event.noContent(204);
}, $apis.requireAuth("users"));

routerAdd("GET", "/api/mealplan-admin/workspaces", (event) => {
  const records = $app.findRecordsByFilter("mealplan_workspaces", "", "-revision", 100, 0);
  return event.json(200, records.map((record) => ({
    ownerId: record.getString("owner"),
    username: $app.findRecordById("users", record.getString("owner")).getString("username"),
    revision: record.getInt("revision"),
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
