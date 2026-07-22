# HUSSAM PLATFORM V3.0 — ARCHITECTURE DECISION RECORDS (ADR)

File: /docs/ARCHITECTURE_DECISION_RECORD_V3.md
Date: 2026-07-22
Author: Principal Enterprise Software Architect (evidence-first)

This ADR document records the architecture decisions for HUSSAM PLATFORM V3.0 at the governance level. All statements are evidence-based and reference repository files and modules discovered during the Phase‑0 audit. Where evidence is missing, items are marked "UNKNOWN — Requires Verification".

1. ADR Metadata
- Title: HUSSAM PLATFORM V3.0 — Architecture Decision Record (Governance)
- Identifier: ADR-V3-2026-07-22
- Status: Approved (Documentation-only)
- Authors: Principal Enterprise Software Architect
- Files referenced: backend/main.py, backend/alembic/env.py, backend/models/*.py, backend/routers/*, backend/services/*, frontend/src/*, frontend/README.md

2. Decision Context
- Purpose: Establish governance rules and record architectural decisions to guide Phase‑1 Domain Driven refactor of the hussam-platform-v2 repository without modifying application source code at this stage.
- Constraints: No code changes, no moves or renames, no dependency or migration executions; documents must be evidence-first and traceable to current repository files.
- Evidence anchors: See file list above; key lines called out in `backend/main.py` (router auto-discovery and CORS), `backend/alembic/env.py` (Alembic integration and exclude filters), `backend/services/aihub.py` (AI capabilities), `backend/services/payment.py` (Stripe integration), `backend/services/compiler_service.py` (HUS compiler service), `backend/models/*` (ORM models).

3. Current Architectural Problem Statement (evidence-based)
- The repository contains a functionally rich monolithic design where HTTP routers, business services, and ORM models are co-located under backend/. Evidence: `backend/routers/*`, `backend/services/*`, and `backend/models/*` are all present and contain substantial business logic (examples: `backend/routers/accounts.py`, `backend/services/aihub.py`, `backend/models/accounts.py`).
- Several critical subsystems (payments, AI, HUS compiler) are implemented as large monolithic modules, leading to high blast radius and difficult testing/maintenance (evidence: `backend/services/aihub.py`, `backend/services/payment.py`, `backend/services/compiler_service.py`).
- Migration governance is unclear: Alembic env exists and references Base.metadata (evidence: `backend/alembic/env.py`), but the presence and health of alembic/versions is UNKNOWN — Requires Verification.
- Security defaults are permissive in code: CORS allow_origin_regex is `.*` in `backend/main.py` (evidence: backend/main.py middleware configuration lines), representing a production risk.

4. Evidence-Based Findings
- Router discovery: `backend/main.py` calls include_routers_from_package("routers") and auto-includes APIRouter objects found in `backend/routers/` (evidence: backend/main.py lines ~102-154).
- Model autoloading for Alembic: `backend/alembic/env.py` imports `models` package modules using pkgutil to populate Alembic target_metadata (evidence: backend/alembic/env.py lines 29-32, 38-39).
- AI Hub capabilities: `backend/services/aihub.py` contains implementations for gentxt, genimg, genvideo, genaudio, transcribe, and analyze_pdf; router `backend/routers/aihub.py` exposes these endpoints and supports streaming via SSE (evidence: backend/services/aihub.py and backend/routers/aihub.py).
- Payments: `backend/services/payment.py` implements CheckoutSession creation and Stripe initialization; payment verification modules exist (`backend/services/payment_verifications.py`, `backend/services/payment_verification_service.py`) showing potential duplication (evidence: backend/services/payment.py and both verification modules exist in services/ listing).
- Compiler: `backend/services/compiler_service.py` and `backend/routers/compiler.py` implement the HUS Compiler service and endpoints; README references HUS Compiler v6 (evidence: README.md lines and those files).

5. Decision Summary
The governance decisions recorded here are intended to guide Phase‑1 migration planning while ensuring zero-breaking-change and evidence-first validation. The following decisions are made:

Decision 1 — Adopt Domain Driven Design (DDD) for Phase‑1 (Documentation-only)
- Summary: Officially adopt DDD as the target architectural approach for V3.0, articulating domains: payments, ai, hus_compiler, marketplace, logistics, identity.
- Rationale: Evidence of co-located routers/services/models and large monolithic services (e.g., `backend/services/aihub.py`) indicates need for clearer domain boundaries and testable application services.
- Evidence: backend/routers/*, backend/services/*, backend/models/* files.
- Constraints: Implementation must preserve current router paths and avoid file moves in Phase‑1.

Decision 2 — Preserve existing API contracts via Adapter/Facade layers
- Summary: All existing `/api/v1/*` routes remain unchanged during Phase‑1; new domain services must expose facades that existing routers can call via adapters.
- Rationale: `backend/main.py` auto-registers routers and clients rely on `/api/v1/*` route structure. Zero-breaking-change requirement mandates adapter approach.
- Evidence: backend/main.py router discovery and example router prefixes (e.g., `backend/routers/accounts.py` prefix `/api/v1/entities/accounts`).

Decision 3 — Introduce a Transactional Outbox for event-driven decoupling (design-only)
- Summary: Payment → ledger → shipment flows must be transitioned to event-driven interactions using a transactional outbox pattern before full domain decoupling.
- Rationale: Payment flows are critical and demand reliable eventual consistency; current code synchronously couples payment and ledger (evidence: backend/services/payment.py and backend/services/ledger_service.py). Outbox prevents data loss and supports worker-based reconciliation.
- Evidence: backend/services/payment.py and backend/services/ledger_service.py.

Decision 4 — Security Hardening Baseline
- Summary: Replace wildcard CORS in production and implement RBAC and per-tenant validation before migration into production.
- Rationale: `backend/main.py` currently uses `allow_origin_regex=r".*"` (evidence) and AI/IO code accepts remote URLs/absolute path inputs (`backend/services/aihub.py`) representing SSRF/file exposure risks.
- Evidence: backend/main.py and backend/services/aihub.py.

Decision 5 — Stage Postgres 16 Upgrade and pgvector Adoption (deferred)
- Summary: Target PostgreSQL 16 and pgvector for embeddings in Phase‑2 pending verification; do not change DB now.
- Rationale: AI subsystem signals need for embeddings (evidence: ai logs and AI features), but no current pgvector usage is present in repository — UNKNOWN — Requires Verification.
- Evidence: backend/services/aihub.py and absence of pgvector references in scanned files.

6. Core Architectural Principles (governance)
- P1: Evidence-first: every migration or refactor decision must cite repository evidence. If evidence missing, mark as UNKNOWN and prohibit code changes until verified in staging.
- P2: Non-destructive migration: preserve all existing routes and DB schemas. Use adapter layers to maintain compatibility.
- P3: Incremental validation: each migration stage must include automated tests (smoke + integration) and human sign-off.
- P4: Security by default: restrict CORS and enforce secret management and RBAC before production.

7. Accepted Trade-offs
- Trade-off T1: During Phase‑1, models remain in backend/models/ (avoid file moves) at the cost of temporary duplication of model adapter layers. Rationale: Prevents repo-wide disruption and honors constraint "DO NOT move files".
- Trade-off T2: Adapter layer introduces temporary indirection; accepted to preserve API compatibility and reduce risk.

8. Rejected Alternatives (with rationale & evidence)
- Alternative R1: Immediately move backend/models/* into domain-specific directories.
  - Rejected because HARD CONSTRAINTS forbid moving files and risk breaking Alembic migrations; evidence: Alembic env expects models under models package (backend/alembic/env.py lines 29-32).
- Alternative R2: Synchronous direct calls between new domain application layers during migration.
  - Rejected in favor of Transactional Outbox for reliability and decoupling (evidence: payments and ledger synchronous coupling in backend/services/payment.py and backend/services/ledger_service.py).

9. Architectural Consequences
- C1: Adapter layers will be required and must be maintained until final consolidation stage. They will increase the surface area for testing but enable zero-breaking-change migration.
- C2: Domain extraction will initially duplicate interfaces (domain adapters referencing backend/models) but this is temporary and governed by migration plans.
- C3: Security improvements may require minor configuration changes in deployment descriptors (outside the repo) before merging refactors.

10. Governance Rules (Future enforcement)
- G1: No domain application code should import another domain application directly; all cross-domain interactions must go through published interfaces or event bus.
- G2: All DB schema changes must be accompanied by Alembic revision scripts located in backend/alembic/versions/ and validated in staging before production rollout.
- G3: All critical flows (payments, ledger, AI job execution) must have integration tests and CI gates before merging.

11. Phase‑1 Entry Conditions (gating)
- E1: Alembic versions scan completed and migrations validated. Evidence: list backend/alembic/versions/ and run `alembic current` in staging. Status: UNKNOWN — Requires Verification.
- E2: Secret exposure scan completed (no STIPE/AI keys in repo). Evidence to check: repo root, backend/ files. Status: UNKNOWN — Requires Verification.
- E3: CI pipeline skeleton established (lint + smoke + alembic diff check). Status: UNKNOWN — Requires Verification.

12. Appendix — Evidence Index (file list used)
- backend/main.py
- backend/alembic/env.py
- backend/routers/accounts.py
- backend/routers/aihub.py
- backend/routers/payments_gateway.py
- backend/routers/payment_verifications.py
- backend/routers/compiler.py
- backend/routers/products.py
- backend/routers/shipments.py
- backend/services/aihub.py
- backend/services/payment.py
- backend/services/payment_verifications.py
- backend/services/ledger_service.py
- backend/services/compiler_service.py
- backend/services/accounts.py
- backend/services/products.py
- backend/models/accounts.py
- backend/models/payment_verifications.py
- backend/models/ledger_entries.py
- backend/models/ledger_transactions.py
- backend/models/ai_logs.py
- frontend/src/main.tsx
- frontend/src/App.tsx
- frontend/README.md

End of ARCHITECTURE_DECISION_RECORD_V3.md
