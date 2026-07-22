PHASE 1 — DOMAIN MIGRATION MAP

Document Control
- Title: HUSSAM PLATFORM V3.0 — PHASE_1_DOMAIN_MIGRATION_MAP
- Author: Principal Enterprise Software Architect (evidence-first)
- Repo: hosamahad57-collab/hussam-platform-v2
- Path: /docs/PHASE_1_DOMAIN_MIGRATION_MAP.md
- Date: 2026-07-22

1. Current Architecture Baseline (evidence anchors)
- App entry and router discovery: backend/main.py (router auto-discovery, lifespan startup). Evidence: backend/main.py lines ~102-154.
- Migration runner and model metadata: backend/alembic/env.py (auto-imports models and uses Base.metadata; excludes identity tables). Evidence: backend/alembic/env.py lines 25-39 and 41-46.
- ORM models (samples): backend/models/accounts.py (class Accounts, __tablename__='accounts'). Evidence: backend/models/accounts.py.
- AI subsystem: backend/services/aihub.py and backend/routers/aihub.py exposing gentxt/genimg/genvideo/genaudio/transcribe/analyzepdf. Evidence: backend/services/aihub.py and backend/routers/aihub.py.
- Payments subsystem: backend/services/payment.py (Stripe flows) and backend/routers/payments_gateway.py, backend/services/payment_verifications.py. Evidence: backend/services/payment.py and backend/services/payment_verifications.py.
- Compiler subsystem: backend/services/compiler_service.py and backend/routers/compiler.py; HUS Compiler description in README.md. Evidence: backend/services/compiler_service.py, backend/routers/compiler.py, README.md lines 12-16.
- Frontend entry points: frontend/src/main.tsx, frontend/src/App.tsx; frontend README: frontend/README.md.

2. Existing Domain Inventory (evidence-first)
List of discovered logical components and evidence references. These are the canonical sources from the repository used to derive migration mappings.

- Identity / Tenancy
  - Evidence: backend/routers/tenants.py; backend/services/tenants.py; backend/models/tenants.py; backend/models/tenant_settings.py; backend/README.md lines 100-101 (Atoms Cloud identity). Files: backend/routers/tenants.py, backend/services/tenants.py, backend/models/tenants.py, backend/models/tenant_settings.py.

- Marketplace
  - Evidence: backend/routers/products.py; backend/services/products.py; backend/routers/marketplace.py. Files: backend/routers/products.py, backend/services/products.py, backend/routers/marketplace.py.

- Payments & Ledger
  - Evidence: backend/services/payment.py; backend/routers/payments_gateway.py; backend/services/payment_verifications.py; backend/models/payment_verifications.py; backend/services/ledger_service.py; backend/models/ledger_entries.py; backend/models/ledger_transactions.py.

- Logistics / Shipments
  - Evidence: backend/routers/shipments.py; backend/services/shipments.py; backend/services/logistics_service.py; backend/routers/logistics.py; backend/models/shipments.py.

- AI
  - Evidence: backend/routers/aihub.py; backend/services/aihub.py; backend/models/ai_logs.py; backend/services/ai_logs.py.

- HUS Compiler
  - Evidence: backend/routers/compiler.py; backend/services/compiler_service.py; README.md HUS Compiler v6 mention.

- Storage / ObjectStorage
  - Evidence: backend/routers/storage.py; backend/services/storage.py; backend/skills_docs/object_storage.md referenced in backend/README.md lines 120-126.

- Accounts / Ledger Entities
  - Evidence: backend/routers/accounts.py; backend/services/accounts.py; backend/models/accounts.py.

- Core / Config
  - Evidence: backend/core/config.py referenced in backend/main.py and services (backend/main.py line 9; backend/services/aihub.py lines where settings used).

Note: This inventory is evidence-bound to the files listed above. If additional files exist and were not discovered in the initial scan, they must be verified (UNKNOWN — Requires Verification).

3. Domain Boundary Analysis (evidence-first)
For each Phase‑1 target domain define a minimal boundary (Entities, Aggregates, Domain Services, Infrastructure dependencies) with evidence anchors.

A. Payments Domain (evidence)
- Entities: PaymentSession (backend/services/payment.py CheckoutSessionRequest/Response), PaymentVerification (backend/models/payment_verifications.py). Evidence: backend/services/payment.py and backend/models/payment_verifications.py.
- Aggregates: PaymentSession aggregate (session + verification + metadata). Evidence: backend/services/payment.py uses CheckoutSessionRequest and session creation.
- Domain Services: payment_engine, verification_engine, reconciliation_engine. Evidence anchors: backend/services/payment.py, backend/services/payment_verifications.py, backend/services/payment_verification_service.py.
- Infrastructure: stripe_adapter (current code in backend/services/payment.py), webhook endpoints in backend/routers/payment_verifications.py.

B. Ledger / Financials (evidence)
- Entities: LedgerEntry (backend/models/ledger_entries.py), LedgerTransaction (backend/models/ledger_transactions.py).
- Domain Services: ledger_engine, posting_service. Evidence: backend/services/ledger_service.py, backend/services/ledger_entries.py, backend/services/ledger_transactions.py.
- Infrastructure: DB (core.database), Alembic migration runner (backend/alembic/env.py).

C. AI Domain (evidence)
- Entities: AIRequest (no single model file but captured via ai_logs model), AIUsage (backend/models/ai_logs.py).
- Aggregates: AIRequest aggregate (request + response + token usage). Evidence: backend/services/aihub.py and backend/models/ai_logs.py.
- Services: model_router (select model), quota_manager, billing_engine (token accounting). Evidence: aihub service uses settings.app_ai_base_url/KEY and records usage (backend/services/aihub.py lines ~93-148 and usage extraction lines 135-143).
- Infrastructure: AsyncOpenAI client usage (backend/services/aihub.py) and object storage for outputs (backend/services/storage.py).

D. HUS Compiler Domain (evidence)
- Entities: SourceContract, CompiledArtifact (not explicit models found; evidence: compiler_service file and README). Evidence: backend/services/compiler_service.py, README.md HUS Compiler mention.
- Services: parser, validator, resolver, generator — currently co-located in compiler_service. Evidence: backend/services/compiler_service.py.
- Infrastructure: storage for compiled artifacts; integration points in routers/compiler.py.

E. Marketplace Domain (evidence)
- Entities: Product (backend/models/products.py), Vendor, Account. Evidence: backend/models/products.py and backend/routers/marketplace.py.
- Services: product_catalog, marketplace_service (backend/services/marketplace_service.py).

4. Proposed Phase‑1 Migration Domains (evidence-first mapping)
Per governance rules we will NOT move or rename existing files during Phase‑1. We will create new domain folders under backend/domains/ and implement adapter shims in backend/routers/ to delegate to domain application services. The mapping below shows target domain placements (logical, not moving current files):

- backend/domains/payments/
  - application/payment_facade.py  (implements public API used by adapters)
  - infrastructure/stripe_adapter.py (wraps backend/services/payment.py logic into adapter API)
  - interfaces/http/payments_adapter.py (router shim)
  Evidence: backend/services/payment.py, backend/routers/payments_gateway.py, backend/services/payment_verifications.py

- backend/domains/ai/
  - application/ai_service.py
  - infrastructure/openai_adapter.py
  - infrastructure/pdf_processor.py
  - interfaces/http/aihub_adapter.py
  Evidence: backend/services/aihub.py, backend/routers/aihub.py, backend/models/ai_logs.py

- backend/domains/hus_compiler/
  - application/compiler_facade.py
  - infrastructure/parser_adapter.py
  - infrastructure/generator_adapter.py
  - interfaces/http/compiler_adapter.py
  Evidence: backend/services/compiler_service.py, backend/routers/compiler.py, README.md HUS Compiler mention

- backend/domains/marketplace/
  - application/products_service.py
  - infrastructure/catalog_adapter.py
  - interfaces/http/products_adapter.py
  Evidence: backend/routers/products.py, backend/services/products.py, backend/models/products.py

- backend/domains/logistics/
  - application/shipments_service.py
  - infrastructure/carrier_adapter.py
  - interfaces/http/shipments_adapter.py
  Evidence: backend/routers/shipments.py, backend/services/shipments.py

- backend/domains/identity/ (tenant metadata; note: identity users managed externally)
  - application/tenants_service.py
  - interfaces/http/tenants_adapter.py
  Evidence: backend/routers/tenants.py, backend/services/tenants.py, backend/models/tenants.py; README mentions Atoms Cloud identity (backend/README.md lines 100-101)

5. Dependency Direction Rules (governance)
- Rule G1: Domain application layers may depend on domain infrastructure and core libraries (core/*), but NOT on other domain application layers directly. Cross-domain communication must use published domain interfaces or events (Evidence: current services import models & core.database; see backend/services/* files).
- Rule G2: Routers remain in `backend/routers/` and may depend on domain interfaces (adapter pattern). Routers MUST not import internal domain application code directly except via the adapter interface. (Evidence: backend/main.py auto-discovers routers)
- Rule G3: Models under backend/models/ remain canonical for Phase‑1. Domain infrastructure may import models for DB mapping; do NOT move model files until Phase‑2 cleanup. (Evidence: HARD CONSTRAINTS and backend/README.md protected paths)

6. Anti‑Corruption Layer Strategy (ACL)
- Purpose: Avoid leaking legacy models/behaviors into the new domain design.
- Implementation (Phase‑1 doc-only plan):
  - For each domain create `interfaces/adapters` that translate legacy DTOs (router Pydantic models) into domain input DTOs and map domain outputs to legacy response models.
  - Example: backend/domains/payments/interfaces/http/payments_adapter.py will accept existing CheckoutSessionRequest shape and call backend/domains/payments/application/payment_facade.create_checkout(...) returning a CheckoutSessionResponse shaped exactly as current API. Evidence: backend/services/payment.py defined CheckoutSessionRequest/Response.
- Evidence anchor: backend/routers/accounts.py uses Pydantic models and directly calls service; adapter will emulate same contract (backend/routers/accounts.py lines 20-52 and create_accounts function lines 191-206).

7. Migration Sequencing Plan (detailed stages & validation)
- Stage 0 — Governance & Gating (must pass)
  - Tasks:
    1. Alembic versions scan and head verification (verification command and list backend/alembic/versions/). Evidence: backend/alembic/env.py.
    2. Secret-scan for STRIPE/APP_AI keys (files to check: repository root, backend/ directory). Evidence: backend/services/payment.py references settings.stripe_secret_key.
    3. Create CI skeleton (docs only) and add smoke tests to verify health endpoint and critical endpoints in staging. Evidence: backend/main.py health endpoint lines 194-196.
  - Validation: Alembic head confirmed; secret-scan clean; smoke tests pass.

- Stage 1 — Payments extraction (adapter creation, non-breaking)
  - Files: backend/routers/payments_gateway.py (adapter), new domain files under backend/domains/payments/*. Evidence: payment.py, payment_verifications files.
  - Validation: create automated test that calls /api/v1/payments (same signature) and verifies the same response as pre-adapter.

- Stage 2 — Ledger & Reconciliation (idempotent posting)
  - Files: ledger services and models; domain ledger_engine to receive events via outbox.
  - Validation: reconciliation tests: simulate payment webhook and assert ledger entries created exactly once.

- Stage 3 — AI Domain extraction
  - Files: backend/routers/aihub.py (adapter) and backend/domains/ai/* files. Ensure streaming behavior preserved (SSE). Evidence: backend/routers/aihub.py uses EventSourceResponse and service.gentxt_stream.
  - Validation: SSE stream test, genimg, genvideo, transcribe, analyzepdf test vectors.

- Stage 4 — HUS Compiler isolation
  - Files: backend/routers/compiler.py (adapter) and backend/domains/hus_compiler/*
  - Validation: compile canonical HUS contract set and ensure identical outputs.

- Stage 5 — Marketplace & other domains
  - Files: adapters and domain modules for products, marketplace, logistics.
  - Validation: product CRUD tests and end-to-end purchase flows.

- Stage 6 — Consolidation & cleanup (requires permission to move files)
  - Only after human confirmation and additional governance steps — move models if and only if Alembic migration strategy verified.

8. Risks and Constraints (evidence-first)
- RISK: Schema drift between auto-generated models and migrations. Evidence: backend/README.md states models are auto-generated and backend/alembic/env.py relies on Base.metadata. Mitigation: run alembic autogenerate diff and commit migrations before moving models. (Action: UNKNOWN — Requires Verification of backend/alembic/versions/)
- RISK: Duplicate payment verification code (two services present). Evidence: backend/services/payment_verifications.py and backend/services/payment_verification_service.py. Mitigation: consolidate into domain application verification_engine with tests and a single webhook handler adapter.
- RISK: Security exposures (wildcard CORS). Evidence: backend/main.py CORSMiddleware allow_origin_regex=r".*". Mitigation: environment-specific allowlists and staging validation.
- RISK: AI input security (SSRF / file path access). Evidence: backend/services/aihub.py `_audio_str_to_upload_file` allows absolute paths and http downloads. Mitigation: restrict to data URIs and allowlist remote URLs; disallow absolute file paths.

9. Phase‑1 Entry Criteria (must be satisfied before executing any refactor)
- [ ] Alembic versions scan completed and migration head validated (backend/alembic/versions/ list available). Evidence: backend/alembic/env.py.
- [ ] Secret exposure/security scan completed and cleared (STRIPE keys, APP_AI keys). Evidence: backend/services/payment.py and backend/services/aihub.py references.
- [ ] CI pipeline skeleton established with at least lint + smoke test + alembic diff check. Evidence: backend/main.py health endpoint for smoke tests.
- [ ] Human sign-off on domain boundary definitions in this doc.

10. Appendices — Evidence index (file list referenced in this document)
- backend/main.py (router discovery & middleware)
- backend/alembic/env.py (migration runner)
- backend/models/accounts.py
- backend/models/ledger_entries.py
- backend/models/ledger_transactions.py
- backend/models/payment_verifications.py
- backend/models/ai_logs.py
- backend/routers/accounts.py
- backend/routers/aihub.py
- backend/routers/payments_gateway.py
- backend/routers/payment_verifications.py
- backend/routers/compiler.py
- backend/services/payment.py
- backend/services/payment_verifications.py
- backend/services/aihub.py
- backend/services/compiler_service.py
- backend/services/ledger_service.py
- backend/services/accounts.py
- frontend/src/main.tsx
- frontend/src/App.tsx
- frontend/README.md

End of PHASE_1_DOMAIN_MIGRATION_MAP
