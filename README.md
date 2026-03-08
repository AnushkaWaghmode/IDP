# IDP Local Development

## One-command start

From `IDP/` run:

```powershell
.\start-dev.ps1
```

or:

```bat
start-dev.cmd
```

This starts:

- Backend API: `http://localhost:8000`
- Frontend app: `http://localhost:5173`
- Runs backend migrations automatically (`alembic upgrade head`) before API startup

## Backend setup

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Database migrations (Alembic)

```powershell
cd Backend
alembic upgrade head
```

Create a new migration after model changes:

```powershell
cd Backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

One-time schema repair for existing mixed/legacy DBs (non-destructive, creates only missing tables):

```powershell
cd Backend
python scripts\repair_schema.py
```

If you only want table repair without Alembic stamp:

```powershell
python scripts\repair_schema.py --no-stamp
```

## Frontend setup

```powershell
cd Frontend\IDP
npm install
copy .env.example .env
```

## API base URL

Frontend uses `VITE_API_BASE_URL` from `.env`.

- Default for local dev (recommended): `/api/v1` (uses Vite proxy)
- Direct API URL option: `http://localhost:8000/api/v1`

## Notes

- Production-style startup now expects migrations to be run.
- Set `AUTO_CREATE_TABLES=true` in backend `.env` only if you want startup-time auto table creation in local experiments.
