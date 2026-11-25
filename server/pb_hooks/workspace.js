const { normalize } = require("./snapshot.js");

function bearer(event) {
  return event.request.header.get("Authorization").replace(/^Bearer\s+/i, "");
}

function owner(event) {
  const result = arrayOf(new DynamicModel({ digest: "" }));
  $app.db().newQuery("SELECT digest FROM mealplan_revoked WHERE digest = {:digest}")
    .bind({ digest: $security.sha256(bearer(event)) }).all(result);
  if (result.length) throw new UnauthorizedError("Sign in again.");
  return event.auth.id;
}

function revoke(app, event) {
  owner(event);
  const now = Math.floor(Date.now() / 1000);
  app.runInTransaction((tx) => {
    tx.db().newQuery("DELETE FROM mealplan_revoked WHERE expires <= {:now}").bind({ now }).execute();
    tx.db().newQuery("INSERT INTO mealplan_revoked (digest, expires) VALUES ({:digest}, {:expires})")
      .bind({ digest: $security.sha256(bearer(event)), expires: now + 3600 }).execute();
  });
}

function read(app, ownerId) {
  const [record] = app.findRecordsByFilter("mealplan_workspaces", "owner = {:owner}", "", 1, 0, { owner: ownerId });
  return record
    ? { revision: record.getInt("revision"), snapshot: record.get("snapshot") }
    : { revision: 0, snapshot: null };
}

function write(app, ownerId, body) {
  const { operationId, baseRevision } = body;
  if (typeof operationId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId) ||
      !Number.isSafeInteger(baseRevision) || baseRevision < 0) {
    throw new BadRequestError("Invalid synchronization request.");
  }
  let snapshot;
  try {
    snapshot = normalize(body.snapshot);
  } catch (error) {
    throw new BadRequestError(error.message);
  }
  const requestHash = $security.sha256(JSON.stringify([baseRevision, snapshot]));
  const receipts = arrayOf(new DynamicModel({ request_hash: "", revision: 0 }));
  let response;
  app.runInTransaction((tx) => {
    tx.db().newQuery("SELECT request_hash, revision FROM mealplan_receipts WHERE owner = {:owner} AND operation = {:operation}")
      .bind({ owner: ownerId, operation: operationId }).all(receipts);
    const [receipt] = receipts;
    if (receipt) {
      if (receipt.request_hash !== requestHash) throw new ApiError(409, "Operation content changed.");
      response = { revision: receipt.revision, operationId };
      return;
    }
    const [existing] = tx.findRecordsByFilter("mealplan_workspaces", "owner = {:owner}", "", 1, 0, { owner: ownerId });
    const revision = existing ? existing.getInt("revision") : 0;
    if (revision !== baseRevision) throw new ApiError(409, "Data changed on another device.");
    const record = existing || new Record(tx.findCollectionByNameOrId("mealplan_workspaces"));
    record.set("owner", ownerId);
    record.set("revision", revision + 1);
    record.set("snapshot", snapshot);
    tx.save(record);
    tx.db().newQuery(
      "INSERT INTO mealplan_receipts (owner, operation, request_hash, revision) VALUES ({:owner}, {:operation}, {:request_hash}, {:revision})",
    ).bind({ owner: ownerId, operation: operationId, request_hash: requestHash, revision: revision + 1 }).execute();
    response = { revision: revision + 1, operationId };
  });
  $app.logger().info("mealplan sync", "owner", ownerId, "requestId", operationId, "revision", response.revision);
  return response;
}

module.exports = { owner, read, revoke, write };
