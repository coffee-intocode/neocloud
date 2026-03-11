# Neocloud API

FastAPI backend for the NeoCloud Operator Console.

It includes:

- Supabase JWT verification
- SQLAlchemy async session management
- Alembic migrations
- Brokkr integration adapters
- app-owned operator endpoints under `/api/v1/operator/*`

Run locally:

```bash
uv sync
uv run python -m uvicorn api.app:app --reload --host 0.0.0.0 --port 8081
```

Why `python -m uvicorn`:

- the `uvicorn` console script can point at a stale interpreter if the virtualenv was recreated or moved
- `uv run python -m uvicorn ...` guarantees module execution with the interpreter selected by `uv run`
- this avoids missing-package errors caused by the wrong Python environment
