# GitReview AI

A lightweight web app that analyzes any public GitHub profile with a budget-friendly LLM and returns an instant, structured performance report: scores, metric breakdowns, per-repo critiques, a personalized roadmap, and a shareable roast.

The LLM provider is configurable via any OpenAI-compatible API. It defaults to **Groq** (free + fast), and works with Google Gemini, OpenRouter, or OpenAI by changing a couple of env vars.

This is the MVP: no database, no auth, no payments. Everything is processed in-memory during the request lifecycle.

## Architecture

Monorepo with two apps:

- **`backend/`** - Express + TypeScript API following the Controller-Service-Repository (CSR) pattern.
  - `routes/` maps `POST /api/review` to the controller.
  - `controllers/` validates the username and coordinates the request (no business logic).
  - `services/` holds `githubService` (GitHub REST API) and `aiService` (OpenAI structured output).
  - `repositories/` is an in-memory placeholder cache (no ORM), ready for Phase 2 DB work.
  - `schemas/` defines the Zod report schema used for both the LLM structured output and validation.
- **`frontend/`** - Next.js + TypeScript dashboard that submits a username and renders the report.

```
Next.js UI  ──POST /api/review {username}──>  Express controller
                                              ├─ githubService → api.github.com
                                              └─ aiService → OpenAI gpt-4o-mini
                                              └─ returns structured ReviewReport JSON
```

## Prerequisites

- Node.js 18+ (developed on Node 24)
- A free LLM API key. Recommended: [Groq](https://console.groq.com/keys) (no cost, fast).
- (Optional) A GitHub personal access token to raise the API rate limit

## Quick start (recommended)

From the repo root, these scripts auto-copy the `.env` files from their examples and install dependencies on first run:

```bash
npm run backend     # prepares + starts the API on http://localhost:4000
npm run frontend    # prepares + starts the dashboard on http://localhost:3000
npm run dev         # runs both together (prefixed output)
npm run install:all # install both apps' dependencies up front
```

Run `npm run backend` and `npm run frontend` in two terminals (or `npm run dev` in one).

> First run creates `backend/.env` and `frontend/.env.local` automatically. You still need to open `backend/.env` and add your `LLM_API_KEY` (a free [Groq](https://console.groq.com/keys) key by default).

## Manual setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit .env and add your LLM_API_KEY
npm run dev            # starts http://localhost:4000
```

Backend environment variables (`backend/.env`):

| Variable        | Required | Description                                                                 |
| --------------- | -------- | --------------------------------------------------------------------------- |
| `LLM_API_KEY`   | Yes      | API key for your LLM provider (e.g. a free Groq key).                       |
| `LLM_BASE_URL`  | No       | OpenAI-compatible base URL (default Groq: `https://api.groq.com/openai/v1`). |
| `LLM_MODEL`     | No       | Model id (default `llama-3.3-70b-versatile`).                               |
| `GITHUB_TOKEN`  | No       | Raises GitHub API rate limit (60/hr → 5000/hr).                             |
| `PORT`          | No       | API port (default `4000`).                                                  |
| `CORS_ORIGIN`   | No       | Allowed frontend origin(s) (default `http://localhost:3000`).               |

### Using a different provider

The backend talks to any OpenAI-compatible API. To switch, set `LLM_BASE_URL`, `LLM_MODEL`, and `LLM_API_KEY`:

| Provider   | `LLM_BASE_URL`                                              | Example `LLM_MODEL`                       |
| ---------- | ---------------------------------------------------------- | ----------------------------------------- |
| Groq       | `https://api.groq.com/openai/v1`                           | `llama-3.3-70b-versatile`                 |
| Gemini     | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash`                        |
| OpenRouter | `https://openrouter.ai/api/v1`                             | `meta-llama/llama-3.3-70b-instruct:free`  |
| OpenAI     | `https://api.openai.com/v1`                                | `gpt-4o-mini`                             |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL defaults to http://localhost:4000
npm run dev                  # starts http://localhost:3000
```

Open http://localhost:3000, enter a public GitHub username, and review.

## API

### `POST /api/review`

Request body:

```json
{ "username": "torvalds" }
```

Success response (`200`):

```json
{ "username": "torvalds", "cached": false, "report": { /* ReviewReport */ } }
```

Error responses return `{ "error": "message" }` with an appropriate status:

- `400` - missing/invalid username, or the user has no public repositories.
- `404` - GitHub user not found.
- `429` - GitHub rate limit reached (add a `GITHUB_TOKEN`).
- `502` - GitHub or OpenAI request failed.

## Future Roadmap

- **Phase 2** - Database integration (native driver, no heavy ORM): user history, shareable permanent report URLs, and cached payloads to dodge rate limits.
- **Phase 3** - GitHub OAuth for higher rate limits and private data.
- **Phase 4** - Stripe-gated premium tier (deep metrics, per-repo critique, PDF export) with a free base score and roast.
