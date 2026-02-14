# Contributing to Civilla.AI

Thank you for your interest in contributing to Civilla.AI! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git
- OpenAI API key (for AI features)

### Setup

1. Fork the repository
2. Clone your fork:
```bash
   git clone https://github.com/YOUR_USERNAME/civilla.ai.git
   cd civilla.ai
```

3. Install dependencies:
```bash
   npm install
```

4. Copy `.env.example` to `.env` and fill in your values:
```bash
   cp .env.example .env
```

5. Initialize the database:
```bash
   npm run db:push
```

6. Start the development server:
```bash
   npm run dev
```

7. Run tests:
```bash
   npm test
```

## Development Workflow

### Branch Naming
- Feature: `feature/description`
- Bug fix: `fix/description`
- Documentation: `docs/description`
- Refactor: `refactor/description`

Example: `feature/add-calendar-view`

### Making Changes

1. Create a new branch:
```bash
   git checkout -b feature/your-feature
```

2. Make your changes following our code style

3. Write tests for new features

4. Run tests and type checking:
```bash
   npm test
   npm run check
```

5. Commit with a clear message:
```bash
   git commit -m "Add: calendar view for case deadlines"
```

6. Push to your fork:
```bash
   git push origin feature/your-feature
```

7. Open a Pull Request

## Code Style

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` types - use proper typing
- Use descriptive variable names

### File Organization
```
server/
  routes/          # Route handlers organized by feature
  services/        # Business logic
  middleware/      # Express middleware
  utils/           # Helper functions
  config.ts        # Configuration management
  logger.ts        # Logging setup
```

### Naming Conventions
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions: `camelCase()`
- Constants: `UPPER_SNAKE_CASE`
- Database tables: `snake_case`

### Error Handling
- Always use asyncHandler for async routes
- Log errors with proper context
- Return user-friendly error messages
- Don't expose internal errors in production

Example:
```typescript
authRouter.post('/login', asyncHandler(async (req, res) => {
  // Your code here
}));
```

### Validation
- Use Zod schemas for all input validation
- Validate at route level using validation middleware
- Return clear validation errors

Example:
```typescript
import { validateBody } from '../middleware/validate';

router.post('/cases', 
  requireAuth, 
  validateBody(insertCaseSchema),
  asyncHandler(async (req, res) => {
    // req.body is now validated and typed
  })
);
```

## Testing

### Writing Tests
- Write tests for all new features
- Use descriptive test names
- Test both success and failure cases
- Mock external services (OpenAI, Stripe, etc.)

Example:
```typescript
describe('POST /api/cases', () => {
  it('should create a new case for authenticated user', async () => {
    const res = await request(app)
      .post('/api/cases')
      .set('Cookie', authCookie)
      .send({ title: 'Test Case' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
```

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Database Changes

### Migrations
1. Update schema in `shared/schema.ts`
2. Run database push:
```bash
   npm run db:push
```
3. Test changes locally
4. Document schema changes in PR

### Schema Guidelines
- Use descriptive table and column names
- Add indexes for frequently queried columns
- Use proper foreign keys and constraints
- Document complex schemas

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add calendar view for case deadlines
fix: resolve memory leak in logging middleware
docs: update README with deployment instructions
refactor: split routes into feature modules
```

## Pull Request Process

1. **Fill out the PR template** with:
   - Description of changes
   - Related issue numbers
   - Testing performed
   - Screenshots (if UI changes)

2. **Ensure all checks pass**:
   - Tests passing
   - TypeScript compiling
   - No linting errors

3. **Request review** from maintainers

4. **Address feedback** and push updates

5. **Squash commits** if requested

6. **Merge** once approved

## Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Report security vulnerabilities privately
- See [SECURITY.md](SECURITY.md) for details

## Questions?

- Open a GitHub Discussion
- Email: support@civilla.ai
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Civilla.AI! 🎉