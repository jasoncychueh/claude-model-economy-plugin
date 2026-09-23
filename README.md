# model-economy

A Claude Code plugin that brings the **generator/arbiter model economy** into everyday agent work — not just inside a spec workflow, but in every session.

The idea in one line: **the main agent is the arbiter, not the executor.** It reviews, challenges, decides, and coordinates — spending its tokens, premium ones if the session runs a tier above opus, on judgment — while the actual execution (searching, sweeping files, generating code) goes to subagents pinned at haiku or opus, each in its own context. Two savings follow: execution is not paid at premium rates, and whatever the main agent does not read itself never enters its context, where it would be paid for again on every later turn.

## How it works

Two hooks, no slash commands, nothing to remember:

### 1. SessionStart — the principle, always on

Every session (startup / resume) gets a short reminder injected: the main agent is the arbiter (reviewer / concept-challenger / decision-maker / coordinator) and subagents are the executors — hand the real work to a subagent, and spend premium tokens judging and challenging what comes back. It says nothing about how you read files. It links to [`references/economy-playbook.md`](references/economy-playbook.md) for the full split.

A skill would under-trigger in casual conversation — a SessionStart injection is the reliable "always-on" lever.

### 2. PreToolUse — exploration auto-pinned off the premium tier

The enforceable half. When the agent spawns a built-in `Explore` / `general-purpose` subagent (which otherwise **inherits the session model**) *without* pinning a `model`, the hook rewrites the spawn before it runs and leaves a note. `Explore` is pure read-only lookup, so it's pinned to the cheapest tier, `haiku`. `general-purpose` (and an empty `subagent_type`, which defaults to general-purpose) can involve multi-step work, so it's redirected to the plugin's own `model-economy:worker` agent — opus at medium effort:

> auto-pinned this Explore subagent to `model: haiku` — re-issue with `model: opus` if it needs cross-file reasoning.
>
> redirected this general-purpose subagent to `model-economy:worker` (opus at medium effort).

Not `sonnet`: on current per-task cost measurements, Opus at medium effort is smarter than Sonnet and cheaper than Sonnet at high effort, so Sonnet is never the economical middle. A lookup never rides a reasoning model, and execution never rides a premium tier such as Fable just because that's what the session happens to be on.

**Why a redirect, not a model pin, for general-purpose**: the spawn has no effort parameter, so a built-in subagent runs at the session's effort level — high or xhigh if that is where the session is. An agent's frontmatter can set effort, so the worker carries `model: opus` + `effort: medium` and the hook points the spawn at it. Verified: rewriting `subagent_type` in `updatedInput` makes the harness spawn the named agent on its frontmatter model.

- **Non-blocking.** It uses `updatedInput` to re-tier the spawn, never `deny`. The subagent runs immediately.
- **Respects deliberate choices.** If you pinned a model yourself (including an intentional `opus`), it's left untouched — that is also how to keep the built-in general-purpose agent.
- **Never touches custom agents.** Only `Explore` / `general-purpose` (and an empty `subagent_type`, which defaults to general-purpose) inherit the session model; agents with their own `model:` frontmatter are passed through.
- **Doesn't change your permissions.** It sets no `permissionDecision`, so your Task permission settings still apply.
- **Pins by task shape, not by session.** The hook can't read the session model, so it decides by subagent type: `haiku` for Explore, the opus-medium worker for general-purpose. On an Opus session at medium effort the redirect changes little; on a premium tier or a higher effort it keeps execution off both.

## Scope: what the hook enforces vs. what the guidance covers

The hook enforces one slice automatically — re-tiering an un-pinned exploration subagent at the spawn. The rest of the split (handing execution to a subagent at all, staying the arbiter, and challenging what comes back) has no clean trigger to hook — nothing fires when the main agent just does the work itself — so it lives in the SessionStart reminder and the playbook as guidance. Both concern **who executes (a subagent at haiku or opus) and your role over them** — the plugin still doesn't prescribe how you read files. The hook just makes the most common, most wasteful case automatic.

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

Once installed there is nothing to invoke: each session opens with the economy reminder, and any un-pinned Explore search is auto-tiered to `haiku` (general-purpose is redirected to the opus-medium worker).

## Files

```
model-economy/
├── .claude-plugin/plugin.json
├── agents/
│   └── worker.md                  # general-purpose executor: opus at medium effort
├── hooks/
│   ├── hooks.json                 # SessionStart + PreToolUse wiring
│   ├── session-start-economy.js   # injects the economy principle each session
│   └── economy-checkpoint.js      # pins un-pinned Explore to haiku, redirects general-purpose to the worker
└── references/
    └── economy-playbook.md        # the full generator/arbiter playbook
```

## Origin

This generalizes a discipline first built into the [spec-driven-development](https://github.com/jasoncychueh/claude-spec-driven-dev-plugin) plugin, where long-form generation is delegated to persistent subagents and the main agent spends its tokens only on arbitration. model-economy lifts that same "generator/arbiter split" out of the spec workflow and makes it apply to everyday conversation.
