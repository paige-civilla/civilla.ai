# CIVILLA PROJECT STATE AUDIT — SINGLE SOURCE OF TRUTH
**Generated: January 3, 2026**

---

## A) ENVIRONMENT & BOOT CONFIGURATION

### 1. Environment Variables Referenced in Backend

| File | Variable | Purpose | Required |
|------|----------|---------|----------|
| server/db.ts | DATABASE_URL | PostgreSQL connection | REQUIRED |
| server/db.ts | NODE_ENV | Production detection | OPTIONAL |
| server/index.ts | SESSION_SECRET | Session encryption | REQUIRED in prod |
| server/index.ts | PORT | Server port (default 5000) | OPTIONAL |
| server/index.ts | OPENAI_API_KEY | Lexi AI provider | OPTIONAL |
| server/routes.ts | OPENAI_API_KEY | Lexi chat endpoint | OPTIONAL |
| server/r2.ts | R2_ACCOUNT_ID | Cloudflare R2 storage | OPTIONAL |
| server/r2.ts | R2_ACCESS_KEY_ID | R2 auth | OPTIONAL |
| server/r2.ts | R2_SECRET_ACCESS_KEY | R2 auth | OPTIONAL |
| server/r2.ts | R2_BUCKET_NAME | R2 bucket | OPTIONAL |
| server/r2.ts | R2_ENDPOINT | R2 endpoint | OPTIONAL |
| server/oauth.ts | GOOGLE_CLIENT_ID | Google OAuth | OPTIONAL |
| server/oauth.ts | GOOGLE_CLIENT_SECRET | Google OAuth | OPTIONAL |
| server/oauth.ts | GOOGLE_REDIRECT_URL | Google OAuth | OPTIONAL |
| server/oauth.ts | APPLE_CLIENT_ID | Apple OAuth | OPTIONAL |
| server/oauth.ts | APPLE_REDIRECT_URL | Apple OAuth | OPTIONAL |
| server/mail.ts | SMTP_HOST | Email sending | OPTIONAL |
| server/mail.ts | SMTP_USER | Email auth | OPTIONAL |
| server/mail.ts | SMTP_PASS | Email auth | OPTIONAL |
| server/replit_integrations/* | AI_INTEGRATIONS_OPENAI_API_KEY | Replit AI (unused for Lexi) | OPTIONAL |
| server/replit_integrations/* | AI_INTEGRATIONS_OPENAI_BASE_URL | Replit AI | OPTIONAL |

### 2. Database Initialization

| File | Env Var Used | Fallback Logic |
|------|--------------|----------------|
| server/db.ts | DATABASE_URL | None - throws error if missing |

### 3. Server Boot Logging

On successful boot, server logs:
- `DB env var used: DATABASE_URL`
- `DB host: <hostname>` (e.g., `ep-muddy-rain-afb6ypj2-pooler.c-2.us-west-2.aws.neon.tech`)
- `R2 configured: true/false`
- Table initialization status for each table
- `Lexi provider: openai-direct` (if OPENAI_API_KEY present)

---

## B) DATABASE & SCHEMA INVENTORY

### 4. All Database Tables

| Table | Columns | Indexes | Foreign Keys |
|-------|---------|---------|--------------|
| **users** | id, email, password_hash, cases_allowed, created_at, updated_at | (primary) | - |
| **user_profiles** | user_id (PK), full_name, email, address_line_1, address_line_2, city, state, zip, phone, party_role, is_self_represented, auto_fill_enabled, auto_fill_choice_made, default_role, bar_number, firm_name, petitioner_name, respondent_name, onboarding_completed, onboarding_completed_at, tos_accepted_at, privacy_accepted_at, disclaimers_accepted_at, tos_version, privacy_version, disclaimers_version, calendar_task_color, calendar_deadline_color, calendar_timeline_color, onboarding_deferred, onboarding_status, created_at, updated_at | - | user_id → users.id |
| **auth_magic_links** | id, user_id, token_hash, expires_at, used_at, created_at | - | user_id → users.id |
| **auth_identities** | id, user_id, provider, provider_user_id, email_at_provider, created_at | provider_user_idx | user_id → users.id |
| **cases** | id, user_id, title, nickname, state, county, case_number, case_type, has_children, created_at, updated_at | idx_cases_user_id | user_id → users.id |
| **timeline_events** | id, user_id, case_id, event_date, title, category, notes, source, created_at, updated_at | case_event_date_idx, user_idx | user_id → users.id, case_id → cases.id |
| **evidence_files** | id, user_id, case_id, original_name, storage_key, mime_type, size_bytes, sha256, notes, category, description, tags, created_at | case_idx, user_idx, case_created_at_idx | user_id → users.id, case_id → cases.id |
| **documents** | id, user_id, case_id, title, template_key, content, created_at, updated_at | case_idx, user_idx | user_id → users.id, case_id → cases.id |
| **generated_documents** | id, user_id, case_id, template_type, title, payload_json, created_at | user_case_created_at_idx | user_id → users.id, case_id → cases.id |
| **case_children** | id, user_id, case_id, first_name, last_name, date_of_birth, notes, created_at | user_case_idx | user_id → users.id, case_id → cases.id |
| **tasks** | id, user_id, case_id, title, description, status, due_date, priority, created_at, updated_at | case_idx, user_idx, case_due_idx, case_status_idx | user_id → users.id, case_id → cases.id |
| **deadlines** | id, user_id, case_id, title, notes, status, due_date, created_at, updated_at | case_idx, user_idx, case_due_idx, case_status_idx | user_id → users.id, case_id → cases.id |
| **calendar_categories** | id, user_id, case_id, name, color, created_at | user_case_idx | user_id → users.id, case_id → cases.id |
| **case_calendar_items** | id, user_id, case_id, title, start_date, is_done, category_id, color_override, notes, created_at, updated_at | user_case_date_idx | user_id → users.id, case_id → cases.id, category_id → calendar_categories.id |
| **case_contacts** | id, user_id, case_id, name, role, organization_or_firm, email, phone, address, notes, created_at | case_idx, user_idx, case_role_idx | user_id → users.id, case_id → cases.id |
| **case_communications** | id, user_id, case_id, contact_id, direction, channel, status, occurred_at, subject, summary, follow_up_at, needs_follow_up, pinned, evidence_ids, timeline_event_id, calendar_item_id, created_at, updated_at | case_idx, user_idx, case_occurred_idx, case_followup_idx, status_idx, needs_followup_idx | user_id → users.id, case_id → cases.id |
| **exhibit_lists** | id, user_id, case_id, title, notes, created_at, updated_at | case_idx, user_idx, case_created_idx | user_id → users.id, case_id → cases.id |
| **exhibits** | id, user_id, case_id, exhibit_list_id, label, title, description, sort_order, included, created_at, updated_at | list_idx, case_idx, user_idx, list_sort_idx | user_id → users.id, case_id → cases.id |
| **exhibit_evidence** | id, user_id, case_id, exhibit_id, evidence_id, created_at | exhibit_idx, evidence_idx, case_idx, unique_idx | user_id → users.id, case_id → cases.id |
| **lexi_threads** | id, user_id, case_id, title, disclaimer_shown, created_at, updated_at | user_case_updated_idx | user_id → users.id, case_id → cases.id |
| **lexi_messages** | id, user_id, case_id, thread_id, role, content, safety_flags, metadata, model, created_at | thread_created_idx | user_id → users.id, case_id → cases.id, thread_id → lexi_threads.id |

### 5. Table Access in Code

| Table | Storage Layer | API Routes |
|-------|--------------|------------|
| users | server/storage.ts | /api/auth/* |
| user_profiles | server/storage.ts | /api/profile, /api/onboarding/* |
| auth_magic_links | (not in storage.ts) | (planned) |
| auth_identities | server/storage.ts | /api/auth/* (OAuth) |
| cases | server/storage.ts | /api/cases/* |
| timeline_events | server/storage.ts | /api/cases/:caseId/timeline, /api/timeline/* |
| evidence_files | server/storage.ts | /api/cases/:caseId/evidence, /api/evidence/* |
| documents | server/storage.ts | /api/cases/:caseId/documents, /api/documents/* |
| generated_documents | server/storage.ts | /api/cases/:caseId/generated-documents |
| case_children | server/storage.ts | /api/cases/:caseId/children, /api/children/* |
| tasks | server/storage.ts | /api/cases/:caseId/tasks, /api/tasks/* |
| deadlines | server/storage.ts | /api/cases/:caseId/deadlines, /api/deadlines/* |
| calendar_categories | server/storage.ts | /api/cases/:caseId/calendar/categories |
| case_calendar_items | server/storage.ts | /api/cases/:caseId/calendar/items, /api/calendar/items/* |
| case_contacts | server/storage.ts | /api/cases/:caseId/contacts, /api/contacts/* |
| case_communications | server/storage.ts | /api/cases/:caseId/communications, /api/communications/* |
| exhibit_lists | server/storage.ts | /api/cases/:caseId/exhibit-lists, /api/exhibit-lists/* |
| exhibits | server/storage.ts | /api/exhibit-lists/:listId/exhibits, /api/exhibits/* |
| exhibit_evidence | server/storage.ts | /api/exhibits/:exhibitId/evidence/* |
| lexi_threads | server/storage.ts | /api/cases/:caseId/lexi/threads, /api/lexi/threads/* |
| lexi_messages | server/storage.ts | /api/lexi/threads/:threadId/messages, /api/lexi/chat |

---

## C) STORAGE LAYER INVENTORY

### 6. Storage Functions (server/storage.ts)

| Function | Tables | Ownership Enforced |
|----------|--------|-------------------|
| getUser(id) | users | No (by ID only) |
| getUserByEmail(email) | users | No |
| createUser(user) | users | No |
| getCasesByUserId(userId) | cases | Yes (userId filter) |
| getCaseCountByUserId(userId) | cases | Yes |
| getCase(caseId, userId) | cases | Yes |
| createCase(userId, caseData) | cases | Yes |
| updateCase(caseId, userId, caseData) | cases | Yes |
| getAuthIdentity(provider, providerUserId) | auth_identities | No |
| createAuthIdentity(identity) | auth_identities | No |
| getAuthIdentitiesByUserId(userId) | auth_identities | Yes |
| listTimelineEvents(caseId, userId) | timeline_events | Yes |
| getTimelineEvent(eventId, userId) | timeline_events | Yes |
| createTimelineEvent(caseId, userId, data) | timeline_events | Yes |
| updateTimelineEvent(eventId, userId, data) | timeline_events | Yes |
| deleteTimelineEvent(eventId, userId) | timeline_events | Yes |
| listEvidenceFiles(caseId, userId) | evidence_files | Yes |
| getEvidenceFile(evidenceId, userId) | evidence_files | Yes |
| createEvidenceFile(caseId, userId, data) | evidence_files | Yes |
| deleteEvidenceFile(evidenceId, userId) | evidence_files | Yes |
| listDocuments(caseId, userId) | documents | Yes |
| getDocument(docId, userId) | documents | Yes |
| createDocument(caseId, userId, data) | documents | Yes |
| updateDocument(docId, userId, data) | documents | Yes |
| duplicateDocument(docId, userId) | documents | Yes |
| deleteDocument(docId, userId) | documents | Yes |
| getUserProfile(userId) | user_profiles | Yes |
| upsertUserProfile(userId, data) | user_profiles | Yes |
| listGeneratedDocuments(userId, caseId) | generated_documents | Yes |
| createGeneratedDocument(...) | generated_documents | Yes |
| getGeneratedDocument(userId, docId) | generated_documents | Yes |
| listCaseChildren(caseId, userId) | case_children | Yes |
| getCaseChild(childId, userId) | case_children | Yes |
| createCaseChild(caseId, userId, data) | case_children | Yes |
| updateCaseChild(childId, userId, data) | case_children | Yes |
| deleteCaseChild(childId, userId) | case_children | Yes |
| deleteAllCaseChildren(caseId, userId) | case_children | Yes |
| listTasks(userId, caseId) | tasks | Yes |
| createTask(userId, caseId, data) | tasks | Yes |
| updateTask(userId, taskId, data) | tasks | Yes |
| deleteTask(userId, taskId) | tasks | Yes |
| listDeadlines(userId, caseId) | deadlines | Yes |
| createDeadline(userId, caseId, data) | deadlines | Yes |
| updateDeadline(userId, deadlineId, data) | deadlines | Yes |
| deleteDeadline(userId, deadlineId) | deadlines | Yes |
| listCalendarCategories(userId, caseId) | calendar_categories | Yes |
| createCalendarCategory(userId, caseId, data) | calendar_categories | Yes |
| listCaseCalendarItems(userId, caseId) | case_calendar_items | Yes |
| createCaseCalendarItem(userId, caseId, data) | case_calendar_items | Yes |
| updateCaseCalendarItem(userId, itemId, data) | case_calendar_items | Yes |
| deleteCaseCalendarItem(userId, itemId) | case_calendar_items | Yes |
| listContacts(userId, caseId) | case_contacts | Yes |
| getContact(userId, contactId) | case_contacts | Yes |
| createContact(userId, caseId, data) | case_contacts | Yes |
| updateContact(userId, contactId, data) | case_contacts | Yes |
| deleteContact(userId, contactId) | case_contacts | Yes |
| listCommunications(userId, caseId) | case_communications | Yes |
| getCommunication(userId, commId) | case_communications | Yes |
| createCommunication(userId, caseId, data) | case_communications | Yes |
| updateCommunication(userId, commId, data) | case_communications | Yes |
| deleteCommunication(userId, commId) | case_communications | Yes |
| listExhibitLists(userId, caseId) | exhibit_lists | Yes |
| getExhibitList(userId, listId) | exhibit_lists | Yes |
| createExhibitList(userId, caseId, data) | exhibit_lists | Yes |
| updateExhibitList(userId, listId, data) | exhibit_lists | Yes |
| deleteExhibitList(userId, listId) | exhibit_lists | Yes |
| listExhibits(userId, exhibitListId) | exhibits | Yes |
| getExhibit(userId, exhibitId) | exhibits | Yes |
| createExhibit(userId, caseId, listId, data) | exhibits | Yes |
| updateExhibit(userId, exhibitId, data) | exhibits | Yes |
| deleteExhibit(userId, exhibitId) | exhibits | Yes |
| reorderExhibits(userId, listId, orderedIds) | exhibits | Yes |
| listExhibitEvidence(userId, exhibitId) | exhibit_evidence + evidence_files | Yes |
| attachEvidence(userId, caseId, exhibitId, evidenceId) | exhibit_evidence | Yes |
| detachEvidence(userId, exhibitId, evidenceId) | exhibit_evidence | Yes |
| listLexiThreads(userId, caseId) | lexi_threads | Yes |
| getLexiThread(userId, threadId) | lexi_threads | Yes |
| createLexiThread(userId, caseId, title) | lexi_threads | Yes |
| renameLexiThread(userId, threadId, title) | lexi_threads | Yes |
| deleteLexiThread(userId, threadId) | lexi_threads | Yes |
| markLexiThreadDisclaimerShown(userId, threadId) | lexi_threads | Yes |
| listLexiMessages(userId, threadId) | lexi_messages | Yes |
| createLexiMessage(...) | lexi_messages | Yes |

---

## D) API ROUTE INVENTORY

### 7. All API Routes

| Method | Path | Auth | Case-scoped | Ownership | Storage Function |
|--------|------|------|-------------|-----------|-----------------|
| GET | /api/health | No | No | N/A | - |
| GET | /api/health/db | No | No | N/A | testDbConnection |
| GET | /api/health/session | No | No | N/A | - |
| GET | /api/health/timeline | No | No | N/A | - |
| GET | /api/health/evidence | No | No | N/A | - |
| GET | /api/health/documents | No | No | N/A | - |
| GET | /api/health/docx | No | No | N/A | - |
| GET | /api/turnstile/site-key | No | No | N/A | - |
| GET | /api/auth/turnstile-status | No | No | N/A | - |
| POST | /api/auth/register | No | No | N/A | createUser |
| POST | /api/auth/login | No | No | N/A | getUserByEmail |
| POST | /api/auth/logout | No | No | N/A | - |
| GET | /api/auth/me | No | No | Yes | getUser |
| GET | /api/profile | Yes | No | Yes | getUserProfile |
| PATCH | /api/profile | Yes | No | Yes | upsertUserProfile |
| GET | /api/cases | Yes | No | Yes | getCasesByUserId |
| POST | /api/cases | Yes | No | Yes | createCase |
| GET | /api/cases/:caseId | Yes | Yes | Yes | getCase |
| PATCH | /api/cases/:caseId | Yes | Yes | Yes | updateCase |
| GET | /api/cases/:caseId/timeline | Yes | Yes | Yes | listTimelineEvents |
| POST | /api/cases/:caseId/timeline | Yes | Yes | Yes | createTimelineEvent |
| PATCH | /api/timeline/:eventId | Yes | No* | Yes | updateTimelineEvent |
| DELETE | /api/timeline/:eventId | Yes | No* | Yes | deleteTimelineEvent |
| GET | /api/cases/:caseId/evidence | Yes | Yes | Yes | listEvidenceFiles |
| POST | /api/cases/:caseId/evidence | Yes | Yes | Yes | createEvidenceFile |
| GET | /api/evidence/:evidenceId/download | Yes | No* | Yes | getEvidenceFile |
| PATCH | /api/cases/:caseId/evidence/:evidenceId | Yes | Yes | Yes | updateEvidenceFile |
| DELETE | /api/evidence/:evidenceId | Yes | No* | Yes | deleteEvidenceFile |
| GET | /api/document-templates | Yes | No | N/A | - |
| GET | /api/cases/:caseId/documents | Yes | Yes | Yes | listDocuments |
| POST | /api/cases/:caseId/documents | Yes | Yes | Yes | createDocument |
| GET | /api/documents/:docId | Yes | No* | Yes | getDocument |
| PATCH | /api/documents/:docId | Yes | No* | Yes | updateDocument |
| POST | /api/documents/:docId/duplicate | Yes | No* | Yes | duplicateDocument |
| DELETE | /api/documents/:docId | Yes | No* | Yes | deleteDocument |
| GET | /api/documents/:docId/export/docx | Yes | No* | Yes | getDocument |
| POST | /api/templates/docx | Yes | No | N/A | - |
| GET | /api/cases/:caseId/generated-documents | Yes | Yes | Yes | listGeneratedDocuments |
| POST | /api/cases/:caseId/documents/generate | Yes | Yes | Yes | createGeneratedDocument |
| GET | /api/generated-documents/:docId | Yes | No* | Yes | getGeneratedDocument |
| GET | /api/cases/:caseId/children | Yes | Yes | Yes | listCaseChildren |
| POST | /api/cases/:caseId/children | Yes | Yes | Yes | createCaseChild |
| PATCH | /api/children/:childId | Yes | No* | Yes | updateCaseChild |
| DELETE | /api/children/:childId | Yes | No* | Yes | deleteCaseChild |
| GET | /api/cases/:caseId/tasks | Yes | Yes | Yes | listTasks |
| POST | /api/cases/:caseId/tasks | Yes | Yes | Yes | createTask |
| PATCH | /api/tasks/:taskId | Yes | No* | Yes | updateTask |
| DELETE | /api/tasks/:taskId | Yes | No* | Yes | deleteTask |
| GET | /api/cases/:caseId/deadlines | Yes | Yes | Yes | listDeadlines |
| POST | /api/cases/:caseId/deadlines | Yes | Yes | Yes | createDeadline |
| PATCH | /api/deadlines/:deadlineId | Yes | No* | Yes | updateDeadline |
| DELETE | /api/deadlines/:deadlineId | Yes | No* | Yes | deleteDeadline |
| GET | /api/cases/:caseId/calendar | Yes | Yes | Yes | (aggregates tasks/deadlines/items) |
| GET | /api/cases/:caseId/calendar/categories | Yes | Yes | Yes | listCalendarCategories |
| POST | /api/cases/:caseId/calendar/categories | Yes | Yes | Yes | createCalendarCategory |
| GET | /api/cases/:caseId/calendar/items | Yes | Yes | Yes | listCaseCalendarItems |
| POST | /api/cases/:caseId/calendar/items | Yes | Yes | Yes | createCaseCalendarItem |
| PATCH | /api/calendar/items/:itemId | Yes | No* | Yes | updateCaseCalendarItem |
| DELETE | /api/calendar/items/:itemId | Yes | No* | Yes | deleteCaseCalendarItem |
| GET | /api/cases/:caseId/dashboard/calendar | Yes | Yes | Yes | (aggregates) |
| GET | /api/onboarding/status | Yes | No | Yes | getUserProfile |
| GET | /api/onboarding/policies | Yes | No | Yes | getUserProfile |
| POST | /api/onboarding/complete | Yes | No | Yes | upsertUserProfile |
| GET | /api/cases/:caseId/contacts | Yes | Yes | Yes | listContacts |
| POST | /api/cases/:caseId/contacts | Yes | Yes | Yes | createContact |
| PATCH | /api/contacts/:contactId | Yes | No* | Yes | updateContact |
| DELETE | /api/contacts/:contactId | Yes | No* | Yes | deleteContact |
| GET | /api/cases/:caseId/communications | Yes | Yes | Yes | listCommunications |
| POST | /api/cases/:caseId/communications | Yes | Yes | Yes | createCommunication |
| PATCH | /api/communications/:commId | Yes | No* | Yes | updateCommunication |
| DELETE | /api/communications/:commId | Yes | No* | Yes | deleteCommunication |
| POST | /api/communications/:commId/push-to-timeline | Yes | No* | Yes | createTimelineEvent |
| POST | /api/communications/:commId/push-to-calendar | Yes | No* | Yes | createCaseCalendarItem |
| POST | /api/communications/:commId/mark-resolved | Yes | No* | Yes | updateCommunication |
| GET | /api/cases/:caseId/exhibit-lists | Yes | Yes | Yes | listExhibitLists |
| POST | /api/cases/:caseId/exhibit-lists | Yes | Yes | Yes | createExhibitList |
| PATCH | /api/exhibit-lists/:listId | Yes | No* | Yes | updateExhibitList |
| DELETE | /api/exhibit-lists/:listId | Yes | No* | Yes | deleteExhibitList |
| GET | /api/exhibit-lists/:listId/exhibits | Yes | No* | Yes | listExhibits |
| POST | /api/exhibit-lists/:listId/exhibits | Yes | No* | Yes | createExhibit |
| PATCH | /api/exhibits/:exhibitId | Yes | No* | Yes | updateExhibit |
| DELETE | /api/exhibits/:exhibitId | Yes | No* | Yes | deleteExhibit |
| POST | /api/exhibit-lists/:listId/exhibits/reorder | Yes | No* | Yes | reorderExhibits |
| GET | /api/exhibits/:exhibitId/evidence | Yes | No* | Yes | listExhibitEvidence |
| POST | /api/exhibits/:exhibitId/evidence/attach | Yes | No* | Yes | attachEvidence |
| POST | /api/exhibits/:exhibitId/evidence/detach | Yes | No* | Yes | detachEvidence |
| POST | /api/evidence/:evidenceId/add-to-exhibit | Yes | No* | Yes | attachEvidence |
| GET | /api/evidence/:evidenceId/exhibits | Yes | No* | Yes | (query) |
| GET | /api/lexi/health | Yes | No | N/A | - |
| GET | /api/lexi/disclaimer | Yes | No | N/A | - |
| GET | /api/cases/:caseId/lexi/threads | Yes | Yes | Yes | listLexiThreads |
| POST | /api/cases/:caseId/lexi/threads | Yes | Yes | Yes | createLexiThread |
| PATCH | /api/lexi/threads/:threadId | Yes | No* | Yes | renameLexiThread |
| DELETE | /api/lexi/threads/:threadId | Yes | No* | Yes | deleteLexiThread |
| GET | /api/lexi/threads/:threadId/messages | Yes | No* | Yes | listLexiMessages |
| POST | /api/lexi/chat | Yes | No | Yes | createLexiMessage |

*No* = caseId not in URL, but ownership enforced via userId in storage layer

### 8. Health/Diagnostic Endpoints

| Path | Verifies |
|------|----------|
| /api/health | Server alive |
| /api/health/db | PostgreSQL connection |
| /api/health/session | Session cookie status |
| /api/health/timeline | Timeline table exists |
| /api/health/evidence | Evidence table exists |
| /api/health/documents | Documents table exists |
| /api/health/docx | DOCX export capability |
| /api/lexi/health | Lexi availability + OpenAI status |

---

## E) FRONTEND ROUTE INVENTORY

### 9. All Frontend Routes

| Path | Auth | Has :caseId | API Dependencies |
|------|------|-------------|-----------------|
| / | Public | No | - |
| /how-civilla-works | Public | No | - |
| /meet-the-founders | Public | No | - |
| /our-mission | Public | No | - |
| /plans | Public | No | - |
| /legal-compliance | Public | No | - |
| /privacy-policy | Public | No | - |
| /safety-support | Public | No | - |
| /accessibility | Public | No | - |
| /contact | Public | No | - |
| /terms | Public | No | - |
| /login | Public | No | /api/auth/login |
| /register | Public | No | /api/auth/register |
| /admin-login | Public | No | - |
| /careers | Public | No | - |
| /wall-of-wins | Public | No | - |
| /faq | Public | No | - |
| /app/onboarding | Auth | No | /api/onboarding/* |
| /app/account | Auth | No | /api/profile |
| /app/cases | Auth | No | /api/cases |
| /app/dashboard/:caseId | Auth | Yes | /api/cases/:caseId/*, /api/cases/:caseId/dashboard/* |
| /app/case/:caseId | Auth | Yes | /api/cases/:caseId |
| /app/case-settings/:caseId | Auth | Yes | /api/cases/:caseId |
| /app/documents/:caseId | Auth | Yes | /api/cases/:caseId/documents |
| /app/timeline/:caseId | Auth | Yes | /api/cases/:caseId/timeline |
| /app/evidence/:caseId | Auth | Yes | /api/cases/:caseId/evidence |
| /app/exhibits/:caseId | Auth | Yes | /api/cases/:caseId/exhibit-lists |
| /app/tasks/:caseId | Auth | Yes | /api/cases/:caseId/tasks |
| /app/deadlines/:caseId | Auth | Yes | /api/cases/:caseId/deadlines |
| /app/patterns/:caseId | Auth | Yes | /api/cases/:caseId/communications |
| /app/contacts/:caseId | Auth | Yes | /api/cases/:caseId/contacts |
| /app/communications/:caseId | Auth | Yes | /api/cases/:caseId/communications |
| /app/child-support/:caseId | Auth | Yes | /api/cases/:caseId/children |
| /app/children/:caseId | Auth | Yes | /api/cases/:caseId/children |
| /app/library/:caseId | Auth | Yes | /api/cases/:caseId/generated-documents |

### 10. Route Issues

Routes without :caseId that should have it: **None identified** - all case-scoped routes properly include :caseId.

Routes using CaseRedirect (localStorage fallback):
- /app/dashboard, /app/case, /app/documents, /app/timeline, /app/evidence, /app/exhibits, /app/tasks, /app/deadlines, /app/patterns, /app/messages, /app/contacts, /app/communications, /app/child-support, /app/children, /app/library, /app

These redirect to the case-scoped version using last-used caseId from localStorage.

---

## F) MODULE-BY-MODULE STATUS REPORT

### 11. Module Status

**Module: Auth**
- DB schema exists: yes (users, auth_identities, auth_magic_links)
- Storage functions exist: yes
- API routes exist: yes (/api/auth/*)
- UI route exists: yes (/login, /register)
- Ownership enforced: yes

**Module: Cases**
- DB schema exists: yes (cases)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/*)
- UI route exists: yes (/app/cases, /app/case/:caseId)
- Ownership enforced: yes

**Module: Timeline**
- DB schema exists: yes (timeline_events)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/timeline, /api/timeline/*)
- UI route exists: yes (/app/timeline/:caseId)
- Ownership enforced: yes

**Module: Evidence**
- DB schema exists: yes (evidence_files)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/evidence, /api/evidence/*)
- UI route exists: yes (/app/evidence/:caseId)
- Ownership enforced: yes

**Module: Exhibits**
- DB schema exists: yes (exhibit_lists, exhibits, exhibit_evidence)
- Storage functions exist: yes
- API routes exist: yes (/api/exhibit-lists/*, /api/exhibits/*)
- UI route exists: yes (/app/exhibits/:caseId)
- Ownership enforced: yes

**Module: Documents**
- DB schema exists: yes (documents, generated_documents)
- Storage functions exist: yes
- API routes exist: yes (/api/documents/*, /api/cases/:caseId/documents/generate)
- UI route exists: yes (/app/documents/:caseId, /app/library/:caseId)
- Ownership enforced: yes

**Module: Tasks**
- DB schema exists: yes (tasks)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/tasks, /api/tasks/*)
- UI route exists: yes (/app/tasks/:caseId)
- Ownership enforced: yes

**Module: Deadlines**
- DB schema exists: yes (deadlines)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/deadlines, /api/deadlines/*)
- UI route exists: yes (/app/deadlines/:caseId)
- Ownership enforced: yes

**Module: Calendar aggregation**
- DB schema exists: yes (calendar_categories, case_calendar_items)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/calendar/*)
- UI route exists: yes (integrated into dashboard)
- Ownership enforced: yes

**Module: Contacts**
- DB schema exists: yes (case_contacts)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/contacts, /api/contacts/*)
- UI route exists: yes (/app/contacts/:caseId)
- Ownership enforced: yes

**Module: Communications log**
- DB schema exists: yes (case_communications)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/communications, /api/communications/*)
- UI route exists: yes (/app/communications/:caseId)
- Ownership enforced: yes

**Module: Children**
- DB schema exists: yes (case_children)
- Storage functions exist: yes
- API routes exist: yes (/api/cases/:caseId/children, /api/children/*)
- UI route exists: yes (/app/children/:caseId, /app/child-support/:caseId)
- Ownership enforced: yes

**Module: Pattern analysis**
- DB schema exists: no (uses communications data)
- Storage functions exist: partial (reads communications)
- API routes exist: no (dedicated patterns endpoint)
- UI route exists: yes (/app/patterns/:caseId)
- Ownership enforced: yes (via communications)

**Module: Billing / entitlements**
- DB schema exists: partial (cases_allowed in users)
- Storage functions exist: no
- API routes exist: no
- UI route exists: no
- Ownership enforced: N/A

**Module: Lexi (AI)**
- DB schema exists: yes (lexi_threads, lexi_messages)
- Storage functions exist: yes
- API routes exist: yes (/api/lexi/*, /api/cases/:caseId/lexi/*)
- UI route exists: yes (LexiPanel component, floating)
- Ownership enforced: yes

---

## G) LEXI (AI) SPECIFIC AUDIT

### 12. Lexi Backend Components

| Component | Location |
|-----------|----------|
| Request handler | server/routes.ts (lines 2847-3070) |
| OpenAI client init | server/routes.ts (line 2844) |
| Threads table | lexi_threads (schema + db.ts) |
| Messages table | lexi_messages (schema + db.ts) |
| Health endpoint | GET /api/lexi/health |
| System prompt | server/lexi/systemPrompt.ts |
| Safety templates | server/lexi/safetyTemplates.ts |
| Policy (intent/disallowed) | server/lexi/policy.ts |
| Disclaimer formatting | server/lexi/format.ts |
| Source extraction | server/lexi/sources.ts |
| Domain-allowlisted fetch | server/lexi/fetch.ts |

### 13. Lexi Frontend Components

| Component | Location |
|-----------|----------|
| Panel | client/src/components/lexi/LexiPanel.tsx |
| Thread UI | Yes (thread list, selection, create, delete) |
| Case-scoping | Yes (extracts caseId from URL) |
| Mode indicator badges | Yes (research/organize/educate) |
| Source link formatting | Yes (markdown links parsed) |

### 14. Guardrails Enforced in Code

| Guardrail | Location | Enforced |
|-----------|----------|----------|
| UPL refusal (detectUPLRequest) | server/lexi/safetyTemplates.ts | Yes |
| Disallowed patterns (isDisallowed) | server/lexi/policy.ts | Yes |
| Intent classification | server/lexi/policy.ts | Yes |
| Per-thread soft disclaimer | server/lexi/format.ts | Yes |
| Moderation blocking | server/lexi/safetyTemplates.ts (shouldBlockMessage) | Yes |
| Self-harm response | server/lexi/safetyTemplates.ts | Yes |
| Citation requirements | server/lexi/policy.ts (system prompt) | Yes (in prompt) |
| Read-only enforcement | N/A | N/A (Lexi doesn't modify data) |
| Rate limiting | Not implemented | No |
| Metadata logging | server/routes.ts | Yes (intent, refused, hadSources) |

---

## H) PRODUCTION VERIFICATION STATUS

### 15. Features Verified on civilla.ai

| Feature | Tested in Production | Persists After Refresh |
|---------|---------------------|----------------------|
| User registration | Unknown | Unknown |
| User login | Unknown | Unknown |
| Case creation | Unknown | Unknown |
| Timeline CRUD | Unknown | Unknown |
| Evidence upload | Unknown | Unknown |
| Document builder | Unknown | Unknown |
| DOCX export | Unknown | Unknown |
| Tasks/Deadlines | Unknown | Unknown |
| Communications | Unknown | Unknown |
| Contacts | Unknown | Unknown |
| Exhibits | Unknown | Unknown |
| Children | Unknown | Unknown |
| Lexi chat | Unknown | Unknown |
| Onboarding wizard | Unknown | Unknown |

*Note: Production verification status requires manual testing on civilla.ai*

### 16. Known Production Issues

Unable to verify without production access. No issues reported in codebase comments.

---

## I) SUMMARY

### 17. Top 5 Areas Fully Built and Production-Ready

1. **Case Management** - Complete CRUD, ownership, multi-case support
2. **Timeline Events** - Full CRUD with categories, indexing, ownership
3. **Evidence Files** - Upload, download, metadata, R2 storage integration
4. **Document Builder** - Templates, DOCX export, freeform editing
5. **Tasks & Deadlines** - Full CRUD, status tracking, priority, due dates

### Top 5 Areas Built But Need Production Verification

1. **Lexi AI Assistant** - Full implementation with policy guardrails, needs real-world testing
2. **Exhibits Module** - Complete with evidence linking, needs workflow validation
3. **Communications Log** - Full CRUD with push-to-timeline/calendar, needs UX testing
4. **Onboarding Wizard** - Complete flow, needs user testing
5. **Calendar Aggregation** - Aggregates tasks/deadlines/items, needs visual verification

### Top 5 Missing or Partially Wired Components

1. **Billing / Entitlements** - Only `cases_allowed` field exists, no payment integration
2. **Pattern Analysis** - UI route exists but no dedicated backend analysis
3. **Rate Limiting for Lexi** - Not implemented
4. **Magic Link Auth** - Schema exists, not wired
5. **Email Notifications** - SMTP config exists, no notification triggers wired

---

**END OF AUDIT**
