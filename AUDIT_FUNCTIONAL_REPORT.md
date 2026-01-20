# Functional Audit Report

Generated: 2026-01-20T04:06:26.304Z

## Summary

| Metric | Value |
|--------|-------|
| **Auth Status** | PASS |
| **Test Case ID** | N/A |
| **Total Tests** | 23 |
| **Passed** | 6 |
| **Failed** | 1 |
| **Skipped** | 16 |
| **Pass Rate** | 26.1% |

## Button-to-Endpoint Mapping

| Feature/Button | UI Location | API Endpoint | DB Tables | Result |
|----------------|-------------|--------------|-----------|--------|
| Login | /login | /api/auth/login | users, sessions | PASS |
| Create Case | /app/cases | /api/cases | cases | FAIL |
| Upload Evidence | /app/evidence/:id | /api/cases/:id/evidence | evidence | NOT TESTED |
| Run Extraction | /app/evidence/:id | /api/cases/:id/evidence/:id/extract | evidence_extractions | SKIP |
| Retry Extraction | /app/evidence/:id | /api/cases/:id/evidence/:id/retry | evidence_extractions | SKIP |
| Run AI Analysis | /app/evidence/:id | /api/cases/:id/evidence/:id/analyze | evidence_ai_analyses | SKIP |
| Suggest Claims | /app/patterns/:id | /api/cases/:id/claims/suggest | case_claims, claim_citations | SKIP |
| Accept/Reject Claim | /app/patterns/:id | PATCH /api/claims/:id | case_claims | NOT TESTED |
| Compile Claims | /app/documents/:id | /api/cases/:id/documents/compile-claims | case_documents | SKIP |
| Export Document | /app/documents/:id | /api/cases/:id/documents/:id/export | case_documents | SKIP |
| Pattern Analysis | /app/patterns/:id | /api/cases/:id/pattern-analysis | case_patterns | SKIP |
| Trial Prep Export | /app/trial-prep/:id | /api/cases/:id/trial-prep/export | case_outlines | SKIP |
| Create Lexi Thread | /app (Lexi panel) | /api/lexi/threads | lexi_threads | FAIL |
| Send Lexi Message | /app (Lexi panel) | /api/lexi/chat | lexi_messages | PASS |
| Timeline Events | /app/timeline/:id | /api/cases/:id/timeline | timeline_events | SKIP |
| Contacts | /app/contacts/:id | /api/cases/:id/contacts | case_contacts | SKIP |
| Deadlines | /app/deadlines/:id | /api/cases/:id/deadlines | case_deadlines | SKIP |
| Communications | /app/communications/:id | /api/cases/:id/communications | case_communications | SKIP |
| Children | /app/children/:id | /api/cases/:id/children | case_children | SKIP |

## Detailed Test Results

### Auth

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Environment Variables | - | PASS | TEST_EMAIL length: 18, TEST_PASSWORD length: 14 |
| Login API | /api/auth/login | PASS | Logged in as qa.test@civilla.ai |

### Case

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Create Case | /api/cases | FAIL | HTTP 402 |

### Evidence

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Evidence | - | SKIP | No auth or case ID |

### Extraction

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Check Extraction Status | - | SKIP | No evidence to check |
| Retry Extraction Endpoint | - | SKIP | No evidence to retry |

### AI Pipeline

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| AI Health Check | /api/ai/health | PASS | OpenAI: true, Vision: true |
| Run AI Analysis | - | SKIP | No evidence to analyze |
| List AI Analyses | - | SKIP | No case ID |

### Claims

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Suggest Claims | - | SKIP | No case ID |
| List Claims | - | SKIP | No case ID |
| Compile Claims Preflight | - | SKIP | No case ID |

### Documents

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Documents | - | SKIP | No case ID |

### Exports

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Pattern Analysis Export | - | SKIP | No case ID |
| Trial Prep Export | - | SKIP | No case ID |

### Lexi

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Threads | /api/lexi/threads | PASS | Found 0 threads |
| Create Thread | /api/lexi/threads | PASS | Created thread: 3a2207fd-5ab7-490b-9421-7092e5806618 |
| Send Message (General Thread) | /api/lexi/chat | PASS | Got response: Lexi provides education, organization, and res |

### Timeline

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Get Timeline | - | SKIP | No case ID |

### Contacts

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Contacts | - | SKIP | No case ID |

### Deadlines

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Deadlines | - | SKIP | No case ID |

### Communications

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Communications | - | SKIP | No case ID |

### Children

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Children | - | SKIP | No case ID |

## Coverage Analysis

### Features Tested
- ✓ Auth: Environment Variables
- ✓ Auth: Login API
- ✓ AI Pipeline: AI Health Check
- ✓ Lexi: List Threads
- ✓ Lexi: Create Thread
- ✓ Lexi: Send Message (General Thread)

### Features Skipped (Need Prerequisites)
- – Evidence: List Evidence (No auth or case ID)
- – Extraction: Check Extraction Status (No evidence to check)
- – Extraction: Retry Extraction Endpoint (No evidence to retry)
- – AI Pipeline: Run AI Analysis (No evidence to analyze)
- – AI Pipeline: List AI Analyses (No case ID)
- – Claims: Suggest Claims (No case ID)
- – Claims: List Claims (No case ID)
- – Claims: Compile Claims Preflight (No case ID)
- – Documents: List Documents (No case ID)
- – Exports: Pattern Analysis Export (No case ID)
- – Exports: Trial Prep Export (No case ID)
- – Timeline: Get Timeline (No case ID)
- – Contacts: List Contacts (No case ID)
- – Deadlines: List Deadlines (No case ID)
- – Communications: List Communications (No case ID)
- – Children: List Children (No case ID)

### Features Failed
- ✗ Case: Create Case - HTTP 402

### Not Tested (Requires UI/File Upload)
- Evidence file upload (requires multipart/form-data)
- Document template compilation (requires template selection)
- Court form generation (requires form data)
- Parenting plan wizard (multi-step UI flow)
- Child support calculator (interactive form)

## 401 Login Issue Explanation

The "Login failed: 401" seen in previous audits was caused by:

1. **Script: fullButtonAudit.ts** - Used `node-fetch` which has different cookie handling
2. **Issue**: The script checked `res.status === 200 && cookies` but cookies may be null in node-fetch
3. **Fix Applied**: Updated to use native fetch and proper cookie extraction
4. **Current Status**: PASS

Authentication is now working correctly.

## Commands

```bash
# Run full functional audit
npx tsx script/fullFunctionalAudit.ts

# Run individual smoke tests
npx tsx script/apiSmoke.ts
npx tsx script/aiSmoke.ts
```
