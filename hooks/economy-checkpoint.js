#!/usr/bin/env node
/*
 * model-economy — exploration tier auto-pin.
 *
 * PreToolUse hook on the subagent-spawn tool (matcher "Task|Agent"). Its whole job
 * is one enforceable point of the generator/arbiter economy: a broad codebase sweep
 * should not run on the premium session model just because that is what the spawn
 * inherits by default.
 *
 * WHY a hook and not just guidance: a built-in Explore / general-purpose agent
 * inherits the session model unless the caller pins `model` explicitly. On a premium
 * session (e.g. Opus / Fable) an un-pinned broad search burns top-tier tokens on work
 * whose cost is dominated by how much it reads, not by judgment. The hook catches the
 * spawn the instant it happens and rewrites it down to a cheaper floor.
 *
 * WHAT it does, only when ALL of these hold:
 *   - the tool is the subagent spawn (tool_name Task or Agent), and
 *   - subagent_type is a BUILT-IN bulk agent that inherits the session model —
 *     "Explore", "general-purpose", or empty (empty defaults to general-purpose).
 *     Custom agents carry their own `model:` frontmatter, so they are NEVER touched, and
 *   - no `model` was pinned on the spawn (a deliberate model choice, including an
 *     intentional opus, is always respected).
 *   → rewrite tool_input via `updatedInput` to add `model`: `"haiku"` for Explore (pure
 *     read-only lookup — the cheapest tier fits), `"sonnet"` for general-purpose / empty
 *     (may involve multi-step work, so it keeps the higher floor). Also inject an
 *     `additionalContext` note so the model knows it was auto-pinned and can re-issue
 *     with `model: "opus"` when the search genuinely needs cross-file reasoning.
 *
 * WHY no permissionDecision: setting "allow" would skip the user's Task permission
 * prompt; this plugin only pins the tier, it must not change permission behavior. We
 * supply updatedInput + additionalContext and let the normal permission flow proceed
 * against the rewritten input. We never deny — the spawn is never blocked, only re-tiered.
 *
 * WHY it can't be smarter about the tier: PreToolUse stdin carries no session model and
 * no reliable way to tell a mechanical search from a reasoning one. So it applies the
 * cheap floor (sonnet) — a no-op when the session is already sonnet, a real saving when
 * it is premium — and delegates the sonnet-vs-opus judgment back to the model via the note.
 *
 * FAIL-OPEN: any missing/odd input -> emit nothing -> the spawn proceeds unchanged.
 * Reads stdin only, writes nothing. Pure Node (Claude Code ships Node).
 */
'use strict';
const fs = require('fs');

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

  // Explore is pure read-only lookup (find files/symbols) — pin it to the cheapest
  // tier. general-purpose (and the empty default, which resolves to general-purpose)
  // can involve multi-step tasks, so it keeps the sonnet floor.
  const label = st || 'general-purpose';
  const tier = st === 'explore' ? 'haiku' : 'sonnet';
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      updatedInput: Object.assign({}, ti, { model: tier }),
      additionalContext:
        'Model economy: auto-pinned this ' + label + ' subagent to `model: ' + tier + '` — ' +
        'bulk work delegated to a subagent should run on a cheaper tier, not your premium session model. ' +
        'If this task genuinely needs cross-file reasoning or synthesis, re-issue it with `model: opus`' +
        (tier === 'haiku' ? ' (or `model: sonnet` for a middle tier).' : '.'),
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
} catch (_) {
  passthrough();
}
