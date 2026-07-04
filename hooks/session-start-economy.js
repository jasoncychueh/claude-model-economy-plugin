#!/usr/bin/env node
/*
 * model-economy — SessionStart economy reminder.
 *
 * Injects a short reminder at session start (startup / resume — filtered by the
 * hooks.json matcher) so the generator/arbiter economy is present in EVERY session,
 * not only when some skill happens to trigger. A skill would under-trigger in casual
 * conversation; a SessionStart injection is the reliable "always-on" lever.
 *
 * The reminder is deliberately short (it costs context every session) and points at
 * references/economy-playbook.md for the full split. The plugin root is passed as
 * argv[2] (from ${CLAUDE_PLUGIN_ROOT} in hooks.json) so the injected text can carry an
 * absolute, clickable path to the playbook regardless of where the plugin is installed.
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
  '💠 Model economy is active — a generator/arbiter split for everyday work.',
  '',
  'Spend the premium session model on judgment: conversing, deciding, distilling, and challenging what subagents hand back. Push the bulk legwork down to a cheaper tier:',
  '',
  '- **Bulk reading / exploration** (sweeping many files to locate, map, or trace): delegate to an Explore / general-purpose agent. Un-pinned exploration spawns are auto-pinned to `model: sonnet`; re-issue with `model: opus` if the search needs cross-file reasoning. A known target needs no subagent — read it directly (Grep / Read).',
  '- **Bulk generation** (long code or docs): delegate to a subagent on a cheaper tier, then review and challenge the result instead of trusting it blindly — a cheap generator is only safe with a premium critic.',
  '',
  "Apply this **proportionally**: answer quick things directly, don't spawn subagents for trivia. The goal is to stop burning premium tokens on legwork, not to add ceremony.",
  '',
  'Full playbook (read when doing substantial multi-step work): ' + playbook,
].join('\n');

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: REMINDER,
  },
}));
