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
 * executors, each in its own context and at a tier no higher than opus. It says nothing
 * about how to read files — only WHO executes (a subagent, not the possibly-premium main
 * agent) and AT WHAT TIER.
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
  'As the main agent you are the arbiter, not the executor: you review, challenge the concepts, arbitrate the decisions, and coordinate. The subagents are the actual executors — hand the real work to them, and spend your tokens — premium ones, if the session runs a tier above opus — judging and challenging what they return.',
  '',
  "- Delegate execution — searching, sweeping many files, generating code or docs — to a subagent; don't do the legwork yourself. On a premium tier it is paid at premium rates; on any tier, whatever you read stays in your context and is paid for again on every later turn; a subagent's context ends with its dispatch.",
  '- Un-pinned `Explore` spawns are auto-pinned to `model: haiku`; re-issue one with `model: opus` if the task needs genuine cross-file reasoning. Un-pinned `general-purpose` spawns are redirected to `model-economy:worker` — opus at medium effort, since a spawn cannot set effort itself. Sonnet is not the economical middle tier: opus at medium effort beats it per task.',
  "- Delegated execution is safe only with a critic — challenge the output, don't rubber-stamp it.",
  '',
  'This is about who executes (subagents) and your role over them (reviewer / challenger / arbiter / coordinator) — not about how you read files.',
  '',
  'Full playbook: ' + playbook,
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: REMINDER,
  },
}));
