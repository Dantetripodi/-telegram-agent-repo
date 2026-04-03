# Architecture

## System Goal

Build a small but credible agent system that captures information from real conversations, stores it in structured memory, and lets the user retrieve and operate on that memory later.

## Core Components

### 1. Channel Layer

- Telegram bot
- Web UI

These are input surfaces, not the agent itself.

## 2. Validation Layer

Before saving anything, the system checks whether the message is worth storing.

Examples rejected:

- unknown slash commands
- low-context noise
- short junk-like entries

This protects memory quality.

## 3. Classification Layer

The classifier decides:

- category
- resource type
- summary
- tags
- project
- priority
- follow-up date
- suggested next action

Current mode:

- heuristics first
- optional LLM path when configured

## 4. Memory Layer

Each item is stored with structured fields:

- `id`
- `shortId`
- `createdAt`
- `source`
- `inputType`
- `category`
- `resourceType`
- `summary`
- `project`
- `tags`
- `status`
- `links`

## 5. Retrieval Layer

The system supports retrieval by:

- text
- category
- resource type
- status
- project
- date range

It also supports operational actions:

- mark open
- mark done
- archive
- edit project
- edit tags

## 6. Audio Flow

Telegram voice note:

1. Telegram sends voice metadata
2. bot retrieves file path
3. bot downloads audio
4. transcription is attempted if API key exists
5. transcript is passed through the same validation and classification pipeline

## Why This Matters

This project is intentionally small, but its architecture mirrors real agent systems:

- channel separation
- memory quality control
- retrieval workflows
- operational actions
- graceful degradation when external AI services are unavailable
