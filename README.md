# Agent Repo

A chat-based AI agent for capturing, classifying, storing, and retrieving tasks, ideas, follow-ups, and technical resources.

This project is designed as a **small but real agent systems case study**. It is not just a Telegram bot and not just a notes app. It combines:

- a real-time chat channel
- structured memory
- retrieval workflows
- operational state changes
- validation guardrails
- optional LLM-enhanced classification
- an inbox UI for review and triage

It is meant to showcase practical skills in:

- AI agents
- prompt and context design
- memory quality
- retrieval UX
- agent operations
- chat-native product workflows

## Why This Exists

The original problem was simple:

useful repos, docs, links, ideas, and follow-ups kept getting lost inside chat threads.

The broader goal became more interesting:

build an agent that can receive messy real-world input from chat, decide what is worth keeping, store it as structured memory, and make that memory useful later through search, filtering, and operational actions.

That makes this project closer to an **agent workflow system** than to a basic note taker.

## What the Agent Does

The agent accepts:

- tasks
- ideas
- reminders
- follow-ups
- notes
- GitHub repositories
- documentation links
- tools and references
- Telegram voice notes

For each useful input, it:

1. validates whether the input should be stored
2. classifies the content into a meaningful category
3. extracts tags, links, context, and a summary
4. stores it as structured memory
5. exposes it through UI and chat retrieval flows

## Core Use Cases

### 1. Technical resource capture

Example:

`Save this repo for auth reuse later https://github.com/...`

The agent detects:

- this is a resource
- it is a repo
- it should be tagged and summarized
- it should stay retrievable later by project or resource type

### 2. Operational follow-ups

Example:

`Remind me to talk to Nico on Friday about the deploy`

The agent stores:

- category
- follow-up date hint
- tags
- suggested next action

### 3. Idea capture

Example:

`Idea: build a product that organizes all the links I send myself`

The agent keeps the idea searchable and editable instead of leaving it buried in chat.

### 4. Memory retrieval

The user can later retrieve:

- all repos
- all open items
- documentation only
- items from a project
- items in a date range

### 5. Operational triage

Items can be moved between:

- `open`
- `done`
- `archived`

That turns memory into something operable, not just stored.

## Why This Is Relevant to Agent/Product/Ops Roles

This project is intentionally aligned with the kind of work done in agentic product and operations teams.

It demonstrates:

- **chat-native agent design** instead of only prompt experiments
- **structured memory** instead of raw conversation storage
- **input validation** to protect memory quality
- **retrieval flows** designed around real operational use
- **channel integration** through Telegram
- **stateful workflows** like open, done, archive
- **graceful degradation** when external AI services are unavailable

In other words, it shows practical thinking around:

- how agents should ingest messy human input
- how they should avoid storing garbage
- how memory should stay useful over time
- how a lightweight agent can support real product and ops workflows

## Current Feature Set

### Channels

- Telegram bot via long polling
- local web interface

### Classification

- `task`
- `idea`
- `reminder`
- `follow_up`
- `note`
- `resource`

Resource subtypes:

- `repo`
- `documentation`
- `tool`
- `article`
- `video`
- `reference`

### Retrieval and Ops

- search by text
- filter by category
- filter by resource type
- filter by status
- filter by project
- filter by date range
- mark items as open, done, or archived
- edit project and tags from the UI

### Voice Notes

Telegram voice notes are supported in the ingestion flow.

If an OpenAI API key is configured, the agent attempts transcription before classification.

If no key is present, the system fails gracefully and tells the user that transcription is unavailable.

## Telegram Commands

- `/start`
- `/help`
- `/items`
- `/items open`
- `/items done`
- `/resources`
- `/resources repo`
- `/resources documentation`
- `/today`
- `/search auth`
- `/done 123456`
- `/archive 123456`
- `/open 123456`

## Guardrails

This project deliberately rejects low-value input.

Examples:

- unknown slash commands
- generic noise like `respuesta`
- ambiguous low-context content that is not worth storing

This matters because a memory agent that stores everything becomes noisy and unhelpful very quickly.

## System Architecture

```text
Telegram / Web UI
        |
        v
 Input validation
        |
        v
 Classification layer
  - heuristic rules
  - optional LLM path
        |
        v
 Structured memory
        |
        +--> Web review UI
        |
        +--> Telegram retrieval and triage
```

Supporting docs:

- [Architecture](./docs/architecture.md)
- [Design Decisions](./docs/design-decisions.md)
- [Portfolio Positioning](./docs/portfolio-positioning.md)

## Running Locally

```bash
git clone <your-repo-url>
cd agent-repo
cp .env.example .env
```

Then fill `.env` as needed.

### Web UI

```bash
npm start
```

Open:

- [http://localhost:3000](http://localhost:3000)

### Telegram

1. Create a bot with `@BotFather`
2. Copy the API token into `.env`
3. Run:

```bash
npm run telegram
```

## Environment Variables

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
TELEGRAM_BOT_TOKEN=
ENABLE_TELEGRAM=true
```

## Validation

```bash
npm run check
npm run demo
```

## Project Structure

```text
config/      prompts and agent configuration
data/        local runtime data
docs/        architecture, design, portfolio framing
public/      web interface
src/         agent logic, transport, storage, validation
```

## Portfolio Framing

This repo is useful as a portfolio piece for roles involving:

- AI agents
- prompt engineering
- product operations
- agent workflows
- context and memory design
- channel orchestration

It works especially well as evidence that you can:

- build a working agent end-to-end
- think about memory quality, not only prompts
- connect a real communications channel
- design operational actions around agent output

## Roadmap

- move storage from JSON to SQLite or Postgres
- add semantic retrieval
- split responsibilities into multiple cooperating agents
- add WhatsApp support
- improve audio and summarization workflows
- generate project-level memory summaries

## License

MIT
