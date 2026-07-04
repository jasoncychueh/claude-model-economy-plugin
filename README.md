# model-economy

A Claude Code plugin that brings the **generator/arbiter model economy** into everyday agent work — not just inside a spec workflow, but in every session.

The idea in one line: **the premium session model is worth its price for judgment, not for legwork.** Reading twenty files to find one thing, or typing out a long boilerplate module, costs the same tokens whoever does it — so paying the top tier to do it is waste. This plugin keeps the judgment on the premium model and pushes the bulk down to a cheaper tier.

## How it works

Two hooks, no slash commands, nothing to remember:

### 1. SessionStart — the principle, always on

Every session (startup / resume) gets a short reminder injected: spend the premium model on conversing, deciding, distilling, and challenging; delegate bulk reading/exploration and bulk generation to a cheaper tier; apply it proportionally (don't spawn subagents for trivia). The reminder links to [`references/economy-playbook.md`](references/economy-playbook.md) for the full split.

A skill would under-trigger in casual conversation — a SessionStart injection is the reliable "always-on" lever.

### 2. PreToolUse — exploration auto-pinned to a cheaper tier

The enforceable half. When the agent spawns a built-in `Explore` / `general-purpose` subagent (which otherwise **inherits the session model**) *without* pinning a `model`, the hook rewrites the spawn to `model: sonnet` before it runs and leaves a note:

> auto-pinned this search to `model: sonnet` — re-issue with `model: opus` if it needs cross-file reasoning.

So a broad codebase sweep never rides Opus/Fable just because that's what the session happens to be on.

- **Non-blocking.** It uses `updatedInput` to re-tier the spawn, never `deny`. The subagent runs immediately, one tier cheaper.
- **Respects deliberate choices.** If you pinned a model yourself (including an intentional `opus`), it's left untouched.
- **Never touches custom agents.** Only `Explore` / `general-purpose` (and an empty `subagent_type`, which defaults to general-purpose) inherit the session model; agents with their own `model:` frontmatter are passed through.
- **Doesn't change your permissions.** It sets no `permissionDecision`, so your Task permission settings still apply.
- **A no-op when you're already cheap.** The hook can't read the session model, so it always pins `sonnet` — which changes nothing if you're already on sonnet, and only saves when you're on a premium tier. It saves exactly when there's something to save.

## Scope: what the hook enforces vs. what the guidance covers

The **reads** side (exploration tier) is enforced at the one interceptable moment — the spawn. The **writes** side (delegate bulk generation, then challenge the result) has no clean trigger to hook, so it lives in the SessionStart reminder and the playbook as guidance the agent applies with judgment. Together they cover the full split; the hook just makes the most common, most wasteful case automatic.

## Install

This plugin is published in the **chipright-plugins** marketplace. Install it at **user** scope so the economy applies to every project and session — that's the point of an "everyday" economy.

1. **Add the marketplace** (skip if you already have it):
   ```
   /plugin marketplace add ssh://git@bitbucket.chipright.com.tw:7999/at/claude-plugins.git
   ```
   If it's already added, refresh it so the new entry shows up:
   ```
   /plugin marketplace update chipright-plugins
   ```
2. **Install the plugin** — the `@marketplace` suffix is required:
   ```
   /plugin install model-economy@chipright-plugins
   ```
   Choose the **user** scope when prompted.
3. **Activate it in the current session** — no restart needed:
   ```
   /reload-plugins
   ```

Prefer a menu? Run `/plugin`, open the **Discover** tab, find `model-economy`, and press Enter.

> The marketplace URL must include its scheme (`ssh://` or `https://`); Claude Code v2.1.196+ rejects a bare `host/path` as invalid GitHub shorthand.

Once installed there is nothing to invoke: each session opens with the economy reminder, and any un-pinned Explore / general-purpose search is auto-tiered to `sonnet`.

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
