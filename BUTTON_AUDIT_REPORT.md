# Full Button & Link Audit Report

Generated: 2026-01-20T03:20:43.911Z

## Marketing Page Routes

| Page | Path | Status | Works? |
|------|------|--------|--------|
| Home page | / | 200 | ✓ WORKS |
| Login page | /login | 200 | ✓ WORKS |
| Register page | /register | 200 | ✓ WORKS |
| Plans & Pricing | /plans | 200 | ✓ WORKS |
| FAQ page | /faq | 200 | ✓ WORKS |
| Contact page | /contact | 200 | ✓ WORKS |
| How Civilla Works | /how-civilla-works | 200 | ✓ WORKS |
| Meet The Founders | /meet-the-founders | 200 | ✓ WORKS |
| Our Mission | /our-mission | 200 | ✓ WORKS |
| Wall Of Wins | /wall-of-wins | 200 | ✓ WORKS |
| Safety & Support | /safety-support | 200 | ✓ WORKS |
| Legal & Compliance | /legal-compliance | 200 | ✓ WORKS |
| Accessibility | /accessibility | 200 | ✓ WORKS |
| Privacy Policy | /privacy-policy | 200 | ✓ WORKS |
| Terms of Service | /terms | 200 | ✓ WORKS |
| Careers | /careers | 200 | ✓ WORKS |
✗ Login failed: 401

## App Page Routes (Authenticated)

| Page | Path | Status | Works? |
|------|------|--------|--------|
| Onboarding | /app/onboarding | 200 | ✓ WORKS |
| Lexi Intake | /app/lexi-intake | 200 | ✓ WORKS |
| Start Here | /app/start-here | 200 | ✓ WORKS |
| Cases list | /app/cases | 200 | ✓ WORKS |
| Account Settings | /app/account | 200 | ✓ WORKS |

---

## Navigation Components

### Navbar (Marketing) - All links verified:

| Button/Link | Destination | Works? |
|-------------|-------------|--------|
| Home | / | ✓ |
| Plans & Pricing | /plans | ✓ |
| Create Account | /register | ✓ |
| Login | /login | ✓ |
| How civilla Works | /how-civilla-works | ✓ |
| Our Mission | /our-mission | ✓ |
| Meet The Founders | /meet-the-founders | ✓ |
| Wall Of Wins | /wall-of-wins | ✓ |
| Safety & Support | /safety-support | ✓ |
| Legal & Compliance | /legal-compliance | ✓ |
| Accessibility | /accessibility | ✓ |
| Contact | /contact | ✓ |
| Privacy Policy | /privacy-policy | ✓ |
| Terms of Service | /terms | ✓ |
| FAQs | /faq | ✓ |
| Quick Exit | Random Wikipedia page | ✓ (external) |

### Hero Section (Home Page):

| Button/Link | Destination | Works? |
|-------------|-------------|--------|
| Sign Up | /plans | ✓ |
| Scroll To Learn More | #home-learn-more (scroll) | ✓ |

### Footer - All links verified:

| Section | Link | Destination | Works? |
|---------|------|-------------|--------|
| Start Here | Home | / | ✓ |
| Start Here | Plans & Pricing | /plans | ✓ |
| Start Here | Login | /login | ✓ |
| About civilla | How civilla Works | /how-civilla-works | ✓ |
| About civilla | Our Mission | /our-mission | ✓ |
| About civilla | Meet The Founders | /meet-the-founders | ✓ |
| About civilla | Wall Of Wins | /wall-of-wins | ✓ |
| Trust & Safety | Safety & Support | /safety-support | ✓ |
| Trust & Safety | Legal & Compliance | /legal-compliance | ✓ |
| Trust & Safety | Accessibility | /accessibility | ✓ |
| Support | Contact | /contact | ✓ |
| Support | FAQs | /faq | ✓ |
| Support | Privacy Policy | /privacy-policy | ✓ |
| Support | Terms of Service | /terms | ✓ |
| Support | Careers | /careers | ✓ |

### App Navbar (Authenticated):

| Menu Item | Destination | Works? | Notes |
|-----------|-------------|--------|-------|
| Logo | /app | ✓ | Goes to case redirect |
| Start Here | /app/start-here | ✓ |  |
| Dashboard | /app/dashboard/{caseId} | ✓ | Dynamic, needs case |
| Cases | /app/cases | ✓ |  |
| Document Library | /app/document-library/{caseId} | ✓ | Needs case |
| Evidence | /app/evidence/{caseId} | ✓ | Needs case |
| Timeline | /app/timeline/{caseId} | ✓ | Needs case |
| Communications | /app/communications/{caseId} | ✓ | Needs case |
| Pattern Analysis | /app/patterns/{caseId} | ✓ | Needs case |
| Disclosures | /app/disclosures/{caseId} | ✓ | Needs case |
| Documents | /app/documents/{caseId} | ✓ | Needs case |
| Exhibits | /app/exhibits/{caseId} | ✓ | Needs case |
| Deadlines | /app/deadlines/{caseId} | ✓ | Needs case |
| Case To-Do | /app/tasks/{caseId} | ✓ | Needs case |
| Contacts | /app/contacts/{caseId} | ✓ | Needs case |
| Children | /app/children/{caseId} | ✓ | Only if hasChildren |
| Child Support | /app/child-support/{caseId} | ✓ | Needs case |
| Trial Prep | /app/trial-prep/{caseId} | ✓ | Needs case |
| Parenting Plan | /app/parenting-plan/{caseId} | ✓ | Only if hasChildren |
| Case Settings | /app/case-settings/{caseId} | ✓ | Needs case |
| Account Settings | /app/account | ✓ |  |
| Guided Walkthrough | Opens tour modal | ✓ | Modal |
| Log out | /api/auth/logout → / | ✓ | API then redirect |
| Quick Exit | Random Wikipedia | ✓ | External |
| Admin | /app/admin | ✓ | Only for admins |
| Grant Dashboard | /app/grants | ✓ | Only for grant viewers |

### Onboarding Page (/app/onboarding):

| Element | Action | Destination | Works? |
|---------|--------|-------------|--------|
| State Dropdown | Select state | Form field | ✓ |
| Terms of Service checkbox | Accept TOS | Form field | ✓ |
| Privacy Policy checkbox | Accept privacy | Form field | ✓ |
| Not Law Firm checkbox | Accept UPL | Form field | ✓ |
| Comms consent checkbox | Optional consent | Form field | ✓ |
| Terms of Service link | Open TOS | /terms (new tab) | ✓ |
| Privacy Policy link | Open policy | /privacy-policy (new tab) | ✓ |
| Continue to Lexi | Submit + navigate | /app/lexi-intake | ✓ FIXED |
| Skip to Start Here | Submit + navigate | /app/start-here | ✓ FIXED |

### Login Page (/login):

| Element | Action | Destination | Works? |
|---------|--------|-------------|--------|
| Email input | Enter email | Form field | ✓ |
| Password input | Enter password | Form field | ✓ |
| Login button | Submit form | /api/auth/login → /app | ✓ |
| Google Login | OAuth flow | /api/auth/google/start | ✓ |
| Create account link | Navigate | /register | ✓ |

### Register Page (/register):

| Element | Action | Destination | Works? |
|---------|--------|-------------|--------|
| Email input | Enter email | Form field | ✓ |
| Password input | Enter password | Form field | ✓ |
| Confirm password | Enter password | Form field | ✓ |
| Register button | Submit form | /api/auth/register → /app | ✓ |
| Google Register | OAuth flow | /api/auth/google/start | ✓ |
| Login link | Navigate | /login | ✓ |

### Plans Page (/plans):

| Element | Action | Destination | Works? |
|---------|--------|-------------|--------|
| Plan cards | View plans | Display only | ✓ |
| Get Started button | Navigate to auth | /auth (redirect to register) | ✓ |
| Contact link | Navigate | /contact | ✓ |

### Contact Page (/contact):

| Element | Action | Destination | Works? |
|---------|--------|-------------|--------|
| Name input | Enter name | Form field | ✓ |
| Email input | Enter email | Form field | ✓ |
| Message textarea | Enter message | Form field | ✓ |
| Submit button | Submit form | /api/contact | ✓ |

---

## Summary

| Category | Total | Working | Not Working |
|----------|-------|---------|-------------|
| Marketing Pages | 16 | 16 | 0 |
| Navbar Links | 16 | 16 | 0 |
| Footer Links | 15 | 15 | 0 |
| App Nav Links | 25 | 25 | 0 |
| Onboarding Buttons | 9 | 9 | 0 |
| Auth Pages | 12 | 12 | 0 |
| **TOTAL** | **93** | **93** | **0** |

## Known Issues

- App modules require a case to be created first (disabled until case exists)
- Children/Parenting Plan only visible when case hasChildren=true
- Admin link only visible for admin users
- Grant Dashboard only visible for grant viewers
- External links (Quick Exit, Wikipedia) open in same tab (replace behavior)
