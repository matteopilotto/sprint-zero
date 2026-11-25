# Granola clone API (server)

A FastAPI backend that stores accounts and meeting notes in a local SQLite file (`server/data.db`) and issues its own login tokens. **You do not need an account, API key, or `.env` file to run it.** The demo login is printed when you run the seed.

## Run it

From the `server/` folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py                     # creates the tables and the demo user, prints the login
uvicorn main:app --port 8000       # API on http://localhost:8000
```

Demo login: `priya@northwind.io` / `granola-demo-1`. Running the seed again resets the demo user's notes. Tables are also created automatically when the server starts.

## Optional settings

Set these as environment variables, or put them in `server/.env` (copy `.env.example`). The server loads that file on startup, and git ignores it.

- `ANTHROPIC_API_KEY`: if this is set, "Enhance" uses Claude (model from `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`). If it is not set, a local rule-based enhancer is used, and its output has the same sections.
- `JWT_SECRET`: the secret used to sign tokens. The default is `sprint-zero-dev-secret`.

## Files

- `main.py`: the app, CORS for `http://localhost:5173`, and the error format `{ "error", "message" }`
- `auth.py`: signup, login, `/auth/me`, and the token check used by every protected route
- `notes.py`: note create, list, get, update, delete and enhance
- `templates.py`: the four built-in templates
- `enhancer.py`: the Claude enhancer and the local enhancer, kept in one module
- `db.py`: the SQLite connection and schema
- `seed.py`: the demo data

The endpoints are documented in `docs/api-contract.md`.
