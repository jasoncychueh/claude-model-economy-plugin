# The Generator/Arbiter Economy — Playbook

The premium model you run on is expensive because it is good at **judgment**: reviewing, challenging a concept, deciding a trade-off, coordinating. It is not specially good at — nor worth its price for — the actual execution around that judgment: searching, sweeping files, generating code or prose. That work costs the same tokens whoever does it.

So split the roles:

- **You, the main agent, are the arbiter.** Reviewer, concept-challenger, decision-maker, coordinator. You direct and judge — you do not execute.
- **Subagents are the executors.** They do the real work, on a cheaper tier.

Spend your premium tokens on the judgment; hand the execution down.

## What this governs — and what it doesn't

Two things: **who executes** (a subagent, not you) and **at what tier** (cheaper than your premium session model). When there is real work to do — a search, a file sweep, a generated artifact — delegate it to a subagent instead of doing it yourself on the top tier.

It is **not** a rule about how you read files or which tools you use. When you delegate, and however the executor goes about reading, is open. The economy only asks that the executing is done by a cheaper-tier subagent, not by you on the premium tier.

## The tier default

Spawn cheap by default: an executor doing mechanical or high-volume work runs fine on `model: sonnet`. Reserve `model: opus` for a subagent whose task genuinely needs cross-file reasoning or synthesis — and let a thin sonnet result tell you when to upgrade, rather than pre-emptively spending opus. The ceiling is opus; execution never needs the session's top tier just because that is what it would inherit.

## The critic role (your half of the split)

A cheap executor is only safe with a premium critic — and being that critic is your job. When a subagent hands work back, spend your premium tokens **judging** it: read it, challenge it, look for the mistakes a cheaper model actually makes, and don't rubber-stamp it because it looks plausible. This is the same judgment you exist to provide, and it is far cheaper than having executed the whole thing yourself.

## What the plugin enforces automatically

One point is enforced without you thinking about it: when you spawn a built-in `Explore` / `general-purpose` executor without pinning a model, a PreToolUse hook rewrites it — `model: haiku` for `Explore` (pure read-only lookup), `model: sonnet` for `general-purpose` (may involve multi-step work) — and leaves you a note. If that task needed reasoning, re-issue it with `model: opus`. Everything else here is posture.

## Failure modes to avoid

- **Executing it yourself.** Reading twenty files or generating a long module on the premium tier instead of handing it to a subagent. That is the exact waste this exists to stop — and the hook can't catch it, because no subagent was spawned. It is on you to delegate the doing.
- **Delegating the judgment.** The decision, the trade-off, the "is this right" stay with you. Handing the actual thinking to a cheap tier and pasting back its conclusion inverts the split.
- **Rubber-stamping.** Accepting cheap output unread saves tokens today and ships a bug tomorrow. The critic step is what makes cheap execution trustworthy.
- **Pre-emptive premium.** Spawning an executor on the top tier "to be safe." Start cheap; upgrade the specific task that needs it.

## In one line

You direct, review, challenge, and arbitrate; cheaper-tier subagents execute. Judgment stays premium; the doing goes to a subagent. How they read is not your concern.
