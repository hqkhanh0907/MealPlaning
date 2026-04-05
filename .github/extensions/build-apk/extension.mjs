// Extension: build-apk
// Run build-apk.sh script to build, copy, and upload APK to Google Drive

import { joinSession } from "@github/copilot-sdk/extension";
import { execFile } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const session = await joinSession({
    tools: [
        {
            name: "build_apk",
            description:
                "Build MealPlaning APK: web build → Capacitor sync → Gradle assembleRelease → copy to Desktop → upload to Google Drive. Returns build result with APK path, size, and Drive link.",
            parameters: { type: "object", properties: {} },
            handler: async () => {
                // Resolve project root (3 levels up from .github/extensions/build-apk/)
                const extDir = dirname(fileURLToPath(import.meta.url));
                const projectRoot = resolve(extDir, "..", "..", "..");
                const scriptPath = resolve(projectRoot, "scripts/build-apk.sh");

                await session.log("🔨 Building APK... (this takes ~2 minutes)");

                return new Promise((res) => {
                    execFile(
                        "bash",
                        [scriptPath],
                        { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024, timeout: 300_000 },
                        (err, stdout, stderr) => {
                            if (err) {
                                res(`❌ Build failed!\n\nError: ${err.message}\n\nStderr:\n${stderr}\n\nStdout (last 2000 chars):\n${stdout.slice(-2000)}`);
                                return;
                            }

                            // Extract summary from output
                            const lines = stdout.split("\n");
                            const summaryStart = lines.findIndex((l) => l.includes("BUILD THANH CONG"));
                            if (summaryStart !== -1) {
                                const summary = lines.slice(summaryStart - 1).join("\n");
                                res(`✅ ${summary}`);
                            } else {
                                res(`✅ Build completed!\n\n${stdout.slice(-1000)}`);
                            }
                        },
                    );
                });
            },
        },
    ],
});
