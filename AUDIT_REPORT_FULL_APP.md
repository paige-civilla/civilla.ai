# FULL APPLICATION AUDIT REPORT

**Generated:** 2026-01-20T03:33:57.720Z  
**Base URL:** http://localhost:5000

---

## 1. Environment Status

| Variable | Present |
|----------|---------|
| DATABASE_URL | YES |
| OPENAI_API_KEY | YES |
| GOOGLE_CLOUD_VISION_API_KEY | YES |
| SESSION_SECRET | YES |
| STRIPE_SECRET_KEY | YES |
| STRIPE_PUBLISHABLE_KEY | YES |
| TURNSTILE_SECRET_KEY | NO |
| TURNSTILE_SITE_KEY | NO |
| TEST_EMAIL | YES |
| TEST_PASSWORD | YES |

---

## 2. Backend Routes (Express API)

**Total Routes:** 334

| Method | Path |
|--------|------|
| GET | /api/activity-logs |
| POST | /api/activity/module-view |
| POST | /api/admin/acknowledge-alert |
| GET | /api/admin/ai-jobs |
| POST | /api/admin/ai-jobs/requeue-stale |
| GET | /api/admin/ai-status |
| GET | /api/admin/audit |
| GET | /api/admin/contracts |
| GET | /api/admin/diagnostics |
| GET | /api/admin/entitlements |
| POST | /api/admin/feature-flag |
| GET | /api/admin/metrics |
| POST | /api/admin/refresh-entitlements |
| GET | /api/admin/smoke |
| GET | /api/admin/system-health |
| GET | /api/admin/users |
| PATCH | /api/admin/users/:userId/roles |
| GET | /api/ai/diagnostics |
| GET | /api/ai/health |
| GET | /api/analytics/case-overview/:caseId |
| POST | /api/analytics/event |
| GET | /api/analytics/user-overview |
| PATCH | /api/anchors/:anchorId |
| DELETE | /api/anchors/:anchorId |
| POST | /api/attorney/accept |
| GET | /api/attorney/shared-cases |
| GET | /api/audit/run |
| POST | /api/auth/login |
| POST | /api/auth/logout |
| GET | /api/auth/me |
| POST | /api/auth/register |
| GET | /api/auth/turnstile-status |
| POST | /api/billing/checkout |
| GET | /api/billing/credits |
| POST | /api/billing/portal |
| POST | /api/billing/processing-pack/checkout |
| GET | /api/billing/status |
| PATCH | /api/calendar/items/:itemId |
| DELETE | /api/calendar/items/:itemId |
| GET | /api/cases |
| POST | /api/cases |
| GET | /api/cases/:caseId |
| PATCH | /api/cases/:caseId |
| GET | /api/cases/:caseId/ai-analyses |
| GET | /api/cases/:caseId/ai-jobs/status |
| GET | /api/cases/:caseId/ai-jobs/status |
| GET | /api/cases/:caseId/ai/status |
| GET | /api/cases/:caseId/anchors |
| GET | /api/cases/:caseId/attorney/access |
| GET | /api/cases/:caseId/attorney/collaborators |
| DELETE | /api/cases/:caseId/attorney/collaborators/:collaboratorUserId |
| POST | /api/cases/:caseId/attorney/invites |
| GET | /api/cases/:caseId/attorney/invites |
| DELETE | /api/cases/:caseId/attorney/invites/:inviteId |
| GET | /api/cases/:caseId/background-ai-status |
| GET | /api/cases/:caseId/calendar |
| GET | /api/cases/:caseId/calendar/categories |
| POST | /api/cases/:caseId/calendar/categories |
| GET | /api/cases/:caseId/calendar/items |
| POST | /api/cases/:caseId/calendar/items |
| POST | /api/cases/:caseId/child-support/estimate |
| GET | /api/cases/:caseId/child-support/research |
| POST | /api/cases/:caseId/child-support/research |
| GET | /api/cases/:caseId/children |
| POST | /api/cases/:caseId/children |
| POST | /api/cases/:caseId/citations |
| GET | /api/cases/:caseId/claims |
| POST | /api/cases/:caseId/claims |
| GET | /api/cases/:caseId/claims/:claimId/links |
| POST | /api/cases/:caseId/claims/:claimId/links |
| POST | /api/cases/:caseId/claims/retry |
| GET | /api/cases/:caseId/communications |
| POST | /api/cases/:caseId/communications |
| GET | /api/cases/:caseId/contacts |
| POST | /api/cases/:caseId/contacts |
| POST | /api/cases/:caseId/court-templates/compile |
| GET | /api/cases/:caseId/court-templates/preflight |
| GET | /api/cases/:caseId/dashboard/calendar |
| GET | /api/cases/:caseId/deadlines |
| POST | /api/cases/:caseId/deadlines |
| GET | /api/cases/:caseId/documents |
| POST | /api/cases/:caseId/documents |
| POST | /api/cases/:caseId/documents/:documentId/acknowledge |
| POST | /api/cases/:caseId/documents/autofill |
| POST | /api/cases/:caseId/documents/compile-claims |
| GET | /api/cases/:caseId/documents/compile-claims/preflight |
| POST | /api/cases/:caseId/documents/compile-template |
| POST | /api/cases/:caseId/documents/field-mapping |
| POST | /api/cases/:caseId/documents/generate |
| POST | /api/cases/:caseId/documents/templates/:templateKey/preflight |
| GET | /api/cases/:caseId/draft-outlines |
| POST | /api/cases/:caseId/draft-outlines |
| GET | /api/cases/:caseId/draft-readiness |
| GET | /api/cases/:caseId/draft-readiness |
| GET | /api/cases/:caseId/evidence |
| POST | /api/cases/:caseId/evidence |
| GET | /api/cases/:caseId/evidence-notes |
| PATCH | /api/cases/:caseId/evidence/:evidenceId |
| GET | /api/cases/:caseId/evidence/:evidenceId/ai-analyses |
| POST | /api/cases/:caseId/evidence/:evidenceId/ai-analyses |
| POST | /api/cases/:caseId/evidence/:evidenceId/ai-analyses/retry |
| POST | /api/cases/:caseId/evidence/:evidenceId/ai-analyses/run |
| GET | /api/cases/:caseId/evidence/:evidenceId/anchors |
| POST | /api/cases/:caseId/evidence/:evidenceId/anchors |
| GET | /api/cases/:caseId/evidence/:evidenceId/citations |
| POST | /api/cases/:caseId/evidence/:evidenceId/claims/suggest |
| GET | /api/cases/:caseId/evidence/:evidenceId/extraction |
| GET | /api/cases/:caseId/evidence/:evidenceId/extraction |
| POST | /api/cases/:caseId/evidence/:evidenceId/extraction |
| POST | /api/cases/:caseId/evidence/:evidenceId/extraction/retry |
| POST | /api/cases/:caseId/evidence/:evidenceId/extraction/run |
| GET | /api/cases/:caseId/evidence/:evidenceId/facts |
| POST | /api/cases/:caseId/evidence/:evidenceId/facts/run |
| GET | /api/cases/:caseId/evidence/:evidenceId/notes-full |
| POST | /api/cases/:caseId/evidence/:evidenceId/notes-full |
| GET | /api/cases/:caseId/evidence/:evidenceId/ocr-pages |
| POST | /api/cases/:caseId/evidence/:evidenceId/process |
| GET | /api/cases/:caseId/evidence/:evidenceId/process |
| GET | /api/cases/:caseId/evidence/:fileId/notes |
| POST | /api/cases/:caseId/evidence/:fileId/notes |
| GET | /api/cases/:caseId/exhibit-lists |
| POST | /api/cases/:caseId/exhibit-lists |
| GET | /api/cases/:caseId/exhibit-packets |
| POST | /api/cases/:caseId/exhibit-packets |
| GET | /api/cases/:caseId/exhibit-snippets |
| POST | /api/cases/:caseId/exhibit-snippets |
| GET | /api/cases/:caseId/facts |
| GET | /api/cases/:caseId/facts |
| POST | /api/cases/:caseId/facts |
| POST | /api/cases/:caseId/facts/suggest |
| POST | /api/cases/:caseId/form-packs/search |
| GET | /api/cases/:caseId/generated-documents |
| GET | /api/cases/:caseId/generated-exhibit-packets |
| GET | /api/cases/:caseId/issues |
| POST | /api/cases/:caseId/issues |
| GET | /api/cases/:caseId/lexi/context |
| GET | /api/cases/:caseId/lexi/memory |
| PATCH | /api/cases/:caseId/lexi/memory |
| POST | /api/cases/:caseId/lexi/memory/rebuild |
| GET | /api/cases/:caseId/lexi/threads |
| POST | /api/cases/:caseId/lexi/threads |
| GET | /api/cases/:caseId/parenting-plan |
| POST | /api/cases/:caseId/parenting-plan |
| GET | /api/cases/:caseId/parenting-plan/research |
| POST | /api/cases/:caseId/parenting-plan/research |
| GET | /api/cases/:caseId/pattern-analysis |
| GET | /api/cases/:caseId/pattern-analysis/export |
| GET | /api/cases/:caseId/pattern-analysis/input |
| GET | /api/cases/:caseId/phase-status |
| GET | /api/cases/:caseId/quality-check |
| GET | /api/cases/:caseId/readiness |
| GET | /api/cases/:caseId/resources |
| POST | /api/cases/:caseId/resources |
| PATCH | /api/cases/:caseId/resources/:resourceId |
| DELETE | /api/cases/:caseId/resources/:resourceId |
| GET | /api/cases/:caseId/resources/:resourceId/field-maps |
| POST | /api/cases/:caseId/resources/:resourceId/field-maps |
| PATCH | /api/cases/:caseId/resources/:resourceId/field-maps/:fieldMapId |
| DELETE | /api/cases/:caseId/resources/:resourceId/field-maps/:fieldMapId |
| POST | /api/cases/:caseId/resources/:resourceId/field-maps/bulk |
| POST | /api/cases/:caseId/resources/:resourceId/field-maps/suggest |
| GET | /api/cases/:caseId/rule-terms |
| POST | /api/cases/:caseId/rule-terms |
| GET | /api/cases/:caseId/search |
| GET | /api/cases/:caseId/tasks |
| POST | /api/cases/:caseId/tasks |
| GET | /api/cases/:caseId/template-autofill |
| GET | /api/cases/:caseId/templates/field-mapping |
| GET | /api/cases/:caseId/templates/preflight |
| GET | /api/cases/:caseId/timeline |
| POST | /api/cases/:caseId/timeline |
| GET | /api/cases/:caseId/timeline/categories |
| POST | /api/cases/:caseId/timeline/categories |
| PATCH | /api/cases/:caseId/timeline/categories/:categoryId |
| DELETE | /api/cases/:caseId/timeline/categories/:categoryId |
| POST | /api/cases/:caseId/timeline/categories/seed |
| GET | /api/cases/:caseId/timeline/events/:eventId/links |
| POST | /api/cases/:caseId/timeline/events/:eventId/links |
| GET | /api/cases/:caseId/transparency-log |
| GET | /api/cases/:caseId/trial-prep-shortlist |
| POST | /api/cases/:caseId/trial-prep-shortlist |
| GET | /api/cases/:caseId/trial-prep/export |
| GET | /api/cases/:caseId/trial-prep/items |
| POST | /api/cases/:caseId/trial-prep/items |
| PATCH | /api/cases/:caseId/trial-prep/items/:itemId |
| DELETE | /api/cases/:caseId/trial-prep/items/:itemId |
| GET | /api/cases/:caseId/trial-prep/sections |
| PATCH | /api/children/:childId |
| DELETE | /api/children/:childId |
| DELETE | /api/claim-links/:linkId |
| GET | /api/claims/:claimId |
| PATCH | /api/claims/:claimId |
| DELETE | /api/claims/:claimId |
| POST | /api/claims/:claimId/citations/:citationId |
| DELETE | /api/claims/:claimId/citations/:citationId |
| POST | /api/claims/:claimId/citations/auto |
| PATCH | /api/claims/:claimId/lock |
| PATCH | /api/claims/:claimId/unlock |
| PATCH | /api/communications/:commId |
| DELETE | /api/communications/:commId |
| POST | /api/communications/:commId/mark-resolved |
| POST | /api/communications/:commId/push-to-calendar |
| POST | /api/communications/:commId/push-to-timeline |
| PATCH | /api/contacts/:contactId |
| DELETE | /api/contacts/:contactId |
| GET | /api/court-templates |
| PATCH | /api/deadlines/:deadlineId |
| DELETE | /api/deadlines/:deadlineId |
| GET | /api/document-templates |
| GET | /api/documents/:docId |
| PATCH | /api/documents/:docId |
| DELETE | /api/documents/:docId |
| POST | /api/documents/:docId/duplicate |
| GET | /api/documents/:docId/export/docx |
| GET | /api/draft-outlines/:outlineId |
| PATCH | /api/draft-outlines/:outlineId |
| DELETE | /api/draft-outlines/:outlineId |
| POST | /api/draft-outlines/:outlineId/claims |
| DELETE | /api/draft-outlines/:outlineId/claims/:claimId |
| PATCH | /api/draft-outlines/:outlineId/claims/bulk |
| POST | /api/draft-outlines/:outlineId/compile |
| PATCH | /api/evidence-ai-analyses/:analysisId |
| DELETE | /api/evidence-ai-analyses/:analysisId |
| PATCH | /api/evidence-notes/:noteId |
| DELETE | /api/evidence-notes/:noteId |
| POST | /api/evidence-notes/:noteId/create-timeline-event |
| POST | /api/evidence-notes/:noteId/link-exhibit |
| DELETE | /api/evidence-notes/:noteId/unlink-exhibit/:exhibitListId |
| DELETE | /api/evidence/:evidenceId |
| POST | /api/evidence/:evidenceId/add-to-exhibit |
| GET | /api/evidence/:evidenceId/download |
| GET | /api/evidence/:evidenceId/exhibits |
| PATCH | /api/exhibit-lists/:listId |
| DELETE | /api/exhibit-lists/:listId |
| POST | /api/exhibit-lists/:listId/evidence |
| DELETE | /api/exhibit-lists/:listId/evidence/:evidenceFileId |
| GET | /api/exhibit-lists/:listId/exhibits |
| POST | /api/exhibit-lists/:listId/exhibits |
| POST | /api/exhibit-lists/:listId/exhibits/reorder |
| GET | /api/exhibit-lists/:listId/export |
| GET | /api/exhibit-lists/:listId/items |
| POST | /api/exhibit-lists/:listId/notes |
| DELETE | /api/exhibit-lists/:listId/notes/:evidenceNoteId |
| POST | /api/exhibit-lists/:listId/reorder |
| GET | /api/exhibit-packets/:packetId |
| PATCH | /api/exhibit-packets/:packetId |
| DELETE | /api/exhibit-packets/:packetId |
| POST | /api/exhibit-packets/:packetId/generate |
| GET | /api/exhibit-packets/:packetId/items |
| POST | /api/exhibit-packets/:packetId/items |
| POST | /api/exhibit-packets/:packetId/items/reorder |
| PATCH | /api/exhibit-snippets/:snippetId |
| DELETE | /api/exhibit-snippets/:snippetId |
| PATCH | /api/exhibits/:exhibitId |
| DELETE | /api/exhibits/:exhibitId |
| GET | /api/exhibits/:exhibitId/evidence |
| POST | /api/exhibits/:exhibitId/evidence/attach |
| POST | /api/exhibits/:exhibitId/evidence/detach |
| DELETE | /api/facts/:factId |
| PATCH | /api/facts/:factId |
| DELETE | /api/facts/:factId |
| GET | /api/facts/:factId/citations |
| POST | /api/facts/:factId/citations/:citationId |
| DELETE | /api/facts/:factId/citations/:citationId |
| POST | /api/facts/:factId/promote-to-claim |
| GET | /api/form-packs/states |
| GET | /api/generated-documents/:docId |
| GET | /api/grants/metrics |
| GET | /api/grants/metrics.csv |
| GET | /api/health |
| GET | /api/health/db |
| GET | /api/health/documents |
| GET | /api/health/docx |
| GET | /api/health/evidence |
| GET | /api/health/session |
| GET | /api/health/timeline |
| POST | /api/intake/start |
| GET | /api/issues/:issueId |
| PATCH | /api/issues/:issueId |
| DELETE | /api/issues/:issueId |
| POST | /api/issues/:issueId/claims/:claimId |
| DELETE | /api/issues/:issueId/claims/:claimId |
| POST | /api/lexi/chat |
| POST | /api/lexi/chat/stream |
| GET | /api/lexi/context |
| GET | /api/lexi/disclaimer |
| POST | /api/lexi/feedback |
| GET | /api/lexi/feedback |
| GET | /api/lexi/health |
| GET | /api/lexi/prefs |
| PUT | /api/lexi/prefs |
| GET | /api/lexi/threads |
| POST | /api/lexi/threads |
| PATCH | /api/lexi/threads/:threadId |
| DELETE | /api/lexi/threads/:threadId |
| GET | /api/lexi/threads/:threadId/messages |
| PATCH | /api/notes-full/:noteId |
| DELETE | /api/notes-full/:noteId |
| PATCH | /api/ocr-pages/:ocrPageId |
| POST | /api/onboarding/complete |
| POST | /api/onboarding/lite |
| GET | /api/onboarding/policies |
| GET | /api/onboarding/status |
| PATCH | /api/packet-items/:itemId |
| DELETE | /api/packet-items/:itemId |
| GET | /api/packet-items/:itemId/evidence |
| POST | /api/packet-items/:itemId/evidence/attach |
| POST | /api/packet-items/:itemId/evidence/detach |
| POST | /api/packet-items/:itemId/evidence/reorder |
| PATCH | /api/parenting-plan/:planId |
| DELETE | /api/parenting-plan/:planId |
| POST | /api/parenting-plan/:planId/export-docx |
| PUT | /api/parenting-plan/:planId/sections/:sectionKey |
| GET | /api/profile |
| PATCH | /api/profile |
| GET | /api/search |
| POST | /api/stripe/create-checkout-session |
| GET | /api/system/health-ai |
| PATCH | /api/tasks/:taskId |
| DELETE | /api/tasks/:taskId |
| GET | /api/template-fields/:templateType |
| GET | /api/templates |
| POST | /api/templates/docx |
| PATCH | /api/timeline/:eventId |
| DELETE | /api/timeline/:eventId |
| DELETE | /api/timeline/event-links/:linkId |
| PATCH | /api/trial-prep-shortlist/:itemId |
| DELETE | /api/trial-prep-shortlist/:itemId |
| GET | /api/turnstile/site-key |
| POST | /api/user/accept-drafting-disclaimer |
| GET | /api/user/tour-state |
| PATCH | /api/user/tour-state |
| GET | /api/user/transparency-log |
| GET | /api/vision/health |

---

## 3. Frontend Routes (React/Wouter)

**Total Routes:** 70

### Marketing Pages

| Path | Component |
|------|-----------|
| / | Home |
| /how-civilla-works | HowCivillaWorks |
| /meet-the-founders | MeetTheFounders |
| /our-mission | OurMission |
| /plans | Plans |
| /legal-compliance | LegalCompliance |
| /privacy-policy | PrivacyPolicy |
| /safety-support | SafetySupport |
| /accessibility | Accessibility |
| /contact | Contact |
| /terms | TermsOfService |
| /login | Login |
| /register | Register |
| /careers | Careers |
| /wall-of-wins | WallOfWins |
| /faq | FAQPage |
| /attorney/accept | AttorneyAcceptInvite |
| /founders | Redirect → /meet-the-founders |
| /mission | Redirect → /our-mission |

### App Pages (Authenticated)

| Path | Component | Type |
|------|-----------|------|
| /app/attorney/case/:caseId | AttorneyPortal | page |
| /app/onboarding | OnboardingLite | page |
| /app/lexi-intake | LexiIntake | page |
| /app/start-here | AppStartHere | page |
| /app/admin | AppAdminDashboard | page |
| /app/admin/policy | AppAdminPolicy | page |
| /app/grants | AppGrantDashboard | page |
| /app/grants/print | AppGrantDashboardPrint | page |
| /app/account | AppAccountSettings | page |
| /app/cases | AppCases | page |
| /app/dashboard/:caseId | AppDashboard | page |
| /app/case/:caseId | AppCase | page |
| /app/case-settings/:caseId | AppCaseSettings | page |
| /app/documents/:caseId | AppDocuments | page |
| /app/timeline/:caseId | AppTimeline | page |
| /app/evidence/:caseId | AppEvidence | page |
| /app/exhibits/:caseId | AppExhibits | page |
| /app/tasks/:caseId | AppTasks | page |
| /app/deadlines/:caseId | AppDeadlines | page |
| /app/patterns/:caseId | AppPatterns | page |
| /app/contacts/:caseId | AppContacts | page |
| /app/communications/:caseId | AppCommunications | page |
| /app/child-support/:caseId | AppChildSupport | page |
| /app/children/:caseId | AppChildren | page |
| /app/library/:caseId | AppDocumentLibrary | page |
| /app/disclosures/:caseId | AppDisclosures | page |
| /app/trial-prep/:caseId | AppTrialPrep | page |
| /app/trial-prep/:caseId/print | AppTrialPrepPrint | page |
| /app/parenting-plan/:caseId | AppParentingPlan | page |
| /app/court-forms/:caseId | AppCourtForms | page |
| /app/dashboard | CaseRedirect → dashboard | case-redirect |
| /app/case | CaseRedirect → case | case-redirect |
| /app/documents | CaseRedirect → documents | case-redirect |
| /app/timeline | CaseRedirect → timeline | case-redirect |
| /app/evidence | CaseRedirect → evidence | case-redirect |
| /app/exhibits | CaseRedirect → exhibits | case-redirect |
| /app/tasks | CaseRedirect → tasks | case-redirect |
| /app/deadlines | CaseRedirect → deadlines | case-redirect |
| /app/patterns | CaseRedirect → patterns | case-redirect |
| /app/messages | CaseRedirect → patterns | case-redirect |
| /app/contacts | CaseRedirect → contacts | case-redirect |
| /app/communications | CaseRedirect → communications | case-redirect |
| /app/child-support | CaseRedirect → child-support | case-redirect |
| /app/children | CaseRedirect → children | case-redirect |
| /app/library | CaseRedirect → library | case-redirect |
| /app/disclosures | CaseRedirect → disclosures | case-redirect |
| /app/trial-prep | CaseRedirect → trial-prep | case-redirect |
| /app/parenting-plan | CaseRedirect → parenting-plan | case-redirect |
| /app/court-forms | CaseRedirect → court-forms | case-redirect |
| /app | CaseRedirect → dashboard | case-redirect |

---

## 4. API Endpoint Audit Results

| Endpoint | Status | Details |
|----------|--------|---------|
| /api/health | PASS | - |
| /api/health/db | PASS | - |
| /api/health/session | PASS | - |
| /api/health/timeline | PASS | - |
| /api/health/evidence | PASS | - |
| /api/health/documents | PASS | - |
| /api/health/docx | PASS | - |
| /api/ai/health | FAIL | Expected 200, got 401 |
| /api/auth/me | PASS | - |
| /api/profile | PASS | - |
| /api/cases | PASS | - |
| /api/turnstile/site-key | PASS | - |
| /api/auth/turnstile-status | PASS | - |

**Summary:** 12 PASS, 1 FAIL

---

## 4b. Authenticated API Tests

**Auth Coverage:** RUN
**TEST_EMAIL present:** true
**TEST_PASSWORD present:** true

| Endpoint | Status | Details |
|----------|--------|---------|
| /api/ai/health | PASS | - |
| /api/cases | PASS | - |
| /api/profile | PASS | - |
| /api/lexi/threads | PASS | - |
| /api/onboarding/status | PASS | - |

**Auth Summary:** 5 PASS, 0 FAIL, 0 SKIP

---

## 5. Button/Link Audit Results

*Note: Run `npx playwright test` for interactive UI testing.*

| Page | Element | Action | Status |
|------|---------|--------|--------|
| / (Home) | Header Nav | Click | Pending |
| /login | Login Form | Submit | Pending |
| /register | Register Form | Submit | Pending |
| /app/onboarding | Continue Button | Navigate | **FIXED** |
| /app/onboarding | Skip Button | Navigate | **FIXED** |
| /app/evidence | Upload Button | Open Picker | Pending |
| /app/documents | Create Button | Open Dialog | Pending |
| /app/lexi-intake | Send Button | Send Message | Pending |

---

## 6. AI Pipeline Audit Results

| Pipeline | Endpoint | Status | Details |
|----------|----------|--------|---------|
| AI Health | /api/ai/health | FAIL | OpenAI connection |
| OCR/Extraction | /api/health/evidence | PASS | Google Cloud Vision |
| Lexi Thread | /api/lexi/threads | Requires Auth | Thread creation |
| Lexi Chat | /api/lexi/chat | Requires Auth | Streaming response |
| Pattern Analysis | /api/cases/:id/pattern-analysis | Requires Auth | AI patterns |
| Claims Suggest | /api/cases/:id/claims/suggest | Requires Auth | Claim generation |
| Compile Claims | /api/cases/:id/compile-claims | Requires Auth | Document compile |

---

## 7. Applied Fixes

| # | File | Line | Fix Description |
|---|------|------|-----------------|
| 1 | shared/schema.ts | 114 | Added "lite" to onboardingStatus enum |
| 2 | client/src/pages/OnboardingLite.tsx | 41-85 | Added skipMode state for correct navigation |

---

## 8. Blocking Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Onboarding buttons not navigating | HIGH | **FIXED** |
| Stripe API key invalid | MEDIUM | Pre-existing |
| 104 LSP type errors in routes.ts | LOW | Non-blocking |

---

## 9. Test Commands

```bash
# Run route audits
npx tsx script/auditBackendRoutes.ts
npx tsx script/auditFrontendRoutes.ts

# Run API smoke tests
npx tsx script/apiSmoke.ts

# Run AI pipeline tests
npx tsx script/aiSmoke.ts

# Run Playwright UI tests (requires installation)
npx playwright test

# Generate full report
npx tsx script/generateFullAudit.ts
```

---

## 10. Files Generated

| File | Purpose |
|------|---------|
| audit/backend_routes.json | Backend route inventory |
| audit/frontend_routes.json | Frontend route inventory |
| audit/playwright/* | UI test artifacts |
| AUDIT_REPORT_FULL_APP.md | This report |

---

## 11. Final Verdict

**Ready for testing:** YES

**Auth Coverage:** RUN
**TEST_EMAIL present:** true
**TEST_PASSWORD present:** true

**Summary:**
- Unauthenticated API tests: 12/13 passing
- Authenticated API tests: 5/5 (0 skipped)
- Onboarding flow fixed (buttons navigate correctly)
- Auth system operational
- /api/ai/health logged in: { ok: true }

**Next Steps:**
1. Run Playwright tests: npx playwright test
2. Review any failures in audit/playwright-report/
