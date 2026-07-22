# HUSSAM PLATFORM V3.0 — SYSTEM BASELINE INVENTORY (PHASE 1)

This document is an evidence-first inventory required to govern the Phase‑1 Domain Driven refactor. No code modified.

Repo: hosamahad57-collab/hussam-platform-v2
Date: 2026-07-22

-------------------------
Repository Reality Map (evidence-first)
-------------------------

Top-level entries (evidence: GitHub contents API):
- .mgx/ (directory) — path: `.mgx` (repo root)
- LICENSE — path: `LICENSE`
- README.md — path: `README.md`
- backend/ (directory) — path: `backend/`
- frontend/ (directory) — path: `frontend/`
- start_app_v2.sh — path: `start_app_v2.sh`

Backend top-level (evidence: `backend/` contents API and files opened):
- backend/main.py — FastAPI startup & router auto-discovery (evidence: `backend/main.py` lines 82-87, 102-154)
- backend/pyproject.toml — project dependencies (evidence: `backend/pyproject.toml` lines 12-16)
- backend/alembic/env.py — migration runner & include_object filter (evidence: `backend/alembic/env.py` lines 25-39, 41-46, 49-75)
- backend/routers/ — submodules (evidence: `backend/routers/*` listing)
- backend/services/ — submodules (evidence: `backend/services/*` listing)
- backend/models/ — SQLAlchemy models (evidence: `backend/models/*.py` listing)
- backend/core/ — protected configuration code referenced in README (evidence: `backend/README.md` lines 70-79 and strict rules 86-93)

Frontend top-level (evidence: `frontend/` contents):
- frontend/README.md (evidence: `frontend/README.md`)
- frontend/package.json (evidence: `frontend/package.json`)
- frontend/src/ (evidence: `frontend/src/*` listing; entry points `frontend/src/main.tsx`, `frontend/src/App.tsx`)

Files & counts (evidence: repository listings retrieved during audit):
- backend/routers: 21 files discovered (evidence: API response listing under `backend/routers`)
- backend/services: 23 files discovered (evidence: API response listing under `backend/services`)
- backend/models: 12 files discovered (evidence: API response listing under `backend/models`)
- frontend/src: tree exists with App.tsx & main.tsx (evidence: `frontend/src/App.tsx`, `frontend/src/main.tsx`)

Language distribution (evidence: repo metadata provided in session context):
- Python: ~55.4% (evidence: repository language composition provided in session context)
- TypeScript: ~37.6% (evidence: same)
- Shell, JavaScript, CSS, HTML, Mako small percentages (evidence: same)

Dependency declarations (evidence):
- backend/pyproject.toml — declares core python deps: fastapi, uvicorn, pydantic (evidence: `backend/pyproject.toml` lines 12-16)
- backend/requirements.txt and requirements.default are present (evidence: `backend/requirements.txt` and `backend/requirements.default` file entries)
- frontend/package.json declares frontend deps (evidence: `frontend/package.json` present)

Migration config (evidence):
- backend/alembic/env.py — uses `Base.metadata` from `core.database` and auto-imports models under `models` (evidence: `backend/alembic/env.py` lines 25-39 and 29-32)
- env.py excludes tables: users, sessions, oidc_states (evidence: `backend/alembic/env.py` lines 41-46)
- alembic.ini exists (evidence: `backend/alembic.ini` in backend listing)

API / Route evidence (sample entries):
- `backend/routers/accounts.py`: defines `router = APIRouter(prefix="/api/v1/entities/accounts", tags=["accounts"])` and uses `AccountsService` (evidence: `backend/routers/accounts.py` lines 17, 12)
- `backend/routers/aihub.py`: defines `router = APIRouter(prefix="/api/v1/aihub", tags=["aihub"])` and endpoints `/gentxt`, `/genimg`, `/genvideo`, `/genaudio`, `/transcribe`, `/analyzepdf` (evidence: `backend/routers/aihub.py` lines 114-117, and endpoint function definitions)
- `backend/main.py` auto-includes all routers discovered in package `routers` (evidence: `backend/main.py` lines 102-154)

Authentication & identity evidence:
- README: "User management is FULLY handled by Atoms Cloud's builtin user table" (evidence: `backend/README.md` lines 100-101)
- Alembic excludes identity tables (evidence: `backend/alembic/env.py` lines 41-46)

AI subsystem evidence:
- `backend/services/aihub.py` implements AI features including text/image/video/audio/pdf handling (evidence: `backend/services/aihub.py` docstring and functions such as `gentxt`, `genimg`, `genvideo`, `genaudio`, `transcribe`, `analyze_pdf`)
- `backend/routers/aihub.py` exposes these endpoints (evidence: `backend/routers/aihub.py`)
- Token usage accounting structure referenced in `aihub.py` (evidence: `backend/services/aihub.py` lines 135-142 and ai_logs model present `backend/models/ai_logs.py`)

Compiler evidence:
- `backend/services/compiler_service.py` present and sizable (evidence: `backend/services/compiler_service.py` file listing)
- `backend/routers/compiler.py` exposes compiler endpoints (evidence: `backend/routers/compiler.py` file listing)
- README references HUS Compiler v6 Engine and pipeline stages (evidence: `README.md` lines 12-16)

Workers / Background processing evidence:
- No dedicated `workers/` top-level dir found in the backend listing — `backend/logs` exists. (evidence: `backend/` listing)
- Long-running tasks are executed inline in services (e.g., `genvideo` in `backend/services/aihub.py` uses polling loops) — evidence: `backend/services/aihub.py` lines 751-758

CI/CD / Docker evidence:
- No `.github/workflows/` files found in the inspected listing (evidence: none present in retrieved directory listings). Marked as UNKNOWN — Requires Verification
- No Dockerfile found at top-level or in backend/frontend in the inspected listing. Marked as UNKNOWN — Requires Verification

Test coverage evidence:
- No `tests/` directory discovered in the repository snapshot during the scan. Marked as UNKNOWN — Requires Verification

-------------------------
Dependency Graph (Router → Service → Model) — selected mapping (evidence-first)
-------------------------
- accounts router → AccountsService → models.accounts → DB table `accounts`
  - Evidence: `backend/routers/accounts.py` imports `AccountsService` and defines router; `backend/services/accounts.py` exists; `backend/models/accounts.py` defines class Accounts with __tablename__ = 'accounts'

- aihub router → AIHubService → ai_logs model → DB table `ai_logs`
  - Evidence: `backend/routers/aihub.py` (router prefix), `backend/services/aihub.py`, `backend/models/ai_logs.py`

- payments gateway router → PaymentService (Stripe) → payment_verifications model / ledger models
  - Evidence: `backend/services/payment.py`, `backend/services/payment_verifications.py`, `backend/models/payment_verifications.py`, `backend/services/ledger_service.py`

- ledger routers → ledger services → ledger_entries / ledger_transactions models → DB tables `ledger_entries`, `ledger_transactions`
  - Evidence: `backend/routers/ledger_entries.py`, `backend/services/ledger_entries.py`, `backend/models/ledger_entries.py` and corresponding ledger_transactions files

- compiler router → compiler_service → (DSL artifacts persisted possibly to storage or models) — evidence: `backend/routers/compiler.py`, `backend/services/compiler_service.py`, README HUS Compiler mention

Note: This mapping is partial and limited to files observed during the scan. A full graph requires automated extraction of import relations and runtime tracing. Items not discovered are flagged as UNKNOWN — Requires Verification.

-------------------------
Database Schema Graph (evidence-first)
-------------------------
- `backend/models/accounts.py` → table `accounts` (evidence: `backend/models/accounts.py` lines 6-18)
- `backend/models/ledger_entries.py` → table `ledger_entries` (evidence: file presence)
- `backend/models/ledger_transactions.py` → table `ledger_transactions` (evidence: file presence)
- `backend/models/payment_verifications.py` → table `payment_verifications` (evidence: file presence)
- `backend/models/ai_logs.py` → table `ai_logs` (evidence: file presence)

Alembic integration:
- `backend/alembic/env.py` sets `target_metadata = Base.metadata` and auto-imports modules under `models` so that Alembic can autogenerate migrations (evidence: `backend/alembic/env.py` lines 25-39 and 29-32)

Unknown / Needs verification:
- Presence and content of `backend/alembic/versions/` — UNKNOWN — Requires Verification (evidence not observed in listing)
- Live database state vs migration head — UNKNOWN — Requires Verification

-------------------------
API Endpoint Inventory (evidence-first sample)
-------------------------
- /api/v1/entities/accounts — router defined in `backend/routers/accounts.py` (evidence: `router = APIRouter(prefix="/api/v1/entities/accounts", ...)`)
- /api/v1/aihub/gentxt — defined in `backend/routers/aihub.py` (evidence: function generate_text decorated under `@router.post("/gentxt")`)
- Additional endpoints exist per router files under `backend/routers/` — see `backend/routers` directory listing for all route modules (evidence: `backend/routers/*` listing)

Note: A complete endpoint inventory requires parsing all router files to list path+methods. This inventory is partial — further automated extraction required.

-------------------------
Environment configuration (evidence-first)
-------------------------
- `core/config.py` referenced in `backend/main.py` import: `from core.config import settings` (evidence: `backend/main.py` line 9)
- Keys referenced: `settings.port`, `settings.stripe_secret_key`, `settings.app_ai_base_url`, `settings.app_ai_key` (evidence: `backend/main.py` lines 226-233; `backend/services/payment.py` lines 151-158; `backend/services/aihub.py` lines 93-99)

Note: `.env` file usage referenced in `backend/main.py` debug runner (evidence: `backend/main.py` lines 217-223). No `.env` committed in repo listing.

-------------------------
CI/CD / Docker / Container setup (evidence-first)
-------------------------
- No `.github/workflows/*` discovered in scanned listing — CI configuration is UNKNOWN — Requires Verification
- No Dockerfile discovered in scanned listing — Container setup is UNKNOWN — Requires Verification

-------------------------
Test coverage reality (evidence-first)
-------------------------
- No `tests/` directory or test files discovered in the scan output — Test coverage is UNKNOWN — Requires Verification

-------------------------
Technical debt & high-risk modules (evidence-first)
-------------------------
- Duplicate payment verification modules: `backend/services/payment_verifications.py` vs `backend/services/payment_verification_service.py` — evidence: both files present in `backend/services/` listing
- Large AI service module: `backend/services/aihub.py` (evidence: large file listing and contents show many responsibilities: text/image/video/audio/pdf)
- Large compiler service: `backend/services/compiler_service.py` (evidence: file listed and size indicates complex logic)
- Monolithic routers containing business logic rather than thin controllers (evidence: `backend/routers/accounts.py` contains business-level error handling and loops, many other large router files)
- Wildcard CORS: `backend/main.py` configured with `allow_origin_regex=r".*"` (evidence: `backend/main.py` lines 91-98)
- Alembic excludes identity tables (evidence: `backend/alembic/env.py` lines 41-46)

-------------------------
High-risk integrations (evidence-first)
-------------------------
- Payments (Stripe integration): `backend/services/payment.py` — critical financial path (evidence: file content and Stripe usage)
- AI (external models + streaming): `backend/services/aihub.py` + `backend/routers/aihub.py` — must guard against abuse & costs (evidence: file contents)
- Compiler (runtime execution of DSL): `backend/services/compiler_service.py` + `backend/routers/compiler.py` (evidence: README mentions compiler v6 and presence of service and router files)

-------------------------
Component Registry (partial — required per directive)
-------------------------
| Component | Current Location | Responsibility | Dependencies | Migration Priority |
|---|---|---|---|---|
| FastAPI App | backend/main.py | App startup, lifespan, router discovery | core.config (`core/config.py`), services.database | High — central piece (evidence: `backend/main.py`) |
| Accounts API | backend/routers/accounts.py | CRUD for accounts | backend/services/accounts.py, backend/models/accounts.py | Medium (evidence: `backend/routers/accounts.py`, `backend/services/accounts.py`, `backend/models/accounts.py`) |
| AI Hub | backend/routers/aihub.py / backend/services/aihub.py | Multimodal AI generation & transcription | AsyncOpenAI client, ai_logs model | High (evidence: `backend/services/aihub.py`, `backend/routers/aihub.py`, `backend/models/ai_logs.py`) |
| Payments | backend/services/payment.py, backend/routers/payments_gateway.py | Stripe checkout/session creation, payment lifecycle | Stripe; ledger services | Critical (evidence: `backend/services/payment.py`) |
| Ledger | backend/services/ledger_service.py + backend/models/ledger_* | Accounting engine, transactions | DB models ledger_entries/transactions | Critical (evidence: `backend/services/ledger_service.py`, `backend/models/ledger_entries.py`) |
| HUS Compiler | backend/services/compiler_service.py + backend/routers/compiler.py | DSL parsing & code generation | core/config, storage | High (evidence: `backend/services/compiler_service.py`, README mention) |
| Alembic Migrations | backend/alembic/env.py | Migration runtime & autogeneration | core.database Base metadata | Critical to verify (evidence: `backend/alembic/env.py`) |

Note: This registry is partial and focuses on major components touched during Phase‑0 scan. A full component inventory requires static analysis of imports.

-------------------------
Open items requiring verification (evidence-first)
-------------------------
- `backend/alembic/versions/` presence and contents — UNKNOWN — Requires Verification
- CI/CD workflows (`.github/workflows/`) — UNKNOWN — Requires Verification
- Dockerfile / container manifests — UNKNOWN — Requires Verification
- Tests presence and coverage metrics — UNKNOWN — Requires Verification

-------------------------
End of SYSTEM_BASELINE_INVENTORY_V3.md
