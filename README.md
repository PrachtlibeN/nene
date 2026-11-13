# EchoRole (Nene)

Nền tảng nhập vai tình huống giao tiếp thực tế. The current foundation exposes
the versioned API contract and starts with non-health endpoints intentionally
returning `NOT_IMPLEMENTED` until their module ships.

## Requirements

- Python 3.11+
- Node.js 20+ and npm
- Ollama installed locally for real LLM calls (Phase 0 tests use fakes)

## Quickstart (PowerShell)

From the repository root, copy `.env.example` to `.env`, then assign values to
the variable names. Set `OLLAMA_MODEL` to a model already installed in Ollama.
The model is intentionally required; the application has no model-name default.

Backend, in terminal 1:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
python -m alembic upgrade head
$env:OLLAMA_MODEL = "your-installed-model"
uvicorn app.main:app --reload --port 8000
```

Frontend, in terminal 2:

```powershell
cd frontend
npm ci
npm run dev
```

The frontend uses MSW mocks by default; API calls are not sent to Ollama. To
exercise real local services, disable the mock worker in the frontend.

For CI parity, run `make test` and `make lint` from `backend/`, then
`npm run typecheck`, `npm run lint`, `npm run test -- --run`, and `npm run build`
from `frontend/`. The backend Makefile is optional on Windows; equivalent
commands are documented below and in `backend/pyproject.toml`.

## Branch protection

Protect `main` in GitHub repository settings: require pull requests, at least
one approval, and successful backend/frontend CI checks before merge. These
remote settings cannot be enabled by a local repository change.

Contract changes must use the `contract-change` label and update the contract,
backend schemas, canonical examples, and MSW mocks together.
