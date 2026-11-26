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
  const operations = require(__hooks + "/operations.js");
  const metadata = event.request.url.query().get("metadata") === "1";
  const result = operations.observe(event.app, () => api.read(event.app, event.auth.id, metadata));
  if (!metadata) operations.record(event.app, "download");
  return event.json(200, result);
}, workspaceAccess);

routerAdd("POST", "/api/mealplan/workspace", (event) => {
  const api = require(__hooks + "/workspace.js");
  const operations = require(__hooks + "/operations.js");
  const result = operations.observe(event.app, () => api.write(event.app, event.auth.id, event.requestInfo().body));
  if (result.conflict) {
    operations.record(event.app, "conflict");
    return event.json(409, {
      message: "Data changed on another device.",
      data: { code: "workout_conflict", conflict: result.conflict },
    });
  }
  operations.record(event.app, "upload");
  return event.json(200, result);
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

routerAdd("GET", "/api/mealplan-ops/status", (event) => {
  if (event.auth.collection().name !== "mealplan_operators") throw new ForbiddenError();
  const operations = require(__hooks + "/operations.js");
  event.response.header().set("Cache-Control", "no-store");
  return event.json(200, operations.status(event.app, $os.getenv("MEALPLAN_RELEASE")));
}, $apis.requireAuth("mealplan_operators"));
