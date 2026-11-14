# EchoRole

Local-first practice for realistic communication scenarios. The backend runs
roleplay and evaluation through Ollama by default, with an optional
OpenAI-compatible cloud provider; speech recognition uses a local
faster-whisper model, and browser speech synthesis speaks interviewer replies.

## Requirements

- Python 3.11 or newer (validated on this machine with Python 3.14.0)
- Node.js 20 or newer and npm (validated with Node.js 26.13.1 and npm 11.20.0)
- Ollama with the model configured in `.env`

## Quickstart (PowerShell)

From the repository root, copy the recommended local configuration:

```powershell
Copy-Item .env.example .env
```

The template selects Ollama, the locally installed candidate, and the cached
Whisper model. [The benchmark report](docs/architecture/LLM_BENCHMARK.md)
records benchmark coverage and any remaining acceptance gaps. Change
`OLLAMA_MODEL` or `WHISPER_MODEL` in `.env` when using different local models.
The 180-second LLM timeout and 1200-token
Coach budget allow evaluation output to finish on the CPU-only benchmark
machine; evaluations run asynchronously and the frontend polls for their result.

### OpenAI-compatible cloud providers

To use a cloud provider, set `LLM_PROVIDER=openai_compatible` in `.env`, then
configure `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_API_KEY`. The key is
blank in the template; provide your own key locally and never commit it. An
empty key omits bearer authentication, which is useful for compatible local
services. The backend sends standard `/chat/completions` requests and uses
`/models` for provider health checks.

For example, Groq uses a base URL such as
`https://api.groq.com/openai/v1`; Gemini's OpenAI-compatible API uses
`https://generativelanguage.googleapis.com/v1beta/openai/`. Use a model name
supported by the selected provider. Replace the base URL, model, and key in
your local `.env`; do not put credentials in this file in version control.

Backend, in terminal 1:

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Frontend, in terminal 2:

```powershell
cd frontend
npm ci
npm run dev
```

Mocks are disabled by default, so the browser calls
`http://localhost:8000/api/v1`. To opt into MSW for frontend-only work, set the
flag before starting Vite:

```powershell
$env:VITE_USE_MOCKS = "true"
npm run dev
```

Set it to `"false"` (or remove it) and restart Vite to use the real backend.
`VITE_API_BASE_URL` can override the default backend address; for example:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:8000/api/v1"
```

## Validation

From `backend/`:

```powershell
python -m ruff check .
python -m mypy app
python -m pytest
```

From `frontend/`:

```powershell
npm run typecheck
npm run lint
npm test -- --run
npm run build
```

## Branch protection

Protect `main` in GitHub repository settings: require pull requests, at least
one approval, and successful backend/frontend CI checks before merge. These
remote settings cannot be enabled by a local repository change.

Contract changes must use the `contract-change` label and update the contract,
backend schemas, canonical examples, and MSW mocks together.
