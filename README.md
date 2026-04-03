# Agent Repo

An AI capture and retrieval agent for tasks, ideas, follow-ups, notes, and technical resources.

This project started as a personal inbox agent and evolved into a small **agent systems case study**:

- real chat channel via Telegram
- structured memory
- hybrid classification
- retrieval and filtering workflows
- operational state management
- audio-ready ingestion flow
- UI for reviewing, editing, and triaging memory

It is designed to demonstrate practical knowledge in:

- AI agents
- prompt and context design
- memory and retrieval
- guardrails against noisy input
- chat-based operational workflows
- multichannel agent architecture

## What It Does

You can send the agent:

- tasks
- ideas
- reminders
- follow-ups
- notes
- links
- GitHub repositories
- documentation
- tools
- voice notes from Telegram

The agent will:

1. validate the input before saving
2. classify the message into a useful category
3. extract tags, links, and context
4. persist it into structured memory
5. make it retrievable from the UI or Telegram commands

## Why This Project Exists

The original problem was simple: useful repos, links, and ideas were getting lost inside chat threads.

The broader design goal became more interesting:

- build a small but real agent
- connect it to a real channel
- give it memory
- make retrieval operationally useful
- prevent it from storing junk
- prepare it to grow into a multi-agent system

## Current Capabilities

### Ingestion

- Telegram bot via long polling
- Web UI input
- Batch message ingestion
- Optional audio transcription pipeline for Telegram voice notes

### Classification

- Categories: `task`, `idea`, `reminder`, `follow_up`, `note`, `resource`
- Resource types: `repo`, `documentation`, `tool`, `article`, `video`, `reference`
- GitHub repo detection
- Basic validation to reject commands and noisy low-value input
- Optional LLM-based classification with heuristic fallback

### Memory and Retrieval

- Structured JSON storage
- Search by text
- Filter by category
- Filter by resource type
- Filter by status
- Filter by project
- Filter by date range
- Edit project and tags from the UI

### Operations

- Mark items as `open`, `done`, or `archived`
- Retrieve items from Telegram
- Retrieve resources by type from Telegram
- Daily view from Telegram

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

## Architecture

High-level system:

```text
Telegram / Web UI
        |
        v
 Input validation
        |
        v
 Classification layer
  - heuristic rules
  - optional LLM routing
        |
        v
 Structured memory
        |
        +--> Web retrieval UI
        |
        +--> Telegram retrieval commands
```

More detail in:

- [Architecture](./docs/architecture.md)
- [Design Decisions](./docs/design-decisions.md)
- [Portfolio Positioning](./docs/portfolio-positioning.md)

## Run Locally

```bash
cd /Users/dantestefanotripodi/Documents/Projects/whatsapp-inbox-agent
cp .env.example .env
```

Fill in `.env` as needed.

### Web UI

```bash
npm start
```

Open:

- [http://localhost:3000](http://localhost:3000)

### Telegram Bot

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

## Notes on LLM Usage

This project works **without** an OpenAI API key.

If `OPENAI_API_KEY` is present:

- classification can use LLM routing
- Telegram voice notes can be transcribed

If not:

- the agent still works with heuristic classification
- audio ingestion gracefully falls back with a user-facing message

## Guardrails

The agent intentionally rejects:

- unknown slash-commands
- low-value noisy input like `respuesta`
- ambiguous command-like text without real content

This is important because a memory agent that stores junk becomes useless very quickly.

## Portfolio Framing

This project is useful in interviews and applications because it demonstrates:

- chat-native agent design
- context and memory modeling
- retrieval workflows
- operational agent UX
- hybrid rule/LLM architecture
- real channel integration

## Roadmap

- SQLite or Postgres storage
- semantic retrieval
- multi-agent split: capture agent + prioritization agent + retrieval agent
- WhatsApp integration
- richer audio workflow
- project-level memory summaries

## Project Structure

```text
config/      prompts and configuration
data/        local runtime data
docs/        architecture, design, positioning
public/      web interface
src/         agent logic, transport, storage, validation
```

## Validation

```bash
npm run check
npm run demo
```

## License

MIT
