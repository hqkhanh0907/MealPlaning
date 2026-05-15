---
name: prompt-master
description: Upgrade rough prompts into detailed, expert-level Vietnamese prompts under 3500 characters for general AI systems such as ChatGPT, Claude, and Gemini, with JSON/shell-safe output when the prompt will be embedded in hooks or scripts. Use this skill only when the user explicitly invokes /prompt-master or explicitly asks to use prompt-master; do not use it implicitly for generic prompt writing or prompt editing requests.
user-invocable: true
argument-hint: "[prompt tho can nang cap]"
---

# Prompt Master

## Purpose

Transform a rough prompt into one high-quality Vietnamese prompt that is clear, detailed, actionable, and ready to use with a general AI assistant. Preserve the user's core intent while expanding it with useful context, constraints, quality standards, and output structure.

## Core Workflow

1. Identify the user's desired outcome, target audience, input materials, constraints, and expected output.
2. Check whether the request is safe and legitimate.
3. Decide whether the prompt has enough information to upgrade.
4. If the prompt is too vague, ask clarifying questions only.
5. If the prompt is usable, produce one upgraded prompt plus a visible quality checklist and follow-up questions.
6. Before answering, compress the entire response to stay under 3500 characters.
7. If the prompt will be embedded in JSON, shell, hooks, config, CI, or command arguments, switch to hook-safe output.

## Safety Boundary

Do not upgrade prompts that would help with scams, credential theft, privacy invasion, malware, unauthorized access, evading safety policies, or manipulative abuse. Briefly refuse that part and offer to rewrite the prompt for a legal, defensive, educational, or ethical purpose when possible.

## Vague Prompt Handling

If the prompt is missing the basic task, target outcome, or subject matter, do not generate an upgraded prompt yet. Ask up to 3 concise clarifying questions in Vietnamese.

Use this format:

```markdown
Mình cần làm rõ trước khi nâng cấp prompt:

1. ...
2. ...
3. ...
```

Treat the prompt as usable if you can infer the goal and produce a helpful result by making reasonable assumptions. In that case, upgrade the prompt immediately and include follow-up questions after the prompt.

## Upgrade Standards

The upgraded prompt should be detailed and expert-level by default. Include the relevant parts below, but do not force irrelevant sections:

- Role: who the AI should act as.
- Goal: the concrete outcome the AI must produce.
- Context: background, audience, domain, and assumptions.
- Inputs: what the user will provide or paste.
- Task steps: what the AI should do, in a practical order.
- Constraints: tone, scope, length, tools, exclusions, and boundaries.
- Output format: exact structure the AI should return.
- Quality bar: what makes the answer excellent.
- Self-check: ask the AI to verify completeness, consistency, and usefulness before finalizing, without revealing hidden reasoning.

Prefer precise instructions over generic phrases such as "make it better" or "be professional." Add reasonable structure and expert expectations that strengthen the original idea.

## Output Format

Keep the entire response under 3500 characters, including headings, checklist, questions, and code fences. If the task is complex, prioritize the upgraded prompt over explanation: shorten "Nhận xét ngắn", keep checklist compact, and limit follow-up questions to the most important ones. Do not mention the character limit unless the user asks.

## Hook-Safe Output

Use this mode when the user mentions JSON, shell, bash, hook, CI, config, command, escaping, validation failed, or asks for a prompt to paste into scripts.

This mode overrides the normal Markdown output format.

In hook-safe mode:

- Return the upgraded prompt as one single line.
- Do not include checklist or follow-up questions unless the user asks.
- Do not use Markdown headings, bullets, code fences, inline backticks, or literal newlines.
- Avoid ASCII double quotes when practical; use Vietnamese punctuation or single quotes only if needed.
- Preserve meaning but remove shell-sensitive decoration.
- If the user needs JSON, recommend generating JSON with jq -n --arg or jq --rawfile, never shell echo string concatenation.

Hook-safe format: PROMPT: <one-line upgraded prompt under 3500 characters>

When the prompt is usable, return exactly these sections in Vietnamese:

````markdown
## Nhận xét ngắn

- ...

## Prompt đã nâng cấp

```text
...
```

## Checklist chất lượng

- [ ] Mục tiêu rõ ràng
- [ ] Bối cảnh đủ dùng
- [ ] Vai trò AI phù hợp
- [ ] Nhiệm vụ cụ thể và có thứ tự
- [ ] Ràng buộc và phạm vi rõ
- [ ] Định dạng đầu ra rõ ràng
- [ ] Có tiêu chuẩn tự kiểm tra chất lượng

## Câu hỏi gợi ý để cải thiện tiếp

1. ...
2. ...
3. ...
````

Keep "Nhận xét ngắn" brief: 1-3 bullets about what was improved or what assumptions were made.

The "Prompt đã nâng cấp" section must contain only one final prompt, not multiple variants. Do not create short, standard, and advanced versions unless the user explicitly asks for variants.

The follow-up questions should help the user improve a later version. They should not block the current upgraded prompt unless the input is too vague under the vague prompt rule.

## Language and Platform Defaults

Write the upgraded prompt in Vietnamese, even if the original prompt is in another language. Optimize for general AI assistants such as ChatGPT, Claude, and Gemini. Avoid platform-specific syntax unless the user names a specific model, tool, or agent.

## Expansion Policy

You may expand the original idea when doing so makes the prompt stronger, more specific, or more useful. Keep the expansion aligned with the user's likely intent. Do not replace the user's objective with a different task.
