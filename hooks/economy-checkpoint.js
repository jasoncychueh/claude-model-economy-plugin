#!/usr/bin/env node
/*
 * model-economy — exploration tier auto-pin.
 *
 * PreToolUse hook on the subagent-spawn tool (matcher "Task|Agent"). Its whole job
 * is one enforceable point of the generator/arbiter economy: delegated execution
 * should not run on the premium session model just because that is what the spawn
 * inherits by default.
 *
 * WHY a hook and not just guidance: a built-in Explore / general-purpose agent
 * inherits the session model — and the session's effort level — unless the caller
 * pins them. On a premium session (a tier above opus, e.g. Fable) an un-pinned spawn
 * burns premium-tier tokens on execution that does not need them, and a lookup inherits
 * a reasoning model it does not need at all. The hook catches the spawn the instant it
 * happens and gives it the tier the task shape calls for.
 *
 * WHAT it does, only when ALL of these hold:
 *   - the tool is the subagent spawn (tool_name Task or Agent), and
 *   - subagent_type is a BUILT-IN bulk agent that inherits the session model —
 *     "Explore", "general-purpose", or empty (empty defaults to general-purpose).
 *     Custom agents carry their own `model:` frontmatter, so they are NEVER touched, and
 *   - no `model` was pinned on the spawn (a deliberate model choice, including an
 *     intentional opus, is always respected).
 *   → Explore: add `model: "haiku"` via `updatedInput` (pure read-only lookup — the
 *     cheapest tier fits), plus an `additionalContext` note that it can be re-issued
 *     with `model: "opus"` when the search genuinely needs cross-file reasoning.
 *   → general-purpose / empty: redirect `subagent_type` to this plugin's `worker`
 *     agent, whose frontmatter is `model: opus` + `effort: low`. A redirect rather
 *     than a `model` pin because the spawn has no effort parameter: pinning only the
 *     model would leave the executor at the session's effort, possibly high or xhigh.
 *     Not sonnet: on current per-task cost measurements opus at low effort costs
 *     less than sonnet at medium and scores above sonnet at xhigh. No `model` is added
 *     to the redirected spawn — a per-spawn model would override the worker's own.
 *     Verified: a PreToolUse `updatedInput` that changes `subagent_type` makes the
 *     harness spawn the named agent, on that agent's frontmatter model.
 *
 * WHY no permissionDecision: setting "allow" would skip the user's Task permission
 * prompt; this plugin only picks the tier, it must not change permission behavior. We
 * supply updatedInput + additionalContext and let the normal permission flow proceed
 * against the rewritten input. We never deny — the spawn is never blocked, only re-tiered.
 *
 * WHY it can't be smarter about the tier: PreToolUse stdin carries no session model and
 * no reliable way to tell a mechanical search from a reasoning one, so the subagent type
 * stands in for the task shape and the model is left the haiku-vs-opus call via the note.
 *
 * FAIL-OPEN: any missing/odd input -> emit nothing -> the spawn proceeds unchanged.
 * Reads stdin only, writes nothing. Pure Node (Claude Code ships Node).
 */
'use strict';
const fs = require('fs');

// The plugin's own general-purpose executor (agents/worker.md): opus at low effort.
const WORKER = 'model-economy:worker';

// no-op: emit nothing -> Claude Code proceeds with the original tool call
function passthrough() { process.exit(0); }

try {
  let input;
  try { input = JSON.parse(fs.readFileSync(0, 'utf8')); } catch (_) { passthrough(); }

  if (!input || (input.tool_name !== 'Task' && input.tool_name !== 'Agent')) passthrough();

  const ti = input.tool_input;
  if (!ti || typeof ti !== 'object') passthrough();

  // Only built-in bulk agents inherit the session model. Empty subagent_type defaults
  // to general-purpose (also inherits). Anything else is a custom agent with its own
  // model frontmatter — leave it alone.
  const st = (typeof ti.subagent_type === 'string' ? ti.subagent_type : '').trim().toLowerCase();
  const inherits = st === '' || st === 'explore' || st === 'general-purpose';
  if (!inherits) passthrough();

  // A deliberate model choice (any non-empty value) is respected.
  if (ti.model != null && String(ti.model).trim() !== '') passthrough();

  let updatedInput, note;
  if (st === 'explore') {
    // Pure read-only lookup (find files/symbols) — the cheapest tier.
    updatedInput = Object.assign({}, ti, { model: 'haiku' });
    note = 'Model economy: auto-pinned this Explore subagent to `model: haiku` — a lookup needs no reasoning model. ' +
      'If this task genuinely needs cross-file reasoning or synthesis, re-issue it with `model: opus`.';
  } else {
    // Multi-step work — redirected to the worker so both model and effort are pinned.
    updatedInput = Object.assign({}, ti, { subagent_type: WORKER });
    note = 'Model economy: redirected this general-purpose subagent to `' + WORKER + '` (opus at low effort) — ' +
      'a delegated task runs at the tier its shape needs, not at whatever model and effort the session runs. ' +
      'Pin `model` on the spawn to keep the built-in general-purpose agent instead.';
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput, additionalContext: note },
  }));
  process.exit(0);
} catch (_) {
  passthrough();
}
