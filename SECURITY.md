# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Civilla.AI, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: security@civilla.ai
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within 48 hours and work with you to address the issue.

## Security Measures

Civilla.AI implements the following security measures:

### Authentication & Authorization
- ✅ Session-based authentication with secure cookies
- ✅ Password hashing using bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Session secret validation on startup

### Network Security
- ✅ HTTPS redirect in production
- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ CORS configuration with domain whitelisting
- ✅ Helmet.js security headers
- ✅ Request timeout handling (30s)
- ✅ Payload size limits (10MB)

### Data Protection
- ✅ SQL injection protection via Drizzle ORM
- ✅ Input validation using Zod schemas
- ✅ XSS protection via React and sanitization
- ✅ Stripe webhook signature verification
- ✅ Stripe webhook IP whitelisting

### Monitoring & Logging
- ✅ Structured logging with Winston
- ✅ Error sanitization in production
- ✅ Health check endpoint
- ✅ Request/response logging with size limits

### API Security
- ✅ Environment variable validation
- ✅ Secrets stored in environment (never in code)
- ✅ API key rotation recommended quarterly
- ✅ Database connection pooling with limits

## Security Best Practices for Developers

### Environment Variables
- Never commit `.env` files
- Use `.env.example` as template
- Rotate secrets regularly
- Use strong, random SESSION_SECRET (min 32 chars)

### API Keys
- Keep API keys in Replit Secrets or environment variables
- Never log API keys
- Use different keys for dev/staging/production
- Rotate compromised keys immediately

### Dependencies
- Run `npm audit` regularly
- Keep dependencies up to date
- Review security advisories
- Use `npm audit fix` to patch vulnerabilities

### Code Reviews
- Review all code changes
- Test security features
- Validate input/output sanitization
- Check for SQL injection risks

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledge receipt and begin investigation
3. **Day 3-7**: Develop and test fix
4. **Day 8-14**: Deploy fix to production
5. **Day 15**: Public disclosure (if appropriate)

## Security Checklist for Production

- [ ] All environment variables set in Replit Secrets
- [ ] SESSION_SECRET is random and strong
- [ ] HTTPS enabled and enforced
- [ ] Rate limiting configured
- [ ] Database backups enabled
- [ ] Monitoring and alerts set up
- [ ] Error logging configured
- [ ] Latest security patches applied
- [ ] `npm audit` shows no high/critical issues
- [ ] CORS configured for production domains only

## Contact

For security concerns: security@civilla.ai  
For general support: support@civilla.ai

---

Last updated: February 2026