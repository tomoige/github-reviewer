# GitReview AI

**Live:** [gitreview.thomascormican.xyz](https://gitreview.thomascormican.xyz)

A lightweight web app that analyzes any public GitHub profile with a budget-friendly LLM and returns an instant, structured performance report: scores, metric breakdowns, per-repo critiques, a personalized roadmap, and more.

The LLM provider is configurable via any OpenAI-compatible API. It defaults to **Groq** (free + fast), and works with Google Gemini, OpenRouter, or OpenAI by changing a couple of env vars.

This is the MVP: no database, no auth, no payments. Everything is processed in-memory during the request lifecycle.

## Architecture

Monorepo with two apps:

- **`backend/`** — Express + TypeScript API following the Controller-Service-Repository (CSR) pattern.
  - `routes/` maps `POST /api/review` to the controller.
  - `controllers/` validates the username and coordinates the request (no business logic).
  - `services/` holds `githubService` (GitHub REST/GraphQL), `aiService` (structured LLM output), and deterministic insight helpers (activity, pins, language breakdown, etc.).
  - `repositories/` is an in-memory placeholder cache (no ORM), ready for Phase 2 DB work.
  - `schemas/` defines the Zod report schema used for both the LLM structured output and validation.
- **`frontend/`** — Next.js + TypeScript dashboard that submits a username and renders the report. Includes `sitemap.xml`, `robots.txt`, and Vercel Web Analytics.

```
Next.js UI  ──POST /api/review {username}──>  Express controller
                                              ├─ githubService → GitHub API
                                              └─ aiService → OpenAI-compatible LLM
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
npm run build       # production build for both apps
```

Run `npm run backend` and `npm run frontend` in two terminals (or `npm run dev` in one).

> First run creates `backend/.env` and `frontend/.env.local` automatically. You still need to open `backend/.env` and add your `LLM_API_KEY` (a free [Groq](https://console.groq.com/keys) key by default).

Open http://localhost:3000, enter a public GitHub username, and review.

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
| `LLM_MODEL`     | No       | Model id (default `llama-3.1-8b-instant`).                                  |
| `GITHUB_TOKEN`  | No       | Raises GitHub API rate limit (60/hr → 5000/hr). Required for contribution calendar. |
| `PORT`          | No       | API port (default `4000`).                                                  |
| `CORS_ORIGIN`   | No       | Allowed frontend origin(s), comma-separated (default `http://localhost:3000`). |

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
cp .env.example .env.local
npm run dev                  # starts http://localhost:3000
```

Frontend environment variables (`frontend/.env.local`):

| Variable                 | Required | Description                                                          |
| ------------------------ | -------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`    | Yes      | Backend base URL (local: `http://localhost:4000`).                   |
| `NEXT_PUBLIC_SITE_URL`   | No       | Canonical site URL for sitemap, robots, and metadata (no trailing slash). |

## API

### `GET /health`

Returns `{ "status": "ok" }`. Use for uptime checks.

### `POST /api/review`

Rate-limited to **1 request per IP per 60 seconds**.

Request body:

```json
{ "username": "torvalds" }
```

Success response (`200`):

```json
{ "username": "torvalds", "cached": false, "report": { /* ReviewReport */ } }
```

Error responses return `{ "error": "message" }` with an appropriate status:

- `400` — missing/invalid username, or the user has no public repositories.
- `404` — GitHub user not found.
- `429` — GitHub rate limit or review rate limit (wait and retry).
- `502` — GitHub or LLM request failed.

## Deployment

Production setup used for the live site:

| App      | Host    | Notes |
| -------- | ------- | ----- |
| Frontend | Vercel  | Root directory: `frontend`. Set env vars below. |
| Backend  | Render  | Root directory: `backend`. Set `LLM_API_KEY`, `GITHUB_TOKEN`, `CORS_ORIGIN`. |

**Frontend (Vercel)**

- `NEXT_PUBLIC_API_URL` — your Render (or other) API URL, e.g. `https://your-service.onrender.com`
- `NEXT_PUBLIC_SITE_URL` — your public site URL, e.g. `https://gitreview.thomascormican.xyz` (used for sitemap, canonical URLs, and Open Graph)

**Backend (Render)**

- `CORS_ORIGIN` — your frontend URL (comma-separated if you have preview + production origins)
- `LLM_API_KEY`, optional `GITHUB_TOKEN`

**DNS (subdomain on Vercel)**

For `gitreview.example.com`, add the project domain in Vercel and create the **CNAME** record Vercel shows (e.g. `gitreview` → `….vercel-dns-….com`). A hostname cannot have both a **CNAME** and a **TXT** record with the same name — use HTML meta tag verification in Search Console instead of a TXT on that subdomain if both are needed.

## Future roadmap

- **Phase 2** — Database integration (native driver, no heavy ORM): user history, shareable permanent report URLs, and cached payloads to dodge rate limits.
- **Phase 3** — GitHub OAuth for higher rate limits and private data.
- **Phase 4** — Stripe-gated premium tier (deep metrics, per-repo critique, PDF export) with a free base score and roast.

## License

MIT
