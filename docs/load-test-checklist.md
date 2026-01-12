# Load Test Checklist & Verification Guide

## Pre-Deployment Verification Checklist

### 1. AI Infrastructure Health

- [ ] **Feature Flags**: All AI features enabled in `GET /api/admin/ai-status`
- [ ] **Rate Limits**: Soft limits configured (never block users)
- [ ] **Budget Tracking**: Per-user daily limits set ($5 default)
- [ ] **Alerts**: Slack webhook configured (optional)

```bash
# Check AI status
curl -H "Cookie: ..." https://yourapp.replit.app/api/admin/ai-status | jq
```

### 2. Database Health

- [ ] Connection pool configured (default: 10 connections)
- [ ] All migrations applied (`npm run db:push`)
- [ ] Indexes present on frequently queried columns
- [ ] Subscription fields added to user_profiles

```bash
# Verify subscription columns
curl -H "Cookie: ..." https://yourapp.replit.app/api/admin/diagnostics | jq '.counts'
```

### 3. External Services

- [ ] **OpenAI**: API key valid, rate limits understood
- [ ] **Google Vision OCR**: Credentials configured
- [ ] **R2 Storage**: Bucket configured, CORS set
- [ ] **Stripe**: Test mode keys set (9 price IDs)
- [ ] **Turnstile**: Optional - bypassed when not configured

### 4. Entitlements

- [ ] Lifetime premium allowlist: 4 emails
- [ ] Admin allowlist: 3 emails
- [ ] Grant viewer allowlist: 1 email

```bash
# View entitlements
curl -H "Cookie: ..." https://yourapp.replit.app/api/admin/entitlements | jq
```

---

## Simulated Load Testing Scenarios

### Scenario 1: Concurrent User Registration

**Expected**: 50 concurrent registrations complete without errors

```
Test:
1. Create 50 test accounts via /api/auth/register
2. Verify all receive session cookies
3. Check no duplicate emails created
4. Confirm entitlements applied where applicable
```

**Pass Criteria**:
- 100% success rate
- <3s average response time
- No database deadlocks

### Scenario 2: Bulk Evidence Upload

**Expected**: 10 users each uploading 20 files simultaneously

```
Test:
1. Login as 10 different users
2. Each uploads 20 PDF files (1-5MB each)
3. Verify all files stored in R2
4. Check OCR jobs queued (not blocking)
```

**Pass Criteria**:
- All files uploaded successfully
- <5s per file average
- OCR queue depth visible in admin
- Turnstile challenge shown for >5 files (if configured)

### Scenario 3: AI Analysis Storm

**Expected**: 20 concurrent AI analysis requests complete

```
Test:
1. Trigger analysis on 20 different evidence files
2. Monitor queue depth in admin panel
3. Verify soft rate limits queue (not reject)
4. Check budget tracking increments
```

**Pass Criteria**:
- All requests eventually complete
- Queued requests show "processing" message
- No users see "limit exceeded" errors
- Cost tracked in /api/admin/ai-status

### Scenario 4: Lexi Chat Concurrency

**Expected**: 100 concurrent Lexi messages stream successfully

```
Test:
1. Open 100 Lexi chat sessions
2. Send messages simultaneously
3. Verify streaming responses complete
4. Check for proper disclaimers
```

**Pass Criteria**:
- 95%+ messages receive complete responses
- Streaming works without interruption
- Safety filters active
- No timeout errors

### Scenario 5: Document Generation Burst

**Expected**: 10 users compile documents simultaneously

```
Test:
1. 10 users each with 50+ claims
2. Trigger document compilation
3. Monitor compile queue
4. Verify DOCX generation
```

**Pass Criteria**:
- All documents generated
- <30s per document
- Proper formatting preserved
- No memory exhaustion

---

## Monitoring During Load

### Key Metrics to Watch

| Metric | Warning | Critical |
|--------|---------|----------|
| Response time p95 | >2s | >5s |
| Error rate | >1% | >5% |
| Active AI jobs | >20 | >50 |
| OCR queue depth | >100 | >500 |
| Memory usage | >70% | >90% |
| DB connections | >8 | =10 |

### Admin Endpoints for Monitoring

```bash
# System health
GET /api/admin/system-health

# AI infrastructure status
GET /api/admin/ai-status

# Recent failures
GET /api/admin/diagnostics

# Smoke tests
GET /api/admin/smoke
```

---

## Post-Load Verification

### 1. Data Integrity

- [ ] No orphaned records in database
- [ ] All uploaded files accessible in R2
- [ ] Extraction statuses reflect actual state
- [ ] No duplicate processing jobs

### 2. User Experience

- [ ] Login/logout working
- [ ] Session persistence correct
- [ ] No stale data displayed
- [ ] Error messages user-friendly

### 3. Cost Tracking

- [ ] Per-user budgets accurate
- [ ] No unexpected spikes
- [ ] Alerts triggered appropriately (if configured)

---

## Recovery Procedures

### If AI Service Fails

1. Check `/api/admin/ai-status` for failure details
2. Toggle feature flag: `POST /api/admin/feature-flag { feature: "lexi_chat", enabled: false }`
3. Investigate OpenAI/Vision logs
4. Re-enable when resolved

### If Database Overloaded

1. Check connection pool exhaustion
2. Identify long-running queries
3. Consider increasing pool size
4. Kill stuck transactions if needed

### If R2 Storage Fails

1. Check bucket accessibility
2. Verify credentials not expired
3. Check CORS configuration
4. Retry failed uploads

---

## Environment Variables Required

```env
# Database
DATABASE_URL=postgresql://...

# AI Services
OPENAI_API_KEY=sk-...
GOOGLE_CLOUD_VISION_API_KEY=...

# Storage
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...

# Payments (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_CORE_MONTHLY=price_...
STRIPE_PRICE_CORE_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...

# Optional
TURNSTILE_SECRET_KEY=...
TURNSTILE_SITE_KEY=...
SLACK_WEBHOOK_URL=...
```

---

## Sign-Off

**Verified By**: ________________
**Date**: ________________
**Environment**: [ ] Development [ ] Staging [ ] Production
**Load Level**: ________________ concurrent users
**Duration**: ________________ minutes
**Result**: [ ] PASS [ ] FAIL

**Notes**:
```
_________________________________
_________________________________
_________________________________
```
