# Design Decisions

## Why Telegram First

Telegram is the fastest real channel to prototype with:

- free for developers
- easy bot creation
- no public webhook required with long polling

This makes it ideal for iterating on agent behavior before moving to WhatsApp.

## Why Validation Before Storage

A memory agent becomes useless if it stores junk.

That is why this project rejects:

- accidental slash commands
- generic one-word noise
- ambiguous low-context text

The goal is not to store everything. The goal is to store what is recoverable and useful.

## Why Structured Memory Instead of Raw Chat Logs

Raw chat history is searchable but weakly operational.

Structured memory makes it possible to:

- filter by intent
- build state transitions
- retrieve by project
- add follow-up workflows

## Why Heuristics Still Matter

Not every agent needs an LLM for every step.

This project keeps a rule-based path because:

- it is cheap
- it is deterministic
- it keeps the system usable without API credits

That choice also makes the system easier to demo in applications and interviews.

## Why Audio Is Optional

Audio support is useful, but transcription should not break the whole product.

If transcription credentials exist:

- voice notes become memory items

If not:

- the agent responds clearly and degrades gracefully

## Why This Is a Good Portfolio Project

It shows practical agent thinking rather than toy prompting:

- real channel integration
- memory design
- retrieval design
- operational commands
- state management
- guardrails
