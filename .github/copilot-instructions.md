# GitHub Copilot Project Instructions
## FinTrack API - Expense Splitting Feature

### 1. Technology Stack & Architecture

**Core Stack:**
- Language: TypeScript 5.x (strict mode enabled)
- Framework: Express.js 4.x
- Database: PostgreSQL 15+ with TypeORM 0.3.x
- Validation: Zod for runtime schema validation
- Testing: Jest + Supertest for unit and integration tests
- Logging: Pino for structured logging

**Architecture Pattern:**
- Layered architecture: Controller → Service → Repository → Model
- Each layer has single responsibility
- Dependency injection via constructor
- No direct database access outside repositories
- All external APIs wrapped in services

---

### 2. Coding Standards

**File Naming:**
- Models: PascalCase (e.g., `Transaction.ts`, `SharedExpense.ts`)
- Services: PascalCase with "Service" suffix (e.g., `TransactionService.ts`)
- Controllers: PascalCase with "Controller" suffix (e.g., `TransactionController.ts`)
- Repositories: PascalCase with "Repository" suffix (e.g., `TransactionRepository.ts`)
- Utilities: camelCase (e.g., `calculateNetBalance.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_PARTICIPANTS.ts`)

**Code Style:**
- Use async/await for all async operations (no callbacks or .then())
- Always use const for variables (never var)
- Use meaningful variable names (avoid single letters except loop indices)
- Maximum line length: 100 characters
- Use semicolons consistently
- Arrow functions preferred for callbacks
- Destructure objects and arrays where appropriate

**TypeScript Rules:**
- All public functions/methods must have explicit return types
- Use interfaces for contracts, types for aliases
- Avoid `any` type - use `unknown` when necessary with type guards
- Use discriminated unions for error handling
- Generics should have meaningful names (avoid single-letter type params)
- Enums for fixed sets of values (not magic strings)

**Comments & Documentation:**
- JSDoc for all public functions/classes/interfaces
- @param, @returns, @throws for completeness
- Inline comments only for "why", not "what"
- No commented-out code - delete or create an issue

---

### 3. Security & Fintech Standards

**Authentication & Authorization:**
- All protected endpoints require JWT verification
- Use sub claim for user ID from token
- Verify user ownership before accessing/modifying resources
- No hardcoded secrets - use environment variables
- API keys must be hashed before storage (bcrypt)

**Data Protection:**
- Sensitive fields (amounts, balances) require explicit authorization checks
- Implement request ID tracing for audit logs
- Log all financial transactions with:
  - Timestamp, user ID, action, amounts, status, error (if any)
  - Never log passwords or full credit card numbers
- Use HTTPS only (TLS 1.3+)

**Input Validation:**
- Validate all request inputs with Zod schemas
- Reject requests with invalid Content-Type
- Sanitize strings (trim, encode HTML entities if needed)
- Amounts must be positive decimals (2 decimal places max for currency)
- UUIDs for all IDs (never auto-increment exposed IDs)
- Request size limits (max 1MB JSON)

**Error Handling:**
- Never expose stack traces to clients
- Return specific error codes (not generic 500s)
- Log full errors internally; return sanitized messages to clients
- Implement rate limiting (100 requests/minute per user)
- Use standard HTTP status codes:
  - 400: Bad Request (validation error)
  - 401: Unauthorized (missing/invalid token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found
  - 409: Conflict (duplicate/constraint violation)
  - 422: Unprocessable Entity (semantic error)
  - 500: Internal Server Error (log full error)

---

### 4. Database & ORM Patterns

**TypeORM Requirements:**
- Use Column decorators with explicit types and constraints
- Always include created_at, updated_at timestamps (automatic via UpdateDateColumn)
- Soft deletes (deleted_at) for audit trail
- Foreign keys with proper cascading rules
- Indexes on frequently queried fields (user_id, created_at)

**Repository Pattern:**
- All DB queries in repositories only
- Methods return typed entities or null (never undefined)
- Handle not-found as null, let service decide if it's an error
- Pagination: return { items, total, page, limit }
- Transactions for multi-step operations

**Data Integrity:**
- Decimal type for all monetary values (never float)
- Constraints: NOT NULL, UNIQUE, CHECK (amount > 0)
- Foreign key constraints with proper ON DELETE behavior
- Database-level validation for business rules

---

### 5. API Design Standards

**Endpoints Format:**
```
POST   /api/v1/expenses                    # Create shared expense
GET    /api/v1/expenses/:id                # Get expense details
GET    /api/v1/users/:userId/balances     # Get pending balances for user
GET    /api/v1/transactions                # List user's transactions
POST   /api/v1/transactions               # Create transaction
DELETE /api/v1/transactions/:id           # Delete transaction
```

**Request/Response Format:**
- Requests: JSON with Content-Type: application/json
- Response wrapper:
  ```json
  {
    "success": true,
    "data": { /* entity */ },
    "error": null,
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```
- Error response:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid amount",
      "details": { "field": "amount", "issue": "must be positive" }
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
  ```

**Pagination:**
```json
{
  "success": true,
  "data": {
    "items": [ /* array */ ],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

---

### 6. Testing Standards

**Coverage Minimum: 80%**

**Test File Naming:**
- `{module}.test.ts` in tests/ directory
- One test suite per service/controller

**Test Structure:**
```typescript
describe('TransactionService', () => {
  describe('createTransaction', () => {
    it('should create a transaction with valid inputs', async () => {
      // Arrange, Act, Assert
    });

    it('should throw error if amount is negative', async () => {
      // Should test error case
    });
  });
});
```

**What to Test:**
- Happy path (valid inputs, expected output)
- Validation errors (invalid inputs reject)
- Authorization (user can only access own data)
- Edge cases (boundary values, empty lists, null)
- Error handling (proper error codes returned)
- Business logic (calculations, net balance)

**Mocking:**
- Mock repositories for service tests
- Mock services for controller tests
- Use real database for integration tests (in-memory or test DB)
- Don't mock TypeORM entities - use real instances

---

### 7. Logging & Monitoring

**Pino Logging Format:**
```typescript
logger.info({ userId: user.id, action: 'expense_created', amount: 100 }, 'Expense created');
logger.error({ error: err.message, stack: err.stack }, 'Failed to create expense');
```

**Log Levels:**
- **error**: Failures requiring attention (validation fail, DB error)
- **warn**: Unusual but recoverable (rate limit approached)
- **info**: Important business events (user action completed)
- **debug**: Development details (parameter values)

**What to Log:**
- All financial operations (create, update, delete)
- Authorization failures
- Validation errors
- Unexpected exceptions
- Performance metrics (query time if >100ms)

**What NOT to Log:**
- Passwords, API keys, secrets
- Full credit card numbers
- Health check requests (too noisy)
- Raw request bodies (log sanitized versions)

---

### 8. Common Pitfalls to Avoid

**Do:**
✅ Validate inputs in controllers before passing to services
✅ Use transactions for multi-step financial operations
✅ Check user ownership before reading/modifying
✅ Return consistent error codes
✅ Log financial operations for audit
✅ Test edge cases (0 amount, single participant, etc.)
✅ Use descriptive variable/function names
✅ Keep functions under 30 lines

**Don't:**
❌ Call database directly from controllers
❌ Expose error stack traces to clients
❌ Use magic numbers (extract to constants)
❌ Forget to validate authorization
❌ Commit secrets or API keys
❌ Use `any` type in TypeScript
❌ Make functions do multiple things
❌ Leave TODO comments without issues

---

### 9. Prompting Guidelines for Copilot

**When Asking Copilot:**
1. Provide context: "In TypeORM, for the Transaction entity..."
2. Be specific: "Create a repository method that finds..." (not "create a transaction function")
3. Show example: "Similar to this existing pattern in TransactionService..."
4. Specify constraints: "Must include user authorization check"
5. Request documentation: "Include JSDoc comments"

**Example Good Prompt:**
```
Create a TypeORM service method to calculate net balances between two users.
- Input: userId1, userId2
- Process: Find all shared expenses between them, sum their shares
- Return type: { userId1OwesUserId2: number, userId2OwesUserId1: number }
- Include authorization check to ensure user1 is making the request
- Use Decimal type for amounts
- Include JSDoc comments
```

**Example Bad Prompt:**
```
Generate balance calculation code
```

---

### 10. Review Checklist Before Commit

Before committing code, ensure:
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No `any` types (run `npm run type-check`)
- [ ] All public functions have JSDoc comments
- [ ] All endpoints have authorization checks
- [ ] Amounts use Decimal type, validated as positive
- [ ] Tests pass and cover edge cases (`npm test`)
- [ ] Logging includes context (userId, action, timestamp)
- [ ] No secrets in code (use .env)
- [ ] Error handling follows standard response format
- [ ] Commit message follows Conventional Commits

---

**This document is the source of truth for consistent AI-assisted development in FinTrack.**
