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

function retireLoginToken(app, token, now, expires) {
  app.db().newQuery("DELETE FROM mealplan_revoked WHERE expires <= {:now}").bind({ now }).execute();
  app.db().newQuery(`
    INSERT INTO mealplan_revoked (digest, expires) VALUES ({:digest}, {:expires})
    ON CONFLICT(digest) DO NOTHING
  `).bind({ digest: $security.sha256(token), expires }).execute();
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
  const rows = arrayOf(new DynamicModel({ digest: "", owner: "", session_expires: 0, revoked_at: 0, access_expires: 0 }));
  app.db().newQuery(`
    SELECT user_session.digest, user_session.owner, user_session.expires AS session_expires, user_session.revoked_at,
           access.expires AS access_expires
    FROM mealplan_access AS access
    JOIN mealplan_sessions AS user_session ON user_session.digest = access.session
    WHERE access.digest = {:digest}
  `).bind({ digest: $security.sha256(token) }).all(rows);
  return rows[0];
}

function requireModernAccess(app, token, now) {
  const access = findAccess(app, token);
  if (!access) requireAccess();
  requireSession(access, now);
  if (access.access_expires <= now) {
    throw new SessionFailure(401, "access_expired", "The access token has expired.");
  }
  return access;
}

function authorize(event) {
  const token = bearer(event);
  const now = timestamp();
  if (!token.startsWith("mpa_")) {
    if (event.auth) requireUser(event.auth);
    requireAccess();
  }
  const access = requireModernAccess(event.app, token, now);
  event.auth = requireUser(event.app.findRecordById("users", access.owner));
  return event.next();
}

function issueAccess(app, digest, user, expires) {
  const accessToken = "mpa_" + $security.randomString(64);
  app.db().newQuery("INSERT INTO mealplan_access (digest, session, expires) VALUES ({:digest}, {:session}, {:expires})")
    .bind({ digest: $security.sha256(accessToken), session: digest, expires }).execute();
  return { accessToken, ...userFields(user), accessExpiresAt: new Date(expires * 1000).toISOString() };
}

function cleanDeviceLabel(value) {
  return typeof value === "string"
    ? Array.from(value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).slice(0, 60).join("")
    : "";
}

function authenticatePassword(app, username, password) {
  if (typeof username === "string" && typeof password === "string" &&
      username.length <= 128 && password.length <= 256) {
    const [user] = app.findRecordsByFilter("users", "username = {:username}", "", 1, 0,
      { username: username.trim().toLowerCase() });
    if (user && user.validatePassword(password)) return requireUser(user);
  }
  throw new SessionFailure(400, "invalid_credentials", "The username or password is incorrect.");
}

function exchange(event) {
  const token = bearer(event);
  const now = timestamp();
  const body = event.requestInfo().body;
  const passwordSignIn = body.username !== undefined || body.password !== undefined;
  if (!passwordSignIn && (!event.auth || !token)) requireAccess();
  const user = passwordSignIn
    ? authenticatePassword(event.app, body.username, body.password)
    : requireUser(event.auth);
  const sessionToken = "mps_" + $security.randomString(64);
  const digest = $security.sha256(sessionToken);
  const deviceLabel = cleanDeviceLabel(body.deviceLabel);
  let access;
  event.app.runInTransaction((tx) => {
    if (!passwordSignIn) {
      checkLegacy(tx, token, now);
      retireLoginToken(tx, token, now, now + user.collection().authToken.duration);
    }
    tx.db().newQuery("DELETE FROM mealplan_sessions WHERE expires <= {:end}")
      .bind({ end: now - SESSION_GRACE_SECONDS }).execute();
    tx.db().newQuery("INSERT INTO mealplan_sessions (digest, owner, expires) VALUES ({:digest}, {:owner}, {:expires})")
      .bind({ digest, owner: user.id, expires: now + SESSION_SECONDS }).execute();
    tx.db().newQuery("INSERT INTO mealplan_session_metadata (session, created_at, device_label) VALUES ({:digest}, {:now}, {:deviceLabel})")
      .bind({ digest, now, deviceLabel }).execute();
    access = issueAccess(tx, digest, user, now + ACCESS_SECONDS);
  });
  return event.json(200, { ...access, sessionToken });
}

function listDevices(event) {
  const now = timestamp();
  const token = bearer(event);
  let devices;
  event.app.runInTransaction((tx) => {
    const caller = requireModernAccess(tx, token, now);
    requireUser(tx.findRecordById("users", caller.owner));
    const rows = arrayOf(new DynamicModel({ id: "", label: "", created_at: 0, expires: 0, current_session: 0 }));
    tx.db().newQuery(`
      SELECT metadata.public_id AS id, metadata.device_label AS label, metadata.created_at,
             session.expires, session.digest = {:current} AS current_session
      FROM mealplan_sessions AS session
      JOIN mealplan_session_metadata AS metadata ON metadata.session = session.digest
      WHERE session.owner = {:owner} AND session.revoked_at = 0 AND session.expires > {:now}
      ORDER BY current_session DESC, metadata.created_at DESC, metadata.public_id
    `).bind({ current: caller.digest, owner: caller.owner, now }).all(rows);
    devices = rows.map((row) => ({
      id: row.id, label: row.label,
      createdAt: new Date(row.created_at * 1000).toISOString(),
      expiresAt: new Date(row.expires * 1000).toISOString(),
      current: row.current_session === 1,
    }));
  });
  return event.json(200, { devices });
}

function revokeDevice(event) {
  const now = timestamp();
  const token = bearer(event);
  const id = event.requestInfo().body.id;
  event.app.runInTransaction((tx) => {
    const caller = requireModernAccess(tx, token, now);
    requireUser(tx.findRecordById("users", caller.owner));
    const rows = arrayOf(new DynamicModel({ digest: "" }));
    if (typeof id === "string") {
      tx.db().newQuery(`
        SELECT session.digest
        FROM mealplan_sessions AS session
        JOIN mealplan_session_metadata AS metadata ON metadata.session = session.digest
        WHERE metadata.public_id = {:id} AND session.owner = {:owner}
      `).bind({ id, owner: caller.owner }).all(rows);
    }
    if (!rows.length) throw new SessionFailure(404, "session_not_found", "The device session was not found.");
    if (rows[0].digest === caller.digest) {
      throw new SessionFailure(409, "current_session", "Use sign out to close this session.");
    }
    tx.db().newQuery(`
      UPDATE mealplan_sessions SET revoked_at = {:now}
      WHERE digest = {:digest} AND owner = {:owner} AND revoked_at = 0
    `).bind({ now, digest: rows[0].digest, owner: caller.owner }).execute();
  });
  return event.noContent(204);
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
    const user = requireUser(event.auth);
    event.app.runInTransaction((tx) =>
      retireLoginToken(tx, accessToken, now, now + user.collection().authToken.duration));
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

module.exports = { authorize, exchange, listDevices, logout, nameOf, refresh, respond, revokeDevice, updateName, userFields };
