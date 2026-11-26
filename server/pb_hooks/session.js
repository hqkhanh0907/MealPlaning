const ACCESS_SECONDS = 3600;
const SESSION_SECONDS = 90 * 24 * 3600;
const SESSION_GRACE_SECONDS = 7 * 24 * 3600;

class SessionFailure extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function timestamp() {
  return Math.floor(Date.now() / 1000);
}

function bearer(event) {
  return event.request.header.get("Authorization").replace(/^Bearer\s+/i, "");
}

function requireAccess() {
  throw new SessionFailure(401, "access_required", "Sign in again.");
}

function requireSession(session, now) {
  if (!session || session.revoked_at) {
    throw new SessionFailure(401, "session_revoked", "The session has been revoked.");
  }
  if (session.session_expires <= now) {
    throw new SessionFailure(401, "session_expired", "The session has expired.");
  }
  return session;
}

function requireUser(user) {
  if (!user || user.collection().name !== "users" || user.getBool("mealplan_disabled")) {
    throw new SessionFailure(403, "account_forbidden", "The account cannot use MealPlaning.");
  }
  return user;
}

function respond(event, action) {
  try {
    return action();
  } catch (error) {
    if (!(error instanceof SessionFailure)) throw error;
    return event.json(error.status, { status: error.status, message: error.message, data: { code: error.code } });
  }
}

function nameOf(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || Array.from(name).length > 100) {
    throw new BadRequestError("Enter a name from 1 to 100 characters.", {
      name: new ValidationError("invalid_name", "Enter a name from 1 to 100 characters."),
    });
  }
  return name;
}

function userFields(user) {
  return { ownerId: user.id, username: user.getString("username"), name: user.getString("name") };
}

function checkLegacy(app, token, now) {
  const rows = arrayOf(new DynamicModel({ digest: "" }));
  app.db().newQuery("SELECT digest FROM mealplan_revoked WHERE digest = {:digest} AND expires > {:now}")
    .bind({ digest: $security.sha256(token), now }).all(rows);
  if (rows.length) throw new SessionFailure(401, "session_revoked", "The session has been revoked.");
}

function findSession(app, token) {
  if (!/^mps_[a-zA-Z0-9]{64}$/.test(token)) requireAccess();
  const rows = arrayOf(new DynamicModel({ digest: "", owner: "", session_expires: 0, revoked_at: 0 }));
  app.db().newQuery("SELECT digest, owner, expires AS session_expires, revoked_at FROM mealplan_sessions WHERE digest = {:digest}")
    .bind({ digest: $security.sha256(token) }).all(rows);
  return rows[0];
}

function findAccess(app, token) {
  if (!/^mpa_[a-zA-Z0-9]{64}$/.test(token)) requireAccess();
  const rows = arrayOf(new DynamicModel({ owner: "", session_expires: 0, revoked_at: 0, access_expires: 0 }));
  app.db().newQuery(`
    SELECT user_session.owner, user_session.expires AS session_expires, user_session.revoked_at,
           access.expires AS access_expires
    FROM mealplan_access AS access
    JOIN mealplan_sessions AS user_session ON user_session.digest = access.session
    WHERE access.digest = {:digest}
  `).bind({ digest: $security.sha256(token) }).all(rows);
  return rows[0];
}

function authorize(event) {
  const token = bearer(event);
  const now = timestamp();
  if (token.startsWith("mpa_")) {
    const access = findAccess(event.app, token);
    if (!access) requireAccess();
    requireSession(access, now);
    if (access.access_expires <= now) {
      throw new SessionFailure(401, "access_expired", "The access token has expired.");
    }
    event.auth = requireUser(event.app.findRecordById("users", access.owner));
  } else {
    if (!event.auth || !token) requireAccess();
    requireUser(event.auth);
    checkLegacy(event.app, token, now);
  }
  return event.next();
}

function issueAccess(app, digest, user, expires) {
  const accessToken = "mpa_" + $security.randomString(64);
  app.db().newQuery("INSERT INTO mealplan_access (digest, session, expires) VALUES ({:digest}, {:session}, {:expires})")
    .bind({ digest: $security.sha256(accessToken), session: digest, expires }).execute();
  return { accessToken, ...userFields(user), accessExpiresAt: new Date(expires * 1000).toISOString() };
}

function exchange(event) {
  const token = bearer(event);
  const now = timestamp();
  if (!event.auth || !token) requireAccess();
  const user = requireUser(event.auth);
  const sessionToken = "mps_" + $security.randomString(64);
  const digest = $security.sha256(sessionToken);
  let access;
  event.app.runInTransaction((tx) => {
    checkLegacy(tx, token, now);
    tx.db().newQuery("DELETE FROM mealplan_sessions WHERE expires <= {:end}")
      .bind({ end: now - SESSION_GRACE_SECONDS }).execute();
    tx.db().newQuery("INSERT INTO mealplan_sessions (digest, owner, expires) VALUES ({:digest}, {:owner}, {:expires})")
      .bind({ digest, owner: user.id, expires: now + SESSION_SECONDS }).execute();
    access = issueAccess(tx, digest, user, now + ACCESS_SECONDS);
  });
  return event.json(200, { ...access, sessionToken });
}

function refresh(event) {
  const token = event.requestInfo().body.sessionToken;
  if (typeof token !== "string") requireAccess();
  const now = timestamp();
  let access;
  event.app.runInTransaction((tx) => {
    const session = requireSession(findSession(tx, token), now);
    const user = requireUser(tx.findRecordById("users", session.owner));
    access = issueAccess(tx, session.digest, user, Math.min(now + ACCESS_SECONDS, session.session_expires));
  });
  return event.json(200, access);
}

function logout(event) {
  const token = event.requestInfo().body.sessionToken;
  const now = timestamp();
  if (typeof token === "string" && /^mps_[a-zA-Z0-9]{64}$/.test(token)) {
    event.app.db().newQuery("UPDATE mealplan_sessions SET revoked_at = {:now} WHERE digest = {:digest} AND revoked_at = 0")
      .bind({ now, digest: $security.sha256(token) }).execute();
  } else {
    const accessToken = bearer(event);
    if (!event.auth || !accessToken) requireAccess();
    requireUser(event.auth);
    event.app.runInTransaction((tx) => {
      tx.db().newQuery("DELETE FROM mealplan_revoked WHERE expires <= {:now}").bind({ now }).execute();
      tx.db().newQuery(`
        INSERT INTO mealplan_revoked (digest, expires) VALUES ({:digest}, {:expires})
        ON CONFLICT(digest) DO NOTHING
      `).bind({ digest: $security.sha256(accessToken), expires: now + ACCESS_SECONDS }).execute();
    });
  }
  return event.noContent(204);
}

function updateName(event) {
  const name = nameOf(event.requestInfo().body.name);
  const user = event.app.findRecordById("users", event.auth.id);
  user.set("name", name);
  event.app.save(user);
  return event.json(200, userFields(user));
}

module.exports = { authorize, exchange, logout, nameOf, refresh, respond, updateName, userFields };
