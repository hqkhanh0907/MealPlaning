const { mergeSnapshots, normalize } = require("./snapshot.js");
const HISTORY_REVISIONS = 32;

function read(app, ownerId, metadataOnly = false) {
  const rows = arrayOf(new DynamicModel({ revision: 0, snapshot: "" }));
  const query = metadataOnly ? "SELECT revision" : "SELECT revision, snapshot";
  app.db().newQuery(query + " FROM mealplan_workspaces WHERE owner = {:owner}")
    .bind({ owner: ownerId }).all(rows);
  const record = rows[0];
  return {
    revision: record?.revision ?? 0,
    snapshot: record && !metadataOnly ? normalize(JSON.parse(record.snapshot)) : null,
  };
}

function storedSnapshot(app, ownerId, revision) {
  const rows = arrayOf(new DynamicModel({ snapshot: "" }));
  const lookup = revision === undefined
    ? "SELECT snapshot FROM mealplan_workspaces WHERE owner = {:owner}"
    : "SELECT snapshot FROM mealplan_workspace_history WHERE owner = {:owner} AND revision = {:revision}";
  app.db().newQuery(lookup).bind({ owner: ownerId, ...(revision === undefined ? {} : { revision }) }).all(rows);
  return rows[0]?.snapshot;
}

function remember(app, ownerId, revision, snapshot) {
  app.db().newQuery("INSERT INTO mealplan_workspace_history (owner, revision, snapshot) VALUES ({:owner}, {:revision}, {:snapshot})")
    .bind({ owner: ownerId, revision, snapshot }).execute();
  app.db().newQuery("DELETE FROM mealplan_workspace_history WHERE owner = {:owner} AND revision <= {:oldest}")
    .bind({ owner: ownerId, oldest: revision - HISTORY_REVISIONS }).execute();
}

function reply(revision, operationId, merged) {
  return merged ? { revision, operationId, merged: true } : { revision, operationId };
}

function write(app, ownerId, body) {
  const { operationId, baseRevision } = body;
  const mergeIndependent = body.mergeIndependent === true;
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
  const hashInput = mergeIndependent ? [baseRevision, snapshot, true] : [baseRevision, snapshot];
  const requestHash = $security.sha256(JSON.stringify(hashInput));
  const receipts = arrayOf(new DynamicModel({ request_hash: "", revision: 0, merged: 0 }));
  let response;
  app.runInTransaction((tx) => {
    tx.db().newQuery("SELECT request_hash, revision, merged FROM mealplan_receipts WHERE owner = {:owner} AND operation = {:operation}")
      .bind({ owner: ownerId, operation: operationId }).all(receipts);
    const [receipt] = receipts;
    if (receipt) {
      if (receipt.request_hash !== requestHash) {
        // Pre-upgrade receipts used the previous workout totals when hashing otherwise identical data.
        const oldHash = mergeIndependent ? null
          : $security.sha256(JSON.stringify([baseRevision, normalize(body.snapshot, true)]));
        if (receipt.request_hash !== oldHash) throw new ApiError(409, "Operation content changed.");
      }
      response = reply(receipt.revision, operationId, receipt.merged === 1);
      return;
    }
    const [existing] = tx.findRecordsByFilter("mealplan_workspaces", "owner = {:owner}", "", 1, 0, { owner: ownerId });
    const revision = existing ? existing.getInt("revision") : 0;
    const merged = revision !== baseRevision;
    const current = existing ? storedSnapshot(tx, ownerId) : null;
    if (merged) {
      if (!mergeIndependent || baseRevision > revision) throw new ApiError(409, "Data changed on another device.");
      const base = baseRevision === 0 ? null : storedSnapshot(tx, ownerId, baseRevision);
      if (baseRevision > 0 && !base) throw new ApiError(409, "Data changed on another device.");
      try {
        snapshot = mergeSnapshots(base ? JSON.parse(base) : null, snapshot, JSON.parse(current));
      } catch {
        throw new ApiError(409, "Data changed on another device.");
      }
    }
    if (existing) remember(tx, ownerId, revision, current);
    const record = existing || new Record(tx.findCollectionByNameOrId("mealplan_workspaces"));
    record.set("owner", ownerId);
    record.set("revision", revision + 1);
    record.set("snapshot", snapshot);
    tx.save(record);
    tx.db().newQuery(
      "INSERT INTO mealplan_receipts (owner, operation, request_hash, revision, merged) VALUES ({:owner}, {:operation}, {:request_hash}, {:revision}, {:merged})",
    ).bind({ owner: ownerId, operation: operationId, request_hash: requestHash, revision: revision + 1, merged: merged ? 1 : 0 }).execute();
    response = reply(revision + 1, operationId, merged);
  });
  $app.logger().info("mealplan sync", "owner", ownerId, "requestId", operationId, "revision", response.revision);
  return response;
}

module.exports = { read, write };
