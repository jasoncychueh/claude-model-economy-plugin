# Changelog

Version history and decision rationale are collected here.

## 1.0.0 (2026-07-05)

First release. Brings the generator/arbiter model economy — first built into the spec-driven-development plugin, where it governed a structured workflow — out into **everyday agent work**, via two hooks and no slash commands.

- **SessionStart hook (`session-start-economy.js`)** — injects a short, always-on reminder of the split: spend the premium session model on judgment (conversing, deciding, distilling, challenging), delegate bulk reading/exploration and bulk generation to a cheaper tier, and apply it proportionally so trivia isn't wrapped in subagents. Carries the absolute path to `references/economy-playbook.md` (passed via `${CLAUDE_PLUGIN_ROOT}`) for the full playbook. Chosen over a skill because a skill under-triggers in casual conversation; SessionStart is the reliable always-on lever.
- **PreToolUse hook (`economy-checkpoint.js`)** — the enforceable half. On a subagent spawn (matcher `Task|Agent`) targeting a built-in bulk agent that inherits the session model (`Explore` / `general-purpose`, or an empty `subagent_type`), with no `model` pinned, it rewrites `tool_input` via `updatedInput` to add `model: sonnet` and injects an `additionalContext` note to re-issue with `model: opus` if the search needs cross-file reasoning. Non-blocking (never `deny`), respects deliberate model choices, never touches custom agents (own `model:` frontmatter), and sets no `permissionDecision` so it doesn't bypass the user's Task permission settings. Fail-open on any parse/shape error.
- **`references/economy-playbook.md`** — the full split: proportionality (the anti-ceremony guard), the exploration tier table (sonnet mechanical / opus reasoning, known target → read directly), delegating bulk generation with the mandatory challenge (cheap generator, premium critic), and the arbiter's failure modes.
- **Design notes** — the reads side is enforced at the spawn (the one interceptable moment); the writes side has no clean hook trigger, so it lives as guidance the agent applies with judgment. The PreToolUse hook can't read the session model (no such field on its stdin), so it always pins the `sonnet` floor: a no-op when the session is already cheap, a real saving only on a premium tier.
