#!/usr/bin/env node
/*
 * model-economy — SessionStart economy reminder.
 *
 * Injects a short reminder at session start (startup / resume — filtered by the
 * hooks.json matcher) so the generator/arbiter split is present in EVERY session,
 * not only when some skill happens to trigger. A skill would under-trigger in casual
 * conversation; a SessionStart injection is the reliable "always-on" lever.
 *
 * Scope discipline: the reminder frames the main agent as the arbiter (reviewer /
 * concept-challenger / decision-arbiter / coordinator) and the subagents as the
 * executors that run on a cheaper tier. It says nothing about how to read files —
 * only WHO executes (a subagent, not the premium main agent) and AT WHAT TIER.
 *
 * The plugin root is passed as argv[2] (from ${CLAUDE_PLUGIN_ROOT} in hooks.json) so the
 * injected text can carry an absolute path to the playbook regardless of install location.
 *
 * SessionStart cannot block; it only injects context (hookSpecificOutput.additionalContext).
 * Side-effect-free: reads nothing, writes nothing.
 */
'use strict';
const path = require('path');

const root = process.argv[2] || process.env.CLAUDE_PLUGIN_ROOT || '';
const playbook = root
  ? path.join(root, 'references', 'economy-playbook.md')
  : "the plugin's references/economy-playbook.md";

const REMINDER = [
  '💠 Model economy is active — a generator/arbiter split.',
  '',
  'As the main agent you are the arbiter, not the executor: you review, challenge the concepts, arbitrate the decisions, and coordinate. The subagents are the actual executors — hand the real work to them on a cheaper tier, and spend your premium tokens judging and challenging what they return.',
  '',
  "- Delegate execution — searching, sweeping many files, generating code or docs — to a subagent; don't do the legwork yourself on the premium tier.",
  '- Un-pinned `Explore` spawns are auto-pinned to `model: haiku` (`general-purpose` to `model: sonnet`); re-issue with `model: opus` only if the task needs genuine cross-file reasoning.',
  "- A cheap executor is safe only with a premium critic — challenge the output, don't rubber-stamp it.",
  '',
  'This is about who executes (cheaper-tier subagents) and your role over them (reviewer / challenger / arbiter / coordinator) — not about how you read files.',
  '',
  'Full playbook: ' + playbook,
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: REMINDER,
  },
}));
