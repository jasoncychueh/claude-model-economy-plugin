# The Generator/Arbiter Economy — Playbook

Your job as the main agent is **judgment**: reviewing, challenging a concept, deciding a trade-off, coordinating. The session may run a premium tier above opus — worth its price for exactly that judgment, not for the execution around it: searching, sweeping files, generating code or prose. That is volume work, and where it runs decides what it costs.

So split the roles:

- **You, the main agent, are the arbiter.** Reviewer, concept-challenger, decision-maker, coordinator. You direct and judge — you do not execute.
- **Subagents are the executors.** They do the real work, each in its own context.

Spend your tokens on the judgment; hand the execution down.

## Why delegating saves — two levers

**The tier.** On a premium session, execution you hand to a subagent pinned at opus or haiku is no longer paid at premium rates.

**The context — and this one holds on any model.** Your context is re-read on every turn for the rest of the session. Twenty files you read yourself stay in it and are paid for again on each turn after. A subagent reads them in its own context, which ends with the dispatch, and hands back a conclusion a few hundred words long. Even when you and the subagent run the same model, delegating still saves.

"Cheaper" does not mean "smaller model", though. On current models a stronger model at moderate effort often costs less per task than a weaker one pushed to high effort — the economical executor tier is opus, not sonnet.

## What this governs — and what it doesn't

Two things: **who executes** (a subagent, not you) and **at what tier** (haiku or opus — never inherited from a premium session). When there is real work to do — a search, a file sweep, a generated artifact — delegate it to a subagent instead of doing it yourself.

It is **not** a rule about how you read files or which tools you use. When you delegate, and however the executor goes about reading, is open. The economy only asks that the executing is done by a subagent, not by you.

## The tier default

- **Mechanical lookup** — locate a file, find a symbol, enumerate callers: `model: haiku`. The cheapest tier by a wide margin, and lookup needs no reasoning.
- **Everything else** — multi-step work, anything that must reason or synthesize across files: opus at medium effort — the plugin's `model-economy:worker` agent.
- **Not sonnet.** On current per-task cost measurements, opus at medium effort is both smarter than sonnet and cheaper than sonnet at high effort; sonnet no longer earns a middle slot.

A spawn cannot set its effort level: a built-in subagent inherits the session's, so a model pin alone leaves an executor at high or xhigh when the session runs there. An agent's frontmatter can set effort, which is why multi-step work goes to `model-economy:worker` rather than to `general-purpose` with a model pin. `Explore` still inherits the session's effort — a lookup spends little on thinking either way.

## The critic role (your half of the split)

Delegated execution is only safe with a critic — and being that critic is your job. When a subagent hands work back, spend your tokens **judging** it: read it, challenge it, look for the mistakes an executor working from a narrow context actually makes, and don't rubber-stamp it because it looks plausible. This is the same judgment you exist to provide, and it is far cheaper than having executed the whole thing yourself.

## What the plugin enforces automatically

One point is enforced without you thinking about it: when you spawn a built-in `Explore` / `general-purpose` executor without pinning a model, a PreToolUse hook rewrites it — `Explore` gets `model: haiku` (pure read-only lookup), `general-purpose` is redirected to `model-economy:worker` (opus at medium effort, for multi-step work) — and leaves you a note. Pinning `model` yourself opts out of both. If an `Explore` task turned out to need reasoning, re-issue it with `model: opus`. Everything else here is posture.

## Failure modes to avoid

- **Executing it yourself.** Reading twenty files or generating a long module in your own context instead of handing it to a subagent. That is the exact waste this exists to stop — and the hook can't catch it, because no subagent was spawned. It is on you to delegate the doing.
- **Delegating the judgment.** The decision, the trade-off, the "is this right" stay with you. Handing the actual thinking to an executor and pasting back its conclusion inverts the split.
- **Rubber-stamping.** Accepting delegated output unread saves tokens today and ships a bug tomorrow. The critic step is what makes delegated execution trustworthy.
- **Riding the premium tier by default.** An un-pinned spawn inherits whatever the session runs. Pin the tier the task needs; the ceiling for execution is opus.

## In one line

You direct, review, challenge, and arbitrate; subagents execute in their own contexts. Judgment stays with you, on whatever tier the session runs; the doing goes to a subagent at haiku or opus. How they read is not your concern.
