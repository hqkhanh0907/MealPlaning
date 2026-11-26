const failureCodes = ["conflict", "invalid_request", "unavailable"];

function record(app, code) {
  try {
    app.db().newQuery(`
      INSERT INTO mealplan_operations (code, count, last_seen_at)
      VALUES ({:code}, 1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      ON CONFLICT(code) DO UPDATE SET count = count + 1, last_seen_at = excluded.last_seen_at
    `).bind({ code }).execute();
  } catch {
    app.logger().warn("mealplan operations metrics unavailable");
  }
}

function observe(app, operation) {
  try {
    return operation();
  } catch (error) {
    const code = error?.status === 409 ? "conflict"
      : error?.status === 400 ? "invalid_request" : "unavailable";
    record(app, code);
    throw error;
  }
}

function status(app, release) {
  const events = arrayOf(new DynamicModel({ code: "", count: 0, last_seen_at: "" }));
  app.db().newQuery("SELECT code, count, last_seen_at FROM mealplan_operations").all(events);
  const byCode = new Map(events.map((event) => [event.code, event]));
  return {
    services: { api: "available", database: "available" },
    release: /^[0-9a-f]{40}$/i.test(release) ? release.toLowerCase() : release ? "unknown" : "local",
    sync: {
      lastUploadAt: byCode.get("upload")?.last_seen_at ?? null,
      lastDownloadAt: byCode.get("download")?.last_seen_at ?? null,
    },
    syncFailures: failureCodes.map((code) => ({
      code, count: byCode.get(code)?.count ?? 0, lastSeenAt: byCode.get(code)?.last_seen_at ?? null,
    })),
  };
}

module.exports = { observe, record, status };
