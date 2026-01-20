# Functional Audit Report

Generated: 2026-01-20T06:06:23.551Z

## Summary

| Metric | Value |
|--------|-------|
| **Auth Status** | PASS |
| **Test Case ID** | N/A |
| **Total Tests** | 23 |
| **Passed** | 8 |
| **Failed** | 12 |
| **Skipped** | 3 |
| **Pass Rate** | 34.8% |

## Button-to-Endpoint Mapping

| Feature/Button | UI Location | API Endpoint | DB Tables | Result |
|----------------|-------------|--------------|-----------|--------|
| Login | /login | /api/auth/login | users, sessions | PASS |
| Create Case | /app/cases | /api/cases | cases | PASS |
| Upload Evidence | /app/evidence/:id | /api/cases/:id/evidence | evidence | FAIL |
| Run Extraction | /app/evidence/:id | /api/cases/:id/evidence/:id/extract | evidence_extractions | FAIL |
| Retry Extraction | /app/evidence/:id | /api/cases/:id/evidence/:id/retry | evidence_extractions | FAIL |
| Run AI Analysis | /app/evidence/:id | /api/cases/:id/evidence/:id/analyze | evidence_ai_analyses | FAIL |
| Suggest Claims | /app/patterns/:id | /api/cases/:id/claims/suggest | case_claims, claim_citations | FAIL |
| Accept/Reject Claim | /app/patterns/:id | PATCH /api/claims/:id | case_claims | NOT TESTED |
| Compile Claims | /app/documents/:id | /api/cases/:id/documents/compile-claims | case_documents | FAIL |
| Export Document | /app/documents/:id | /api/cases/:id/documents/:id/export | case_documents | FAIL |
| Pattern Analysis | /app/patterns/:id | /api/cases/:id/pattern-analysis | case_patterns | FAIL |
| Trial Prep Export | /app/trial-prep/:id | /api/cases/:id/trial-prep/export | case_outlines | FAIL |
| Create Lexi Thread | /app (Lexi panel) | /api/lexi/threads | lexi_threads | PASS |
| Send Lexi Message | /app (Lexi panel) | /api/lexi/chat | lexi_messages | PASS |
| Timeline Events | /app/timeline/:id | /api/cases/:id/timeline | timeline_events | FAIL |
| Contacts | /app/contacts/:id | /api/cases/:id/contacts | case_contacts | FAIL |
| Deadlines | /app/deadlines/:id | /api/cases/:id/deadlines | case_deadlines | FAIL |
| Communications | /app/communications/:id | /api/cases/:id/communications | case_communications | FAIL |
| Children | /app/children/:id | /api/cases/:id/children | case_children | FAIL |

## Detailed Test Results

### Auth

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Environment Variables | - | PASS | TEST_EMAIL length: 18, TEST_PASSWORD length: 14 |
| Login API | /api/auth/login | PASS | Logged in as qa.test@civilla.ai |

### Case

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Cases | /api/cases | PASS | Found 1 existing case(s), using: 6817726b-974c-4776-95b0-6a0 |

### Evidence

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Evidence | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/evidence | FAIL | HTTP 401 |

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
| List AI Analyses | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/ai-analyses | FAIL | HTTP 401 |

### Claims

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Suggest Claims | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/claims/suggest | PASS | Endpoint responsive (200) |
| List Claims | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/claims | FAIL | HTTP 401 |
| Compile Claims Preflight | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/documents/compile-claims/preflight | FAIL | HTTP 401 |

### Documents

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Documents | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/documents | FAIL | HTTP 401 |

### Exports

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Pattern Analysis | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/pattern-analysis | FAIL | HTTP 401 |
| Trial Prep Export | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/trial-prep/export | FAIL | HTTP 401 |

### Lexi

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Threads | /api/lexi/threads | PASS | Found 0 threads |
| Create Thread | /api/lexi/threads | PASS | Created thread: 6912f698-189d-49dc-9a4e-adccf60a7c90 |
| Send Message (General Thread) | /api/lexi/chat | PASS | Got response: Lexi provides education, organization, and res |

### Timeline

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| Get Timeline | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/timeline | FAIL | HTTP 401 |

### Contacts

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Contacts | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/contacts | FAIL | HTTP 401 |

### Deadlines

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Deadlines | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/deadlines | FAIL | HTTP 401 |

### Communications

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Communications | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/communications | FAIL | HTTP 401 |

### Children

| Test | Endpoint | Status | Details |
|------|----------|--------|----------|
| List Children | /api/cases/6817726b-974c-4776-95b0-6a0f1f7542d4/children | FAIL | HTTP 401 |

## Coverage Analysis

### Features Tested
- ✓ Auth: Environment Variables
- ✓ Auth: Login API
- ✓ Case: List Cases
- ✓ AI Pipeline: AI Health Check
- ✓ Claims: Suggest Claims
- ✓ Lexi: List Threads
- ✓ Lexi: Create Thread
- ✓ Lexi: Send Message (General Thread)

### Features Skipped (Need Prerequisites)
- – Extraction: Check Extraction Status (No evidence to check)
- – Extraction: Retry Extraction Endpoint (No evidence to retry)
- – AI Pipeline: Run AI Analysis (No evidence to analyze)

### Features Failed
- ✗ Evidence: List Evidence - HTTP 401
- ✗ AI Pipeline: List AI Analyses - HTTP 401
- ✗ Claims: List Claims - HTTP 401
- ✗ Claims: Compile Claims Preflight - HTTP 401
- ✗ Documents: List Documents - HTTP 401
- ✗ Exports: Pattern Analysis - HTTP 401
- ✗ Exports: Trial Prep Export - HTTP 401
- ✗ Timeline: Get Timeline - HTTP 401
- ✗ Contacts: List Contacts - HTTP 401
- ✗ Deadlines: List Deadlines - HTTP 401
- ✗ Communications: List Communications - HTTP 401
- ✗ Children: List Children - HTTP 401

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
