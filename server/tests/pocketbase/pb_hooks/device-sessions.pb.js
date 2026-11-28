routerAdd("GET", "/api/mealplan/sessions", (event) => {
  const sessions = require(__hooks + "/session.js");
  return sessions.respond(event, () => sessions.listDevices(event));
});

routerAdd("POST", "/api/mealplan/sessions/revoke", (event) => {
  const sessions = require(__hooks + "/session.js");
  return sessions.respond(event, () => sessions.revokeDevice(event));
});
