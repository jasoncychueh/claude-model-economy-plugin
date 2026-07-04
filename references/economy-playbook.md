# The Generator/Arbiter Economy — Everyday Playbook

The premium model you are running on is expensive because it is good at **judgment**: holding a conversation, deciding what matters, distilling a mess into a brief, and telling whether an answer is actually right. It is *not* specially good at the bulk legwork that surrounds that judgment — reading twenty files to find one thing, or typing out a long boilerplate module. That work costs the same number of tokens whoever does it, so paying the top tier to do it is pure waste.

The economy is one move: **keep the judgment on the premium model; push the bulk down to a cheaper tier.** You stay the arbiter; cheaper subagents are the generators.

This is a posture, not a ritual. The point is to stop burning premium tokens on legwork — not to wrap every task in subagents.

## The one rule that keeps this from being annoying: proportionality

Delegating has a fixed cost (spawning a subagent, briefing it, reading its result back). For small work that cost dwarfs the saving. So:

- **Quick or self-contained → just do it.** Answer the question, read the one file you already know, make the small edit. Spawning a subagent to fetch a known thing pays overhead for nothing.
- **Bulk or fan-out → delegate.** Sweeping many files, generating a long artifact, researching across sources — that is where a cheaper tier pays off.

When in doubt, ask "is the expensive part *judgment*, or *volume*?" Volume delegates; judgment stays with you.

## Reads: exploration goes to a cheaper tier

Broad exploration — sweeping many files to locate something, map a subsystem, or trace callers — is bulk work priced by how much gets read, not by how much judgment it needs. Delegate it to a built-in `Explore` / `general-purpose` agent, and **pin the tier** rather than letting it inherit your premium model:

| Search shape | Tier | Examples |
|---|---|---|
| Simple / mechanical | `model: sonnet` | locate a file, find a symbol's definition, enumerate callers, grep-style pattern hunts |
| Needs reasoning / synthesis | `model: opus` | understand how a subsystem fits together, judge which of several candidates is real, summarize a design spanning many files |

The ceiling is opus — a broad sweep never needs to ride the session's top tier by default.

**You do not have to remember to pin it.** This plugin's PreToolUse hook auto-pins any un-pinned `Explore` / `general-purpose` spawn to `sonnet` and leaves you a note. If the search you were about to run actually needs cross-file reasoning, just re-issue it with `model: opus` — the note is there to remind you the choice is yours.

**A known target needs no subagent at all.** When you already know the file or symbol, read it directly (`Grep` / `Read`, or codebase-memory graph tools). No spawn, no tier question.

**Why a cheaper sweep is safe:** the exploration is orientation, not the final word. Whatever you build on top of it, you review yourself on the premium tier — a slightly shallower cheap-tier sweep surfaces long before it can mislead you. If a sonnet sweep comes back thin, upgrade that one search to opus; don't pre-emptively run everything premium.

## Writes: bulk generation goes to a cheaper tier — but you stay the critic

Long code and long documents are the other half of the bulk. Delegate the *writing* to a subagent on a cheaper tier, and spend your tokens on the *specification* and the *review*:

1. **Brief, don't dictate.** Distill what you want into a tight brief — the contract, the constraints, the shape. That distillation is judgment; it stays with you.
2. **Let the cheaper tier generate** the bulk artifact from the brief.
3. **Challenge what comes back.** This is the load-bearing step. A cheap generator is only safe with a premium critic: read the result against the brief, look for drift, invented scope, and the mistakes a cheaper model actually makes. Do not rubber-stamp it because it looks plausible — plausible-but-wrong is exactly the failure mode you are on the premium tier to catch.

If you would not trust the output without reading it, then reading-and-challenging it *is* the work you keep — and it is far cheaper than having generated the whole thing yourself.

## The arbiter's failure modes (avoid these)

- **Delegating the judgment.** The decision, the trade-off, the "is this right" — those are yours. If you hand the actual thinking to a cheap tier and paste back its conclusion, you have inverted the economy.
- **Rubber-stamping.** Accepting cheap output unread saves tokens today and ships a bug tomorrow. The challenge is not optional; it is what makes the cheap generation trustworthy.
- **Ceremony on trivia.** Spawning a subagent, a brief, and a review loop for a one-line answer. Proportionality first.
- **Pre-emptive premium.** Running a broad search on opus/fable "to be safe." Start at the cheap floor; upgrade the specific search that needs it.

## In one line

Bulk reading and bulk writing are legwork — delegate them to a cheaper tier and stay the critic. Judgment, distillation, and the final call are what the premium model is for. Everything small, you just do.
