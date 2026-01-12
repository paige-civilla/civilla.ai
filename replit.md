# Civilla.ai Website

## Overview
Pixel-perfect frontend implementation of the Civilla.ai website from Figma design using React and Tailwind CSS. This is a design-locked, frontend-only build with zero creative interpretation - Figma is the single source of truth, except where user explicitly requests design deviations.

## User Preferences
- **LOW AUTONOMY**: Ask before making design, copy, IA, or feature changes
- **Brand styling**: "civilla" must always appear in lowercase, italicized (.cv-brand class)
- **Figma is source of truth** except where user explicitly overrides

## Locked Pages (NO EDITS ALLOWED)
- **Home page** (`client/src/pages/Home.tsx`) - LOCKED
- **How Civilla Works page** (`client/src/pages/HowCivillaWorks.tsx`) - LOCKED
- **Our Mission page** (`client/src/pages/OurMission.tsx`) - LOCKED
- **Meet The Founders page** (`client/src/pages/MeetTheFounders.tsx`) - LOCKED
- **Wall Of Wins page** (`client/src/pages/WallOfWins.tsx`) - LOCKED
- **FAQ page** (`client/src/pages/FAQ.tsx`) - LOCKED

## Locked Components (NO EDITS ALLOWED)
- **Footer** (`client/src/components/Footer.tsx`) - LOCKED
- **Navbar (green)** (`client/src/components/Navbar.tsx`) - LOCKED
- **NavbarCream** (`client/src/components/NavbarCream.tsx`) - LOCKED

## Recent Changes
- 2026-01-12: BILLING SYSTEM COMPLETE - Full Stripe billing integration with:
  - Database: Added stripe_customer_id, stripe_subscription_id, stripe_price_id, subscription_status, add_on_second_case, add_on_archive_mode, usage_bytes_month, trial_ends_at columns to user_profiles
  - API Endpoints: POST /api/billing/checkout, POST /api/billing/portal, GET /api/billing/status, legacy POST /api/stripe/create-checkout-session
  - Entitlements: server/billing.ts with tier limits (free/trial/core/pro/premium), case limits, storage caps, feature flags
  - Paywall Middleware: server/middleware/paywall.ts with requireTier(), requireAnalysis(), requireDownloads(), requireVideoUploads(), checkCaseLimit()
  - Webhook Handler: Updated webhookHandlers.ts to process checkout.session.completed, subscription.created/updated/deleted, invoice.paid/failed
  - Frontend: SubscriptionTierCard in AppAccountSettings.tsx with "Manage Subscription" button (opens Stripe portal) and "Upgrade Plan" button
  - Comped Users: paigelindibella@gmail.com, jetdocllc@gmail.com, paige@civilla.ai, bryan@civilla.ai bypass all paywalls with premium access
  - Protected Routes: POST /api/cases (case limit), extraction/run (analysis), compile-claims/compile-template (downloads)
- 2026-01-12: Entitlements System - Created server/entitlements.ts with lifetime premium comped allowlist (paigelindibella@gmail.com, jetdocllc@gmail.com, paige@civilla.ai, bryan@civilla.ai), admin allowlist (admin@civilla.ai, paige@civilla.ai, bryan@civilla.ai), grant viewer allowlist (grants@civilla.ai). Auto-applies on registration/login. Added subscription fields to user_profiles (subscription_tier, subscription_source, is_lifetime, comped_reason). Account Settings shows Premium + Lifetime badges.
- 2026-01-12: AI System Hardening - Created server/ai/ infrastructure with executionGuard.ts (timeouts, concurrency, retries), featureFlags.ts, rateLimits.ts (soft queuing), phaseAwareness.ts (intake safe mode), budgetTracking.ts (per-user cost tracking), alerts.ts (Slack hooks). Admin endpoints: /api/admin/ai-status, /api/admin/feature-flag, /api/admin/acknowledge-alert, /api/admin/refresh-entitlements, /api/admin/entitlements
- 2026-01-10: Task 3 Complete - Resource Field Maps with resource_field_maps table, CRUD API endpoints, bulk create with suggestions, keyword-based claim suggestion algorithm, ResourceFieldMapPanel component with collapsible fields, claim suggestions, manual value input, completion tracking, integrated into Court Forms page with "Map Fields" button
- 2026-01-10: Task 2 Complete - Form Pack Finder with Court Forms & Packets module page, state/category/keyword search, official-domain filtering (.gov/.us/courts only), pre-populated resources for 10 states + federal, saved resources with edit/delete functionality
- 2026-01-10: Task 1 Complete - Template-to-Field Auto-Population with 10 narrative templates, autofill endpoint using keyword/tag/claimType matching, AutoFillPreview component with readiness gating (≥60% + ≥5 cited claims)
- 2026-01-10: Fixed Lexi Sources - All sources now clickable: valid URLs verified via HEAD request, invalid/unreachable URLs converted to Google search links. Sources sorted (official domains first), deduplicated, limited to 5. LexiPanel always renders as clickable <a> tags.
- 2026-01-10: Phase Awareness UX - Added PhaseStatusBar to Dashboard, PhaseNotice to Documents compile tab, one-time reassurance message in Claims UI (sessionStorage-based). Three phases: collecting, reviewing, draft-ready. Phase resolved via server/services/phaseResolver.ts and returned in /api/cases/:caseId/draft-readiness endpoint.
- 2025-01-10: Added Module Usage Analytics - activity_logs tracks moduleKey/entityType/entityId, recordActivity() helper, /api/analytics/* endpoints, useModuleView hook for auto-tracking, Usage Insights card in Account Settings
- 2025-01-05: Added Evidence Notes feature - page-based annotations for viewing/organizing evidence without file uploads (schema, storage, API routes, full UI with CRUD)
- 2025-01-01: Added 15-minute inactivity auto-logout via useIdleLogout hook in AppLayout
- 2025-01-01: Enhanced Documents UX - Added StepStrip component with visual 1-2-3 workflow, step numbers in headings, improved button labels
- 2024-12-30: Slice 4B(A) - Updated courtDocx.ts with new payload structure (filer object with attorney nested)
- 2024-12-30: New caption table format: party block left (55%), court/case block right (45%)
- 2024-12-30: Simplified /api/templates/docx route with flexible payload acceptance
- 2024-12-30: Slice 4A - Created server/courtDocx.ts module with reusable DOCX formatting helpers
- 2024-12-30: Added references folder with format-only reference PDF and README
- 2024-12-30: Proper court formatting: Times New Roman 12pt, true double spacing (480 twips), 1" margins, centered "Page X of Y" footer
- 2024-12-24: Adjusted logo size to match quick exit button visually in both navbars
- 2024-12-24: Added Admin Login and Careers pages (footer only)
- 2024-12-24: Restructured footer to 4 columns matching navbar menu organization
- 2024-12-24: Removed How We Started page and routes
- 2024-12-24: Created Meet The Founders and Our Mission pages with proper routing
- 2024-12-24: Added polaroid-style frames with tilt animation to founder images
- 2024-12-22: Locked Home and How Civilla Works pages per user request
- 2024-12-22: Updated StepsSection with Step One/Two/Three layout
- 2024-12-22: Updated Plans page with new pricing copy, taglines, add-ons, and FAQ updates

## Project Architecture
- React + Vite frontend
- Express backend
- Tailwind CSS styling
- Shadcn UI components
- wouter for routing

## Key Components
- `BrandMark`: Renders lowercase italicized "civilla" brand name
- `NavbarCream`: Cream-colored navigation bar
- `Footer`: Site footer
- `FaqSection`: Shared FAQ accordion component

## Pricing Structure
- Trial: Free (3-day)
- Core: $19.99/mo or $199/yr
- Pro: $29.99/mo or $299/yr (Most Popular)
- Premium: $49.99/mo or $499/yr
- Yearly badge: "2 Mo. Free"

## Backend Authentication System

### Database Tables
- `users`: User accounts with email, passwordHash (nullable for OAuth-only users), casesAllowed
- `auth_magic_links`: Magic link tokens for passwordless login
- `auth_identities`: OAuth provider identities (Google, Apple) linked to users
- `cases`: User-owned cases with title, state, county, caseType

### Auth Methods
1. **Email/Password**: Traditional registration and login with scrypt hashing
2. **Magic Links**: Passwordless login via email (DEV mode logs to console if SMTP not configured)
3. **Google OAuth**: PKCE flow with state validation
4. **Apple OAuth**: form_post response mode with id_token

### Environment Variables
Required:
- `DATABASE_URL`: PostgreSQL connection string (auto-created)
- `SESSION_SECRET`: Session signing secret

Optional (for OAuth):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URL`
- `APPLE_CLIENT_ID`, `APPLE_REDIRECT_URL`

Optional (for real email):
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`

### API Routes
- `POST /api/auth/register`: Email/password registration
- `POST /api/auth/login`: Email/password login
- `POST /api/auth/magic-link/request`: Request magic link
- `GET /api/auth/magic-link/verify`: Verify magic link token
- `GET /api/auth/google/start`: Start Google OAuth flow
- `GET /api/auth/google/callback`: Google OAuth callback
- `GET /api/auth/apple/start`: Start Apple OAuth flow
- `POST /api/auth/apple/callback`: Apple OAuth callback (form_post)
- `GET /api/auth/me`: Get current user
- `POST /api/auth/logout`: End session
- `GET /api/cases`: List user's cases
- `POST /api/cases`: Create new case (respects casesAllowed limit)

## AI Infrastructure (Audit 2026-01-10)

### AI Pathways Checklist
All 9 AI pathways documented in `server/services/aiDiagnostics.ts`:

1. **Evidence Extraction Pipeline**: PDF parse → OCR fallback → text extraction
2. **Evidence AI Analysis Pipeline**: GPT-4o analysis with concurrency caps + jitter retries
3. **Claims Suggestion Pipeline**: Manual + auto background claim generation
4. **Draft Readiness + Preflight**: Checks if documents can compile from claims
5. **Document Compile from Claims**: Court document generation from accepted/cited claims
6. **Pattern Analysis**: Aggregate patterns from evidence + export
7. **Trial Prep Binder Export**: ZIP export of trial preparation materials
8. **Lexi Chat**: AI assistant with streaming + non-stream modes
9. **Quick Search**: Search across case data with deep links

### AI Diagnostics Endpoint
- `GET /api/ai/diagnostics`: Comprehensive health checks with human-readable errors
- Checks: OpenAI, Vision OCR, Database tables, R2 storage, Lexi threads
- Returns `nextStep` guidance for any failures
- UI: AiStatusCard component in Account Settings

### AI Smoke Test Script
- Location: `server/scripts/aiSmokeTest.ts`
- Run: `npx tsx server/scripts/aiSmokeTest.ts`
- Tests connectivity (OpenAI, Vision, DB) + functional (Lexi, Draft Readiness)
- Exits with code 0 (pass) or 1 (fail)
- Privacy-safe: No user content logged

### Error Code Standardization
All AI routes return structured error codes:
- `OPENAI_KEY_MISSING`, `OPENAI_KEY_INVALID`, `OPENAI_RATE_LIMIT`
- `VISION_NOT_CONFIGURED`
- `EXTRACTION_NOT_COMPLETE`, `NO_EXTRACTED_TEXT`
- `CASE_NOT_FOUND`, `EVIDENCE_NOT_FOUND`
- `ANALYSIS_ERROR`, `CLAIMS_SUGGEST_FAILED`

Frontend: `humanizeAiError()` function in `server/services/aiDiagnostics.ts` maps codes to user-friendly messages.

## Regression Rails (2026-01-11)

### Request ID Middleware
- All API responses include `x-request-id` header
- All error responses include `requestId` field for debugging
- Implementation: `server/middleware/requestId.ts`

### Admin Smoke Tests
- `GET /api/admin/smoke` - Runs comprehensive smoke checks (admin only)
  - DB schema verification (required AI columns)
  - OpenAI connectivity check
  - Vision API check
  - R2 storage check
  - Lexi thread create/delete check
  - Case create dry-run check
- Returns: `{ ok: boolean, checks: [...], timestamp: string, requestId }`

### Admin Diagnostics
- `GET /api/admin/diagnostics` - Operational dashboard data (admin only)
  - Recent AI failures from activity_logs (last 20)
  - Extraction/analysis counts by status
  - Server uptime, NODE_ENV, commit hash
- All data is privacy-safe (no user content)

### Contract Validation
- `GET /api/admin/contracts?caseId=...` - Validates API responses against Zod schemas
- Schemas in `shared/aiContracts.ts`:
  - `EvidenceExtractionSchema`, `EvidenceAiAnalysisSchema`
  - `DraftReadinessSchema`, `SearchResultSchema`
  - `AiHealthResponseSchema`, `SmokeCheckReportSchema`

### AI Test Mode
- Set `AI_TEST_MODE=true` to use mock Lexi responses
- Exercises full pipeline (thread creation, message storage, formatting) without OpenAI costs
- Implementation: `server/lexi/testMode.ts`

### Error Utilities
- `server/utils/humanizeError.ts` - Redact secrets, shorten stacks, map error codes

### Predeploy Check Scripts
- `tsx server/diagnostics/smokeRunner.ts` - Run all smoke checks
- `tsx server/diagnostics/predeployCheck.ts` - Blocking checks for deploy
