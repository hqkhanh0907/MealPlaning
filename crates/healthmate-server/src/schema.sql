CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    mealplan_disabled INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE mealplan_operators (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
CREATE TABLE operator_access (
    digest TEXT PRIMARY KEY,
    operator_id TEXT NOT NULL REFERENCES mealplan_operators(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
);
CREATE TABLE login_tokens (
    digest TEXT PRIMARY KEY,
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL,
    consumed INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE mealplan_sessions (
    digest TEXT PRIMARY KEY,
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL,
    revoked_at INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX sessions_owner ON mealplan_sessions(owner,expires);
CREATE INDEX sessions_expiry ON mealplan_sessions(expires);
CREATE TABLE mealplan_session_metadata (
    session TEXT PRIMARY KEY REFERENCES mealplan_sessions(digest) ON DELETE CASCADE,
    public_id TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    device_label TEXT NOT NULL
);
CREATE TABLE mealplan_access (
    digest TEXT PRIMARY KEY,
    session TEXT NOT NULL REFERENCES mealplan_sessions(digest) ON DELETE CASCADE,
    expires INTEGER NOT NULL
);
CREATE INDEX access_session ON mealplan_access(session);
CREATE INDEX access_expiry ON mealplan_access(expires);
CREATE TABLE mealplan_workspaces (
    owner TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL,
    snapshot TEXT NOT NULL
);
CREATE TABLE mealplan_workspace_history (
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revision INTEGER NOT NULL,
    snapshot TEXT NOT NULL,
    PRIMARY KEY (owner,revision)
);
CREATE TABLE mealplan_receipts (
    owner TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    operation TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    revision INTEGER NOT NULL,
    merged INTEGER NOT NULL,
    PRIMARY KEY (owner,operation)
);
CREATE TABLE mealplan_operations (
    code TEXT PRIMARY KEY CHECK (code IN ('upload','download','conflict','invalid_request','unavailable')),
    count INTEGER NOT NULL,
    last_seen_at TEXT NOT NULL
);
