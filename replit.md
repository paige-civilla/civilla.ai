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
