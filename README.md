# Civilla.AI - Legal Case Management Platform

A comprehensive legal case management system with AI-powered assistance, built for families navigating the legal system.

## Features

- 🤖 **Lexi AI Assistant** - Context-aware legal guidance powered by OpenAI
- 📁 **Case Management** - Track timelines, documents, evidence, and deadlines
- 📄 **Document Generation** - AI-assisted court document creation
- 🔍 **Evidence Processing** - OCR and automated extraction from uploaded files
- 💳 **Premium Features** - Stripe-powered subscription management
- 📊 **Admin Dashboard** - System health monitoring and user management

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React, TailwindCSS, Vite
- **AI**: OpenAI GPT-4
- **Storage**: AWS S3 (R2)
- **OCR**: Google Cloud Vision
- **Payments**: Stripe

## Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- (Optional) Stripe account for payments
- (Optional) AWS S3/R2 for file storage
- (Optional) Google Cloud Vision for OCR

## Environment Variables

Create a `.env` file or set these in Replit Secrets:

### Required
```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-random-secret-here
OPENAI_API_KEY=sk-...
```

### Optional
```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 / Cloudflare R2 (for file storage)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_ENDPOINT=...

# Google Cloud Vision (for OCR)
GOOGLE_CLOUD_VISION_KEY_FILE=/path/to/keyfile.json

# Replit (auto-configured in Replit)
REPLIT_DOMAINS=your-app.replit.app
```

## Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/paige-civilla/civilla.ai.git
cd civilla.ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (copy `.env.example` to `.env` and fill in values)

4. Initialize database:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

6. Open http://localhost:5000

### Replit Deployment

1. Import this repository into Replit
2. Configure Secrets (see Environment Variables above)
3. Click "Run"
4. App will be available at your Replit URL

## Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

## API Endpoints

### Health Check
```
GET /health
```
Returns system health status including database, AI, and storage checks.

### Authentication
```
POST /api/register   # Create new account
POST /api/login      # Login
POST /api/logout     # Logout
GET  /api/user       # Get current user
```

### Cases
```
GET    /api/cases           # List user's cases
POST   /api/cases           # Create new case
GET    /api/cases/:id       # Get case details
PATCH  /api/cases/:id       # Update case
DELETE /api/cases/:id       # Delete case
```

### Lexi AI Assistant
```
POST /api/lexi/threads      # Create chat thread
POST /api/lexi/chat         # Send message to Lexi
GET  /api/lexi/threads/:id  # Get thread history
```

See full API documentation at `/api-docs` (when Swagger is enabled)

## Security Features

- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Session-based authentication
- ✅ SQL injection protection (Drizzle ORM)
- ✅ Input validation (Zod schemas)
- ✅ Error sanitization in production
- ✅ Structured logging (Winston)

## Monitoring

- Health check endpoint: `/health`
- Logs stored in `logs/` directory
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`

## Architecture
```
civilla.ai/
├── server/              # Backend code
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── config.ts        # Configuration management
│   ├── logger.ts        # Logging setup
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication
│   ├── lexi/            # AI assistant logic
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   └── utils/           # Helper functions
├── client/              # Frontend code (React)
├── shared/              # Shared types/schemas
├── dist/                # Production build
└── logs/                # Log files
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m "Add feature"`
4. Push to your fork: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Open an issue on GitHub
- Email: support@civilla.ai
- Documentation: https://docs.civilla.ai

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced document templates
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Team collaboration features
- [ ] API webhooks

---

Built with ❤️ for families navigating the legal system.