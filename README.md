# model-economy

A Claude Code plugin that brings the **generator/arbiter model economy** into everyday agent work — not just inside a spec workflow, but in every session.

The idea in one line: **the main agent is the arbiter, not the executor.** It reviews, challenges, decides, and coordinates — spending its premium tokens on judgment — while the actual execution (searching, sweeping files, generating code) goes to subagents on a cheaper tier. Work that costs the same tokens whoever does it has no business running on the top tier.

## How it works

Two hooks, no slash commands, nothing to remember:

### 1. SessionStart — the principle, always on

Every session (startup / resume) gets a short reminder injected: the main agent is the arbiter (reviewer / concept-challenger / decision-maker / coordinator) and subagents are the executors — hand the real work to a subagent on a cheaper tier, and spend premium tokens judging and challenging what comes back. It says nothing about how you read files. It links to [`references/economy-playbook.md`](references/economy-playbook.md) for the full split.

A skill would under-trigger in casual conversation — a SessionStart injection is the reliable "always-on" lever.

### 2. PreToolUse — exploration auto-pinned to a cheaper tier

The enforceable half. When the agent spawns a built-in `Explore` / `general-purpose` subagent (which otherwise **inherits the session model**) *without* pinning a `model`, the hook rewrites the spawn before it runs and leaves a note. `Explore` is pure read-only lookup, so it's pinned to the cheapest tier, `haiku`; `general-purpose` (and an empty `subagent_type`, which defaults to general-purpose) can involve multi-step work, so it keeps the `sonnet` floor:

> auto-pinned this subagent to `model: haiku` (or `sonnet` for general-purpose) — re-issue with `model: opus` if it needs cross-file reasoning.

So a broad codebase sweep never rides Opus/Fable just because that's what the session happens to be on.

- **Non-blocking.** It uses `updatedInput` to re-tier the spawn, never `deny`. The subagent runs immediately, one or two tiers cheaper.
- **Respects deliberate choices.** If you pinned a model yourself (including an intentional `opus`), it's left untouched.
- **Never touches custom agents.** Only `Explore` / `general-purpose` (and an empty `subagent_type`, which defaults to general-purpose) inherit the session model; agents with their own `model:` frontmatter are passed through.
- **Doesn't change your permissions.** It sets no `permissionDecision`, so your Task permission settings still apply.
- **A no-op when you're already cheap.** The hook can't read the session model, so it always pins its floor — `haiku` for Explore, `sonnet` for general-purpose — which changes nothing if you're already at or below that tier, and only saves when you're on a premium tier. It saves exactly when there's something to save.

## Scope: what the hook enforces vs. what the guidance covers

The hook enforces one slice automatically — re-tiering an un-pinned exploration subagent at the spawn. The rest of the split (handing execution to a subagent at all, staying the arbiter, and challenging what comes back) has no clean trigger to hook — nothing fires when the main agent just does the work itself — so it lives in the SessionStart reminder and the playbook as guidance. Both concern **who executes (a cheaper-tier subagent) and your role over them** — the plugin still doesn't prescribe how you read files. The hook just makes the most common, most wasteful case automatic.

## Install

This repo doubles as its own single-plugin marketplace (via `.claude-plugin/marketplace.json`), so you can install it straight from GitHub — the same way as [claude-spec-driven-dev-plugin](https://github.com/jasoncychueh/claude-spec-driven-dev-plugin).

1. **Add this repo as a marketplace:**
   ```
   /plugin marketplace add jasoncychueh/claude-model-economy-plugin
   ```
2. **Install the plugin** — the `@marketplace` suffix is required:
   ```
   /plugin install model-economy@claude-model-economy-plugin
   ```
   Choose the **user** scope when prompted, so it applies to every project.
3. **Activate it in the current session** — no restart needed:
   ```
   /reload-plugins
   ```

Prefer a menu? Run `/plugin`, use the **Marketplaces** tab to add `jasoncychueh/claude-model-economy-plugin`, then the **Discover** tab to install `model-economy`.

Once installed there is nothing to invoke: each session opens with the economy reminder, and any un-pinned Explore search is auto-tiered to `haiku` (general-purpose to `sonnet`).

## Files

```
model-economy/
├── .claude-plugin/plugin.json
├── hooks/
│   ├── hooks.json                 # SessionStart + PreToolUse wiring
│   ├── session-start-economy.js   # injects the economy principle each session
│   └── economy-checkpoint.js      # auto-pins un-pinned Explore/general-purpose spawns
└── references/
    └── economy-playbook.md        # the full generator/arbiter playbook
```

## Origin

This generalizes a discipline first built into the [spec-driven-development](https://github.com/jasoncychueh/claude-spec-driven-dev-plugin) plugin, where long-form generation is delegated to persistent cheaper-tier subagents and the main agent spends its premium tokens only on arbitration. model-economy lifts that same "generator/arbiter split" out of the spec workflow and makes it apply to everyday conversation.
