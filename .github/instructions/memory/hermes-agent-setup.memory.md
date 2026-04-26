# Hermes Agent Setup Lessons

## Copilot CLI Auth ≠ gh Auth (2026-04-24)
- ❌ `gh auth login` does NOT authenticate `copilot` CLI — they have separate auth stores
- ❌ Hermes `copilot-acp` provider silently hangs on `session/new` if copilot CLI not logged in (no clear error)
- ✅ Must run `copilot login` separately → device code flow → github.com/login/device
- 💡 Root cause: Copilot CLI uses its own credential store at `/opt/homebrew/lib/node_modules/@github/copilot/`

## Copilot Provider Choices in Hermes
- ❌ `copilot` provider (direct API to api.githubcopilot.com) → 403 Forbidden for most models — GitHub blocks third-party access
- ✅ `copilot-acp` provider (spawns `copilot --acp --stdio`) → works AFTER `copilot login`
- 💡 `copilot-acp` uses JSON-RPC protocol: initialize → session/new → session/prompt → session/update chunks

## Model Name with copilot-acp
- ❌ Model name like `gpt-5.4` sent to copilot-acp is cosmetic — the actual model selection is done by the Copilot CLI internally
- ✅ The model field in config mainly affects Hermes UI display, not actual routing when using ACP
