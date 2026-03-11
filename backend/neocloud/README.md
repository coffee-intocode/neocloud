# Neocloud API

FastAPI server for the Neocloud scaffold, with:

- Supabase JWT verification
- SQLAlchemy async session scaffolding for Supabase Postgres
- no restored app tables or migrations

Run locally:

```bash
uv sync
uv run uvicorn api.app:app --reload
```
