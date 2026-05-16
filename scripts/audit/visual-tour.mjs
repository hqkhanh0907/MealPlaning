#!/usr/bin/env node
/**
 * visual-tour.mjs — canonical 4-tab visual-QA tour, MD5-guarded.
 *
 * Why this exists (Learning Insight from K.15):
 *   - On a Capacitor (Ionic-WebView) app, `uiautomator dump` is opaque to the DOM.
 *     Tap-by-bounds derived from the dump silently misses, producing byte-identical
 *     consecutive screencaps. Two of six audit pairs (dashboard, management) in
 *     2026-05-16-loop1/ regressed this way.
 *   - The fix is NOT layout-math (workable but brittle if the tab layout changes);
 *     it's `scripts/qa-tap.mjs`, which reads the live DOM via Chrome DevTools Protocol
 *     over `adb forward`. CDP locates the element; `adb input tap` dispatches the real
 *     touch. No browser, no desktop viewport — the Goal Prompt's rule holds.
 *
 * What this script does:
 *   For each of the 4 tabs + a final back-to-dashboard step:
 *     1. Tap the tab via qa-tap.mjs (data-testid="tab-<name>").
 *     2. Wait 1200ms for the route to settle.
 *     3. `adb exec-out screencap -p > <outdir>/<NN>-<name>.png`.
 *     4. Compute MD5 of the new PNG and compare against the prior step's MD5.
 *     5. If MD5 matches the prior frame → the tap missed; re-attempt once,
 *        then mark the pair as `recapture-needed` in the JSON manifest.
 *     6. Also write `<outdir>/manifest.json` with {pair, md5, route, status}.
 *
 * Usage:
 *   node scripts/audit/visual-tour.mjs <outdir>
 *   # example: node scripts/audit/visual-tour.mjs docs/audit-screenshots/2026-05-16-loop2
 *
 * Exit codes:
 *   0  all 6 captures distinct and routes match expectation
 *   1  one or more captures duplicated (tap missed) after retry
 *   2  setup error (adb missing, app not running, qa-tap failed)
 */
import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ADB =
  process.env.ADB ||
  `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;
const SERIAL = process.env.ANDROID_SERIAL || "emulator-5554";
const QA_TAP = resolve(process.cwd(), "scripts/qa-tap.mjs");
const PKG = "com.healthmate.ai";
const ACTIVITY = `${PKG}/.MainActivity`;
const CDP_PORT = 9222;

/**
 * Bring the app to the foreground (idempotent) and wait for the WebView CDP
 * HTTP server to respond on /json/version. The socket file appearing in
 * /proc/net/unix is necessary but NOT sufficient — Chrome's CDP HTTP server
 * starts a beat later. Poll up to 12s.
 *
 * Learning insight (Turn 2): qa-tap.mjs's ensureForward() only waits for the
 * socket file, not the HTTP layer; result is "socket hang up" if you call it
 * within the first second after `am start`. Adding HTTP readiness here
 * removes that race for the whole tour.
 */
function ensureAppReady() {
  // Force foreground (idempotent).
  spawnSync(ADB, ["-s", SERIAL, "shell", "am", "start", "-n", ACTIVITY], {
    encoding: "utf8",
  });
  // Find current pid and webview socket; if pid changed, refresh forward.
  const sockets = spawnSync(ADB, ["-s", SERIAL, "shell", "cat", "/proc/net/unix"], {
    encoding: "utf8",
  }).stdout || "";
  const m = sockets
    .split("\n")
    .map((l) => l.match(/@(webview_devtools_remote_\d+)/))
    .find(Boolean);
  if (m) {
    spawnSync(ADB, ["-s", SERIAL, "forward", "--remove", `tcp:${CDP_PORT}`]);
    spawnSync(ADB, [
      "-s",
      SERIAL,
      "forward",
      `tcp:${CDP_PORT}`,
      `localabstract:${m[1]}`,
    ]);
  }
  // Poll HTTP up to 12s.
  for (let i = 0; i < 24; i++) {
    const r = spawnSync(
      "curl",
      [
        "-s",
        "--max-time",
        "1",
        "-H",
        "Host: localhost",
        `http://127.0.0.1:${CDP_PORT}/json/version`,
      ],
      { encoding: "utf8" }
    );
    if (r.status === 0 && r.stdout && r.stdout.includes("Browser")) return true;
    execSync("sleep 0.5");
  }
  return false;
}

const TOUR = [
  // step  pair-name              testid              expected-route-fragment
  ["00", "coldstart", null, null],
  ["02", "dashboard", "tab-dashboard", "/tabs/dashboard"],
  ["03", "calendar", "tab-calendar", "/tabs/calendar"],
  ["04", "management", "tab-management", "/tabs/management"],
  ["05", "fitness", "tab-fitness", "/tabs/fitness"],
  ["06", "back-dashboard", "tab-dashboard", "/tabs/dashboard"],
];

function md5(buf) {
  return createHash("md5").update(buf).digest("hex");
}

function shortHash(hex) {
  return hex.slice(0, 8);
}

function screencap(outPath) {
  // `exec-out` keeps the binary stream clean (no CRLF mangling).
  const r = spawnSync(ADB, ["-s", SERIAL, "exec-out", "screencap", "-p"], {
    maxBuffer: 16 * 1024 * 1024,
  });
  if (r.status !== 0) {
    throw new Error(`screencap failed: ${r.stderr?.toString() || "?"}`);
  }
  writeFileSync(outPath, r.stdout);
  return md5(r.stdout);
}

function tapTestId(testid) {
  const r = spawnSync(
    "node",
    [QA_TAP, "tap", `[data-testid="${testid}"]`],
    { encoding: "utf8" }
  );
  return { ok: r.status === 0, stdout: r.stdout, stderr: r.stderr };
}

function currentRoute() {
  const r = spawnSync("node", [QA_TAP, "route"], { encoding: "utf8" });
  return (r.stdout || "").trim();
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`);
}

async function main() {
  const outdir = process.argv[2];
  if (!outdir) {
    console.error(
      "Usage: visual-tour.mjs <outdir>\n" +
        "  example: visual-tour.mjs docs/audit-screenshots/2026-05-16-loop2"
    );
    process.exit(2);
  }
  if (!existsSync(outdir)) mkdirSync(outdir, { recursive: true });

  // Make sure the app is foreground and CDP HTTP is alive BEFORE the tour.
  if (!ensureAppReady()) {
    console.error(
      "[visual-tour] CDP HTTP did not become ready within 12s. " +
        "Check: app may have crashed, or WebView debug not enabled."
    );
    process.exit(2);
  }

  const manifest = [];
  let priorMd5 = null;
  let anyMissed = false;

  for (const [step, pair, testid, expectedRoute] of TOUR) {
    const pngName = `${step}-${pair}.png`;
    const pngPath = join(outdir, pngName);

    // Tap (skip on the cold-start row).
    if (testid) {
      let tapRes = tapTestId(testid);
      if (!tapRes.ok) {
        // Retry once after a small wait — the route may still be settling.
        sleep(800);
        tapRes = tapTestId(testid);
      }
      if (!tapRes.ok) {
        manifest.push({
          step,
          pair,
          png: pngName,
          md5: null,
          route: null,
          status: "tap-failed",
          stderr: tapRes.stderr,
        });
        anyMissed = true;
        continue;
      }
      sleep(1200); // route + render settle
    }

    // Capture + MD5.
    let hash = screencap(pngPath);
    let route = currentRoute();
    let status = "ok";

    // MD5 guard: if identical to the prior step, the tap missed (K.15).
    if (priorMd5 && hash === priorMd5 && testid) {
      // One retry: re-tap, wait longer, recapture.
      tapTestId(testid);
      sleep(1500);
      hash = screencap(pngPath);
      route = currentRoute();
      if (hash === priorMd5) {
        status = "recapture-needed-md5-collision";
        anyMissed = true;
      }
    }

    // Route assertion (best-effort — hash-routing apps may report "/").
    if (expectedRoute && route && !route.includes(expectedRoute)) {
      status = status === "ok" ? "route-mismatch" : status;
    }

    manifest.push({
      step,
      pair,
      png: pngName,
      md5: hash,
      md5_short: shortHash(hash),
      route,
      expected_route: expectedRoute,
      status,
    });
    priorMd5 = hash;
    console.log(
      `[visual-tour] ${step}-${pair}: md5=${shortHash(hash)} route=${route || "?"} status=${status}`
    );
  }

  writeFileSync(
    join(outdir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  console.log(`[visual-tour] wrote ${outdir}/manifest.json`);
  process.exit(anyMissed ? 1 : 0);
}

main().catch((e) => {
  console.error(`[visual-tour] error: ${e.message}`);
  process.exit(2);
});
