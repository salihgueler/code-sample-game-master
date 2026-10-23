# D&D Game Master Frontend

A React + Vite frontend for the Once Upon Agentic AI workshop. Connects to the Game Master orchestrator API to provide an immersive D&D experience.

## Prerequisites

- Node.js 18+
- The Game Master backend running (see Chapter 5 of the workshop)

## Setup

```bash
cd sample-once-upon-agentic-ai-typescript-frontend
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:5173

## Usage

1. Fill in your character details (name, gender, race, class)
2. Click "Begin Adventure" to create your character and begin the adventure
3. Chat with the Game Master, click action suggestions, and roll dice

API requests (`/inquire`, `/user`) are proxied by the Vite dev server to the Game Master backend at `http://localhost:8009` (see `vite.config.ts`).

## Build

```bash
npm run build
```

Output goes to `dist/`.
