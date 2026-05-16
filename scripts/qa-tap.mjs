#!/usr/bin/env node
/**
 * qa-tap.mjs — drive the MealPlaning Android emulator via Chrome DevTools Protocol.
 *
 * Why CDP and not adb tap / uiautomator dump?
 *   - uiautomator dump returns useless [0,0][1080,2400] bounds for Ionic WebView nodes.
 *   - screencap + vision_analyze hallucinates coordinates ~30% of the time on resized
 *     screenshots and misses small targets.
 *   - CDP queries the LIVE DOM, converts CSS px → device px via devicePixelRatio,
 *     and dispatches input through window/page coords — 100% reliable.
 *
 * Prerequisites (one-time, already done in the project):
 *   1. Build a DEBUG APK (assembleDebug). Capacitor's BridgeActivity calls
 *      WebView.setWebContentsDebuggingEnabled(true) automatically for debug builds,
 *      so we DO NOT override it in MainActivity (overriding caused SIGTRAP).
 *   2. Add `data-testid` attributes to the elements you want to drive.
 *
 * Usage:
 *   node scripts/qa-tap.mjs tap   '[data-testid="onboarding-continue"]'
 *   node scripts/qa-tap.mjs tap-text 'Tiếp tục'
 *   node scripts/qa-tap.mjs type  '[data-testid="height-input"]' '170'
 *   node scripts/qa-tap.mjs eval  'document.title'
 *   node scripts/qa-tap.mjs find  '[data-testid="tab-management"]'   # device-pixel center
 *   node scripts/qa-tap.mjs dump-testids                             # list all data-testid
 *   node scripts/qa-tap.mjs route                                    # current router URL
 *
 * Exit codes: 0 success | 1 selector/text not found | 2 setup error.
 */
import { execSync, spawnSync } from "node:child_process";
import dns from "node:dns";
import CDP from "chrome-remote-interface";

// macOS resolves 'localhost' → ::1 first; adb forward only binds IPv4.
// Android WebView's CDP server only accepts Host: localhost (rejects Host: 127.0.0.1
// and Host: <ip>:9222). Combining ipv4first DNS with useHostName:true gives us
// the right Host header AND an IPv4 socket.
dns.setDefaultResultOrder("ipv4first");

const ADB = process.env.ADB || `${process.env.HOME}/Library/Android/sdk/platform-tools/adb`;
const SERIAL = process.env.ANDROID_SERIAL || "emulator-5554";
const PORT = 9222;
const PKG = "com.healthmate.ai";
const ACTIVITY = `${PKG}/.MainActivity`;

function adb(args) {
  return spawnSync(ADB, ["-s", SERIAL, ...args], { encoding: "utf8" });
}
function adbShell(cmd) {
  return adb(["shell", cmd]).stdout || "";
}

/** Make sure the app is running and forward its WebView socket to tcp:9222. */
function ensureForward() {
  // Whitelist app from doze (best-effort).
  adbShell(`dumpsys deviceidle whitelist +${PKG}`);
  // Start app if not running (Android 16 emulator kills idle apps quickly).
  const pid = adbShell("pidof " + PKG).trim();
  if (!pid) {
    adb(["shell", "am", "start", "-n", ACTIVITY]);
    // Wait up to 6s for WebView to come up.
    for (let i = 0; i < 30; i++) {
      const sockets = adbShell("cat /proc/net/unix");
      if (/@webview_devtools_remote_\d+/.test(sockets)) break;
      execSync("sleep 0.2");
    }
  }

  const sockets = adbShell("cat /proc/net/unix");
  const match = sockets
    .split("\n")
    .map((l) => l.match(/@(webview_devtools_remote_\d+)/))
    .find(Boolean);
  if (!match) {
    console.error(
      "[qa-tap] No webview_devtools_remote socket. App may have crashed.\n" +
      "  Check: adb logcat | grep -E 'AndroidRuntime|FATAL|libc.*Fatal'"
    );
    process.exit(2);
  }

  // Only touch the forward if it's missing or pointing at the wrong socket.
  // Re-removing a valid forward race-clobbers in-flight CDP requests issued by
  // an outer orchestrator (visual-tour.mjs) — caused "socket hang up" on every
  // tap when the orchestrator had just set the forward correctly.
  const fwdList = adb(["forward", "--list"]).stdout || "";
  const wantLine = `tcp:${PORT} localabstract:${match[1]}`;
  if (!fwdList.includes(wantLine)) {
    adb(["forward", "--remove", `tcp:${PORT}`]);
    const fwd = adb(["forward", `tcp:${PORT}`, `localabstract:${match[1]}`]);
    if (fwd.status !== 0) {
      console.error(`[qa-tap] adb forward failed: ${fwd.stderr}`);
      process.exit(2);
    }
  }
}

/** Connect to the first non-devtools page in the WebView. */
async function connect() {
  // Retry up to 4 times with progressive backoff. Do NOT force-stop on retry
  // (the old code did; it killed the very app we were trying to reach when
  // the CDP HTTP server just needed another moment to come up).
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      ensureForward();
      await new Promise((r) => setTimeout(r, 600 + attempt * 600));
      const targets = await CDP.List({ port: PORT, host: "localhost", useHostName: true });
      const page = targets.find((t) => t.type === "page" && !t.url.startsWith("chrome-")) || targets[0];
      if (!page) throw new Error("no CDP page targets");
      const client = await CDP({ target: page, port: PORT, host: "localhost", useHostName: true });
      await client.Runtime.enable();
      // Sanity: make sure the page is alive.
      await client.Runtime.evaluate({ expression: "1+1", returnByValue: true });
      return client;
    } catch (e) {
      lastErr = e;
      // Back off without killing the app.
      await new Promise((r) => setTimeout(r, 400 + attempt * 400));
    }
  }
  throw lastErr;
}

/** Run a JS expression in the page; return the JSON-serialized value. */
async function evalJs(client, expr) {
  const { result, exceptionDetails } = await client.Runtime.evaluate({
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(
      "JS error: " +
        (exceptionDetails.exception?.description || exceptionDetails.text || "unknown")
    );
  }
  return result.value;
}

/**
 * Find an element by CSS selector; return its viewport-center in device pixels,
 * or null if not found / not visible.
 */
async function findCenter(client, selector) {
  const expr = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return {
        x: (r.left + r.width / 2) * window.devicePixelRatio,
        y: (r.top + r.height / 2) * window.devicePixelRatio,
        cssX: r.left + r.width / 2,
        cssY: r.top + r.height / 2,
        dpr: window.devicePixelRatio,
      };
    })();
  `;
  return evalJs(client, expr);
}

/** Find first element whose visible text contains the given string (case-insensitive). */
async function findCenterByText(client, text) {
  const expr = `
    (() => {
      const needle = ${JSON.stringify(text.toLowerCase())};
      const all = document.querySelectorAll('button, a, ion-button, ion-tab-button, ion-segment-button, [role="button"], ion-chip');
      for (const el of all) {
        if (!(el.textContent || '').toLowerCase().includes(needle)) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        return {
          x: (r.left + r.width / 2) * window.devicePixelRatio,
          y: (r.top + r.height / 2) * window.devicePixelRatio,
          cssX: r.left + r.width / 2,
          cssY: r.top + r.height / 2,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 60),
        };
      }
      return null;
    })();
  `;
  return evalJs(client, expr);
}

/** Issue a real adb tap at device-pixel coords (works through Capacitor handlers). */
function tapDevice(x, y) {
  adb(["shell", "input", "tap", String(Math.round(x)), String(Math.round(y))]);
}

/** Type into an input by selector via direct value-set + 'input' event. */
async function typeInto(client, selector, value) {
  const expr = `
    (() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, ${JSON.stringify(value)});
      else el.value = ${JSON.stringify(value)};
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })();
  `;
  return evalJs(client, expr);
}

async function main() {
  const [, , cmd, arg1, arg2] = process.argv;
  if (!cmd) {
    console.error("Usage: qa-tap.mjs <tap|tap-text|type|eval|find|dump-testids|route> [args]");
    process.exit(2);
  }

  const client = await connect();
  try {
    if (cmd === "eval") {
      const v = await evalJs(client, arg1);
      console.log(typeof v === "string" ? v : JSON.stringify(v));
    } else if (cmd === "route") {
      const v = await evalJs(client, "location.hash || location.pathname");
      console.log(v);
    } else if (cmd === "find") {
      const c = await findCenter(client, arg1);
      if (!c) {
        console.error(`[qa-tap] not found: ${arg1}`);
        process.exit(1);
      }
      console.log(JSON.stringify(c));
    } else if (cmd === "tap") {
      const c = await findCenter(client, arg1);
      if (!c) {
        console.error(`[qa-tap] not found: ${arg1}`);
        process.exit(1);
      }
      tapDevice(c.x, c.y);
      console.log(`tapped ${arg1} @ device(${Math.round(c.x)},${Math.round(c.y)})`);
    } else if (cmd === "tap-text") {
      const c = await findCenterByText(client, arg1);
      if (!c) {
        console.error(`[qa-tap] no element with text: ${arg1}`);
        process.exit(1);
      }
      tapDevice(c.x, c.y);
      console.log(`tapped <${c.tag}> "${c.text}" @ device(${Math.round(c.x)},${Math.round(c.y)})`);
    } else if (cmd === "type") {
      const ok = await typeInto(client, arg1, arg2 ?? "");
      if (!ok) {
        console.error(`[qa-tap] not found: ${arg1}`);
        process.exit(1);
      }
      console.log(`typed into ${arg1}`);
    } else if (cmd === "dump-testids") {
      const v = await evalJs(
        client,
        "Array.from(document.querySelectorAll('[data-testid]')).map(e => e.getAttribute('data-testid'))"
      );
      console.log(v.join("\n"));
    } else {
      console.error(`[qa-tap] unknown command: ${cmd}`);
      process.exit(2);
    }
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(`[qa-tap] error: ${e.message}`);
  process.exit(2);
});
