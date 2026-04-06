// Extension: rule-guardian
// Nhắc nhở agent tuân thủ rules/personality từ copilot-instructions.md
// Hook 1: onSessionStart — inject full rules khi bắt đầu session
// Hook 2: onUserPromptSubmitted — inject reminder ngắn mỗi lần user hỏi

import { joinSession } from "@github/copilot-sdk/extension";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ─── LOAD INSTRUCTIONS ───
function loadInstructions(cwd) {
  const filePath = join(cwd, ".github", "copilot-instructions.md");
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

// ─── EXTRACT KEY SECTIONS ───
function extractKeySections(content) {
  if (!content) return "";

  const sections = [];

  // Extract Personality section
  const personalityMatch = content.match(
    /## 🧑‍💼 Tính cách & Phong cách làm việc[\s\S]*?(?=\n## [^#])/
  );
  if (personalityMatch) sections.push(personalityMatch[0].trim());

  // Extract Quality Gates
  const qgMatch = content.match(
    /### Quality Gates[\s\S]*?(?=\n---|\n### [^Q])/
  );
  if (qgMatch) sections.push(qgMatch[0].trim());

  // Extract Senior Perfectionist Rules
  const rulesMatch = content.match(
    /### Rules \(Bộ Quy Tắc\)[\s\S]*?(?=\n### Actions)/
  );
  if (rulesMatch) sections.push(rulesMatch[0].trim());

  // Extract Actions
  const actionsMatch = content.match(
    /### Actions \(Hành Động Bắt Buộc\)[\s\S]*?(?=\n### 🧠 Auto-Learning)/
  );
  if (actionsMatch) sections.push(actionsMatch[0].trim());

  return sections.join("\n\n---\n\n");
}

// ─── COMPACT REMINDER (injected every user prompt) ───
const REMINDER = `
⚠️ RULE GUARDIAN REMINDER — Tuân thủ NGHIÊM NGẶT:

🔴 TÍNH CÁCH: Bạn là người CỰC KỲ KHÓ TÍNH, KHẮT KHE, KỸ LƯỠNG.
🔴 QUY TRÌNH BẮT BUỘC cho MỌI yêu cầu:
   1. ĐỌC kỹ yêu cầu
   2. ĐẶT 3-5 CÂU HỎI (scope, edge cases, UX, impact, priority)
   3. CHỜ user trả lời — KHÔNG tự suy diễn
   4. XÁC NHẬN hiểu biết
   5. LÊN KẾ HOẠCH + trade-off analysis
   6. CHỜ user approve
   7. MỚI code

🔴 NGOẠI LỆ (không cần hỏi):
   - Bug rõ ràng 100% (crash, NaN, lint error)
   - User nói "tự động làm hết" / "không cần hỏi"
   - Hotfix production / Task quá đơn giản (fix typo)

🔴 QUALITY GATES (mỗi code change):
   1. npm run lint → 0 errors, KHÔNG eslint-disable
   2. npm run test → 0 failures, coverage 100%
   3. npm run build → clean
   4. npm run test:coverage && npm run sonar → 0 SonarQube issues
   5. Spec cross-check

🔴 AUTOPILOT MODE: Output câu hỏi bằng text-only (KHÔNG gọi tool) để force user reply.
`.trim();

// ─── STATE ───
let fullRules = "";
let loaded = false;

// ─── JOIN SESSION ───
const session = await joinSession({
  hooks: {
    onSessionStart: async (input) => {
      const content = loadInstructions(input.cwd);
      if (!content) {
        session.log("⚠️ Rule Guardian: .github/copilot-instructions.md not found");
        return;
      }

      fullRules = extractKeySections(content);
      loaded = true;

      session.log("✅ Rule Guardian: Loaded personality + rules + quality gates");

      return {
        additionalContext: [
          "# 📋 RULE GUARDIAN — Rules đã được nạp từ .github/copilot-instructions.md",
          "",
          "Bạn PHẢI tuân thủ TOÀN BỘ nội dung dưới đây trong SUỐT session:",
          "",
          fullRules,
          "",
          "---",
          "",
          REMINDER,
        ].join("\n"),
      };
    },

    onUserPromptSubmitted: async (input) => {
      // Reload if not loaded yet (e.g. session resumed)
      if (!loaded) {
        const content = loadInstructions(input.cwd);
        if (content) {
          fullRules = extractKeySections(content);
          loaded = true;
        }
      }

      session.log("📋 Rule Guardian: Nhắc nhở — Hỏi 3-5 câu trước khi code, tuân thủ Quality Gates", { level: "info" });

      return {
        additionalContext: REMINDER,
      };
    },
  },
});
