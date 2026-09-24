#!/usr/bin/env node
/*
 * model-economy — subagent tier redirect.
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
 * WHAT it does — only on the subagent spawn (tool_name Task or Agent) whose
 * subagent_type is a BUILT-IN bulk agent that inherits the session model: "Explore",
 * "general-purpose", or empty (empty defaults to general-purpose). Custom agents carry
 * their own `model:` frontmatter, so they are NEVER touched.
 *   → general-purpose / empty: ALWAYS redirect `subagent_type` to this plugin's `worker`
 *     agent, whose frontmatter is `model: opus` + `effort: medium`, and drop any `model`
 *     on the spawn — a per-spawn model would override the worker's own. A redirect rather
 *     than a `model` pin because the spawn has no effort parameter: pinning only the
 *     model would leave the executor at the session's effort, not at medium.
 *     Verified: a PreToolUse `updatedInput` that changes `subagent_type` makes the
 *     harness spawn the named agent, on that agent's frontmatter model.
 *   → Explore: ALWAYS redirect `subagent_type` to this plugin's `explorer` agent
 *     (`model: haiku` + `effort: xhigh`, read-only tools) and drop any `model`, for the
 *     same reasons: a per-spawn model would override the explorer's own, and only
 *     frontmatter can set xhigh. A lookup gets haiku's top effort, which scores about the
 *     same as sonnet at medium or opus at low for about a quarter of their cost. The note
 *     says a search that genuinely needs cross-file reasoning should be delegated as
 *     general-purpose instead, which runs on the worker.
 *
 * WHY no permissionDecision: setting "allow" would skip the user's Task permission
 * prompt; this plugin only picks the tier, it must not change permission behavior. We
 * supply updatedInput + additionalContext and let the normal permission flow proceed
 * against the rewritten input. We never deny — the spawn is never blocked, only re-tiered.
 *
 * WHY it can't be smarter about the tier: PreToolUse stdin carries no session model and
 * no reliable way to tell a mechanical search from a reasoning one, so the subagent type
 * stands in for the task shape and the model is left the explorer-vs-worker call via the note.
 *
 * FAIL-OPEN: any missing/odd input -> emit nothing -> the spawn proceeds unchanged.
 * Reads stdin only, writes nothing. Pure Node (Claude Code ships Node).
 */
'use strict';
const fs = require('fs');

// The plugin's own general-purpose executor (agents/worker.md): opus at medium effort.
const WORKER = 'model-economy:worker';
// The plugin's own read-only lookup agent (agents/explorer.md): haiku at xhigh effort.
const EXPLORER = 'model-economy:explorer';

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

  // Any per-spawn model is dropped: it would override the target agent's frontmatter.
  const { model: _dropped, ...rest } = ti;

  let updatedInput, note;
  if (st !== 'explore') {
    // general-purpose / empty: always the worker, whatever model was asked for.
    updatedInput = Object.assign({}, rest, { subagent_type: WORKER });
    note = 'Model economy: redirected this general-purpose subagent to `' + WORKER + '` (opus at medium effort) — ' +
      'a delegated task runs at the tier its shape needs, not at whatever model and effort the session runs.';
  } else {
    // Explore: always the explorer — a read-only lookup at haiku's top effort.
    updatedInput = Object.assign({}, rest, { subagent_type: EXPLORER });
    note = 'Model economy: redirected this Explore subagent to `' + EXPLORER + '` (haiku at xhigh effort, read-only lookup). ' +
      'If the search genuinely needs cross-file reasoning or synthesis, delegate it as `general-purpose` instead, which runs on `' + WORKER + '` (opus at medium effort).';
  }
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', updatedInput, additionalContext: note },
  }));
  process.exit(0);
} catch (_) {
  passthrough();
}
