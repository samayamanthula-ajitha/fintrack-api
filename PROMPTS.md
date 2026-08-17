# Copilot Prompt Engineering Documentation
## FinTrack Expense Splitting Feature

**Date:** 2026-08-16  
**Feature:** Expense Splitting Module  
**Total Prompts Used:** 8  
**Copilot Features Used:** Chat, Inline Code Suggestions, Code Explanation

---

## Prompt Chain (Execution Order)

### Prompt 1: Transaction Module Review Setup
**Copilot Feature:** Chat  
**Technique Applied:** Role-Based Prompting + Decomposition  
**When:** Initial phase (after inheriting unreviewed code)

```
You are a senior fintech security architect reviewing AI-generated code.
Analyze the Transaction module in src/transactions/ for production-readiness.
Focus on:
1. Financial data integrity (amount precision, rounding)
2. Security (authorization, input validation, no data leakage)
3. Compliance (audit logging, soft deletes, data retention)
4. Error handling (typed errors, proper status codes)
5. Architecture (layered pattern, repository isolation)

Provide a structured review with severity levels, impact assessment, and fixes.
Format: For each issue, include "Why This Matters (Fintech)" and "How Detected".
```

**Rationale:** 
- Role-based ("security architect") sets expectations for domain expertise
- Decomposition (5 focus areas) ensures comprehensive coverage
- Specifies output format to guide review structure

**What Copilot Did:** Generated a thorough review identifying 10+ issues (later formalized into REVIEW.md)

**Copilot Features Used:** 
- Chat with context window
- Iterative refinement (asked follow-ups to deepen analysis)

---

### Prompt 2: Copilot Instructions File Creation
**Copilot Feature:** Chat  
**Technique Applied:** Specificity + Constraint-Based Prompting  
**When:** Standards setup phase

```
Create a GitHub Copilot custom instructions file (.github/copilot-instructions.md) for FinTrack's fintech API.

This file must guide all Copilot usage in the repository. Include:

1. Technology Stack (TypeScript, Express, PostgreSQL, TypeORM, Zod)
2. Layered Architecture (Controller → Service → Repository → Model)
3. Coding Standards (naming, TypeScript rules, max line length: 100)
4. Security & Fintech Rules:
   - JWT authorization required
   - Decimal type mandatory for amounts
   - Input validation with Zod
   - Soft deletes for audit trail
   - Never expose stack traces
5. API Design (endpoint format, response wrapper format, error codes)
6. Database Patterns (Decimal columns, soft deletes, indexes)
7. Testing Standards (80% coverage min, what to test)
8. Logging Format (Pino, what to log, what not to log)
9. Common Pitfalls (10 Do's and Don'ts)
10. Prompting Guidelines (how to ask Copilot for consistent output)

Make it comprehensive enough that developers don't need to ask questions—Copilot will follow these patterns automatically.
Include code examples, not just rules.
```

**Rationale:** 
- Specificity (10 explicit sections)
- Constraint-based (specific line length, minimum coverage %)
- Sets up foundation for all future prompts

**What Copilot Did:** Generated a 310-line production-grade instructions document

**Copilot Features Used:** 
- Long-form chat
- Code example generation within markdown

---

### Prompt 3: Remediated Transaction Model
**Copilot Feature:** Inline Code Suggestions + Chat  
**Technique Applied:** Iterative Refinement + Few-Shot Examples  
**When:** Transaction remediation phase

```
Rewrite the Transaction model (src/transactions/models/Transaction.ts) to production standards.

Requirements:
- Use Decimal type for amount (precision: 19, scale: 2)
- Add soft delete with @DeleteDateColumn
- Include TransactionStatus enum (pending, completed, failed)
- Add recipient ID for peer-to-peer transactions
- All columns must have JSDoc comments explaining business purpose
- Follow TypeORM best practices: CreateDateColumn, UpdateDateColumn
- No column without a constraint or purpose documented

Reference pattern:
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column('uuid')
  userId: string;  // User who owns this transaction
  
  @Column('decimal', { precision: 19, scale: 2 })
  amount: Decimal;  // ✅ Exact precision for currency
  
  @DeleteDateColumn()
  deletedAt: Date | null;  // Soft delete for audit trail
}

Output: Complete, production-ready Transaction entity.
```

**Rationale:** 
- Few-shot (provided reference pattern)
- Iterative (asked Copilot, reviewed, asked refinements)
- Specificity (exact column types, precision values)

**What Copilot Did:** Generated Transaction.ts with proper decorators, Decimal type, JSDoc comments

**Copilot Features Used:** 
- Inline suggestions (triggered by typing `@Column`)
- Chat refinement (asked to add JSDoc to every field)

---

### Prompt 4: Transaction Service with Authorization & Validation
**Copilot Feature:** Chat + Code Completions  
**Technique Applied:** Constraint-Based + Role-Based  
**When:** Service layer remediation

```
Create a TransactionService class (src/transactions/services/TransactionService.ts) that:

1. AUTHORIZATION (Critical):
   - Accept requestingUserId and targetUserId parameters
   - Verify requestingUserId === targetUserId before any operation
   - Throw ForbiddenError if check fails
   - Log authorization failures

2. INPUT VALIDATION (Critical):
   - Use Zod schemas for all inputs
   - Validate description: min 1, max 255 chars
   - Validate amount: must be Decimal and positive (> 0)
   - Validate recipientId: valid UUID format
   - Throw ValidationError with field information

3. ERROR HANDLING:
   - Define typed errors: ValidationError, NotFoundError, ForbiddenError
   - Each error must have a name and message
   - Include error details for client response

4. LOGGING (Fintech Audit):
   - Use Pino logger
   - Log all operations: create, read, update, delete
   - Include userId, amount, action, timestamp
   - Log errors with full message but NO passwords/secrets

5. Methods needed:
   - createTransaction(requestingUserId, targetUserId, input)
   - getTransactionsByUser(requestingUserId, targetUserId)
   - getTransactionById(requestingUserId, transactionId)
   - updateTransaction(requestingUserId, transactionId, input)
   - deleteTransaction(requestingUserId, transactionId)
   - deleteAllTransactionsForUser(requestingUserId, targetUserId)

ALL methods must:
- Accept requestingUserId for authorization
- Validate authorization before any DB call
- Include JSDoc with @param, @returns, @throws
- Handle errors explicitly
- Log operations

Output: Complete, production-ready TransactionService with no shortcuts.
```

**Rationale:** 
- Constraint-based (5 sections with explicit requirements)
- Role-based ("as fintech developer")
- Decomposition (breaks into authorization, validation, logging, error handling)

**What Copilot Did:** Generated TransactionService with all methods, proper error types, validation schemas, authorization checks, and logging

**Copilot Features Used:** 
- Chat (long-form request)
- Code completion (auto-completed method signatures)
- Suggestions (offered similar methods after first one)

---

### Prompt 5: SharedExpense Model & Participant Tracking
**Copilot Feature:** Chat  
**Technique Applied:** Specificity + Domain Context  
**When:** Expense Splitting feature build

```
Create SharedExpense and ExpenseParticipant models for the Expense Splitting feature.

CONTEXT:
- SharedExpense: created by a user, includes 2+ participants, has total amount
- ExpenseParticipant: tracks each participant's share and payment status
- Split types: equal (all pay same), custom (specific amounts), percentage

SharedExpense Model (src/expenses/models/SharedExpense.ts):
- id (UUID, PK)
- creatorId (UUID, user who created the expense)
- description (varchar 255)
- totalAmount (Decimal, precision 19, scale 2)
- splitType (ENUM: equal, custom, percentage)
- category (varchar 50, nullable, for reporting)
- expenseDate (date, nullable, optional)
- isSettled (boolean, default false)
- participants (OneToMany → ExpenseParticipant)
- createdAt, updatedAt (auto), deletedAt (soft delete)

ExpenseParticipant Model (src/expenses/models/ExpenseParticipant.ts):
- id (UUID, PK)
- expenseId (UUID, FK to SharedExpense)
- userId (UUID, participant user)
- amount (Decimal, their share amount owed)
- amountPaid (Decimal, how much they've paid)
- isPaid (boolean, computed: amountPaid >= amount)
- createdAt (auto)
- Relationship: ManyToOne → SharedExpense

CONSTRAINTS:
- Use @Column with proper TypeORM decorators
- @Decimal with precision: 19, scale: 2 for amounts
- @OneToMany and @ManyToOne for relationships
- Include CASCADE: true on delete
- Add @CreateDateColumn, @UpdateDateColumn, @DeleteDateColumn
- All fields need JSDoc comments

Output: Two complete, production-ready entity files with relationships.
```

**Rationale:** 
- Specificity (explicit field names, types, constraints)
- Domain context (explains the business model)
- Constraint-based (CASCADE, soft deletes)

**What Copilot Did:** Generated both entities with proper TypeORM decorators, relationships, and comments

**Copilot Features Used:** 
- Chat with structured requirements
- Suggestions for relationship configuration

---

### Prompt 6: ExpenseService with Balance Calculation
**Copilot Feature:** Chat  
**Technique Applied:** Iterative Refinement + Decomposition  
**When:** Business logic implementation

```
Create ExpenseService (src/expenses/services/ExpenseService.ts) with:

1. createExpense(requestingUserId, input):
   - Validate input with Zod (description, totalAmount, splitType, participantIds)
   - Ensure creator is in participants
   - For EQUAL split: divide totalAmount equally among participants
   - For CUSTOM split: validate custom amounts sum to total
   - Create SharedExpense + ExpenseParticipant records
   - Log operation with amount, participant count
   - Authorization: requestingUserId becomes creatorId

2. getExpense(requestingUserId, expenseId):
   - Authorization: requestingUserId must be creator OR participant
   - Throw ForbiddenError if not involved
   - Return full expense with participants

3. calculateBalance(user1Id, user2Id) → Decimal:
   - Find all expenses between these two users
   - For each expense:
     - If user1 is creator: user2 owes user1 (user2's share - user2's paid)
     - If user2 is creator: user1 owes user2 (user1's share - user1's paid)
   - Sum to get net balance
   - Positive = user1 owes user2; Negative = user2 owes user1
   - Use Decimal arithmetic (no float)

4. recordPayment(requestingUserId, expenseId, amount):
   - Authorization: requestingUserId must be a participant
   - Validate amount > 0 and amount <= remaining owed
   - Update participant.amountPaid
   - If all participants settled, mark expense.isSettled = true
   - Log payment with amount

5. deleteExpense(requestingUserId, expenseId):
   - Authorization: only creator can delete
   - Soft delete (set deletedAt)
   - Log deletion

ERROR HANDLING:
- Custom errors: ValidationError, NotFoundError, ForbiddenError
- All with messages and optional field info
- Throw specific errors, catch and log

LOGGING:
- Pino logger
- Log creation, access, payments, deletions
- Include userId, expenseId, amounts, actions
- Log failures with error messages

Output: Complete ExpenseService production-ready.
```

**Rationale:** 
- Decomposition (breaks into 5 methods)
- Specificity (exact balance calculation logic)
- Iterative (can refine each method individually)

**What Copilot Did:** Generated ExpenseService with all methods, balance calculation logic, authorization, and error handling

**Copilot Features Used:** 
- Chat (detailed requirements)
- Suggestions (offered parameter types)
- Code completions (filled in error types after first definition)

---

### Prompt 7: Test Suite with 6+ Test Cases
**Copilot Feature:** Chat  
**Technique Applied:** Constraint-Based + Few-Shot  
**When:** Testing phase

```
Create comprehensive test suites for Expense Splitting:

File: tests/expenses.test.ts

Must include 6+ test cases covering:

1. Equal Split (3 participants):
   - Create expense with $90, split equally among 3 users
   - Each should owe $30
   - Verify participants array has correct amounts

2. Custom Split (valid amounts):
   - Create expense $100 with custom splits: user1=$40, user2=$60
   - Verify amounts match exactly
   - Verify sum = total

3. Custom Split (invalid amounts - fail):
   - Try to create with amounts that DON'T sum to total (e.g., $40+$40=$80 vs total $100)
   - Should throw ValidationError
   - Test catches the error

4. Net Balance Calculation:
   - Create two expenses between user1 & user2
   - Expense 1: user1 paid $100, user2 owes $60
   - Expense 2: user1 paid $80, user2 owes $50
   - Calculate net: should show user2 owes user1 $110
   - Verify Decimal arithmetic (no float errors)

5. Single Participant Edge Case:
   - Try to create with participantIds = [user1] (only 1 person)
   - Should throw ValidationError (need minimum 2)
   - Test validates the validation

6. Unauthorized Access:
   - User3 tries to access expense created by User1+User2
   - Should throw ForbiddenError
   - User3 is not creator or participant
   - Test verifies authorization boundary

Test Structure (AAA pattern):
- describe('ExpenseService', () => {
-   beforeEach(() => { /* mock repository */ })
-   describe('createExpense', () => {
-     it('should...', async () => {
-       // Arrange: set up test data
-       // Act: call method
-       // Assert: expect result
-     })
-   })
- })

Mock Repository:
- jest.fn() for createExpense, getById, getByUserPair, updateParticipantPayment, softDelete, markAsSettled
- Return mock data matching SharedExpense interface

Output: Complete test file with 6+ passing tests, using Jest + mocked repository.
```

**Rationale:** 
- Constraint-based (explicit test cases to cover)
- Few-shot (provided AAA pattern and mock structure)
- Specificity (each test describes exact scenario)

**What Copilot Did:** Generated tests/expenses.test.ts with all 6+ cases, proper mocking, and Jest structure

**Copilot Features Used:** 
- Chat (detailed test specifications)
- Code completions (generated similar test blocks after first)

---

### Prompt 8: ExpenseController with API Routes
**Copilot Feature:** Chat  
**Technique Applied:** Specificity + Constraint-Based  
**When:** API layer implementation

```
Create ExpenseController (src/expenses/controllers/ExpenseController.ts) with routes:

API ENDPOINTS:
1. POST /api/v1/expenses
   - Create shared expense
   - Request body: { description, totalAmount, splitType, participantIds, category?, expenseDate? }
   - Response: { success, data: { id, creatorId, participants, ... }, timestamp }
   - Auth: JWT token (extract userId from claims)

2. GET /api/v1/expenses/:id
   - Get expense details
   - Auth: JWT required
   - Authorization: requestingUser must be creator or participant
   - Response: { success, data: { expense with participants } }

3. GET /api/v1/users/:userId/balances
   - Get all pending balances for a user
   - Auth: JWT required (must be own userId)
   - Returns: [ { otherUserId, balanceAmount, owesMe: boolean } ]

4. POST /api/v1/expenses/:id/payment
   - Record payment for an expense
   - Request body: { amount }
   - Auth: JWT required
   - Authorization: must be participant in expense

RESPONSE FORMAT (standard):
{
  "success": true,
  "data": { /* entity */ },
  "error": null,
  "timestamp": "2024-01-15T10:30:00Z"
}

ERROR RESPONSE:
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid amount",
    "details": { "field": "amount" }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}

CONTROLLER CLASS:
- Constructor: accepts ExpenseService
- Each route method: (req, res, next) => Promise<void>
- Extract userId from req.user.sub (JWT middleware already verified)
- Call service method
- Catch errors, map to HTTP status codes:
  - ValidationError → 422
  - ForbiddenError → 403
  - NotFoundError → 404
  - Unexpected → 500 (don't expose message)
- Return response wrapper
- Log all requests with userId, action, result

Output: Production-ready ExpenseController.
```

**Rationale:** 
- Specificity (exact endpoints, request/response format)
- Constraint-based (specific HTTP codes, response structure)
- Error mapping (which error types → which codes)

**What Copilot Did:** Generated ExpenseController with all routes, error handling, response wrappers

**Copilot Features Used:** 
- Chat (detailed API specification)
- Suggestions (auto-completed route handlers)

---

## Post-Generation Corrections

This section documents every time Copilot's output didn't match requirements, what was wrong, and how I fixed it.

### Correction 1: Balance Calculation Logic Bug
**What Copilot Generated:**
```typescript
async calculateBalance(user1Id: string, user2Id: string): Promise<Decimal> {
  const expenses = await this.repository.getByUserPair(user1Id, user2Id);
  let balance = new Decimal(0);
  
  for (const expense of expenses) {
    const user1Participant = expense.participants.find(p => p.userId === user1Id);
    const user2Participant = expense.participants.find(p => p.userId === user2Id);
    
    if (user1Participant && user2Participant) {
      // ❌ WRONG: assumes creator always paid
      balance = balance.plus(expense.totalAmount / 2);
    }
  }
  return balance;
}
```

**What Was Wrong:**
- Divided by 2 regardless of actual shares
- Didn't account for custom splits
- Didn't track who actually paid
- Didn't subtract amountPaid

**How I Fixed It:**
```typescript
async calculateBalance(user1Id: string, user2Id: string): Promise<Decimal> {
  const expenses = await this.repository.getByUserPair(user1Id, user2Id);
  let balance = new Decimal(0);
  
  for (const expense of expenses) {
    const user1Participant = expense.participants.find(p => p.userId === user1Id);
    const user2Participant = expense.participants.find(p => p.userId === user2Id);
    
    if (!user1Participant || !user2Participant) continue;
    
    // Check who paid (creator paid, simplifying for now)
    if (expense.creatorId === user1Id) {
      // user1 paid; user2 owes
      balance = balance.plus(user2Participant.amount).minus(user2Participant.amountPaid);
    } else if (expense.creatorId === user2Id) {
      // user2 paid; user1 owes
      balance = balance.minus(user1Participant.amount).plus(user1Participant.amountPaid);
    }
  }
  return balance;
}
```

**Why Copilot Got It Wrong:**
- No context on custom splits or payment tracking
- Oversimplified with division by 2
- Didn't understand the domain model (creator ≠ payer in general)

**Lesson:** Domain logic requires explicit specification; Copilot's default is too simplistic.

---

### Correction 2: Missing Authorization in getExpense
**What Copilot Generated:**
```typescript
async getExpense(requestingUserId: string, expenseId: string): Promise<SharedExpense> {
  const expense = await this.repository.getById(expenseId);
  if (!expense) {
    throw new NotFoundError();
  }
  // ❌ MISSING: authorization check!
  return expense;
}
```

**What Was Wrong:**
- No check that requestingUserId is allowed to see this expense
- Any participant could see other participants' details

**How I Fixed It:**
```typescript
async getExpense(requestingUserId: string, expenseId: string): Promise<SharedExpense> {
  const expense = await this.repository.getById(expenseId);
  if (!expense) {
    throw new NotFoundError();
  }
  
  // ✅ FIXED: Verify user is creator or participant
  const isCreator = expense.creatorId === requestingUserId;
  const isParticipant = expense.participants.some(p => p.userId === requestingUserId);
  
  if (!isCreator && !isParticipant) {
    logger.warn({ userId: requestingUserId, expenseId }, 'Unauthorized access attempt');
    throw new ForbiddenError('Cannot access this expense');
  }
  
  return expense;
}
```

**Why Copilot Got It Wrong:**
- Copilot was told to accept `requestingUserId` but didn't infer WHERE to use it
- Authorization checks aren't obvious unless explicitly instructed "check before return"

**Lesson:** Security checks must be explicitly stated in prompts; "verify authorization" isn't enough.

---

### Correction 3: Input Validation Missing for Custom Split Amounts
**What Copilot Generated:**
```typescript
const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  totalAmount: z.instanceof(Decimal).refine(val => val.isPositive()),
  splitType: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  participantIds: z.array(z.string().uuid()).min(2),
  // ❌ MISSING: customAmounts not validated
  category: z.string().max(50).optional(),
  expenseDate: z.date().optional(),
});

async createExpense(requestingUserId: string, input: unknown): Promise<SharedExpense> {
  const validated = CreateExpenseSchema.parse(input);
  
  // ❌ No check: do custom amounts sum to total?
  return this.repository.createExpense(...);
}
```

**What Was Wrong:**
- Schema didn't require customAmounts for custom split
- No validation that amounts sum to total
- Garbage-in, garbage-out for custom splits

**How I Fixed It:**
```typescript
const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  totalAmount: z.instanceof(Decimal).refine(val => val.isPositive(), 'Amount must be positive'),
  splitType: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  participantIds: z.array(z.string().uuid()).min(2, 'Need at least 2 participants'),
  customAmounts: z.record(z.string().uuid(), z.instanceof(Decimal)).optional(),
  category: z.string().max(50).optional(),
  expenseDate: z.date().optional(),
});

async createExpense(requestingUserId: string, input: unknown): Promise<SharedExpense> {
  let validated: CreateExpenseDTO;
  try {
    validated = CreateExpenseSchema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.issues[0].message);
    }
    throw error;
  }
  
  // ✅ FIXED: Validate custom split amounts
  if (validated.splitType === 'custom') {
    if (!validated.customAmounts) {
      throw new ValidationError('Custom split requires customAmounts');
    }
    
    const sum = Object.values(validated.customAmounts).reduce(
      (acc, amount) => acc.plus(amount),
      new Decimal(0),
    );
    
    if (!sum.equals(validated.totalAmount)) {
      throw new ValidationError(
        `Custom amounts ($${sum}) don't match total ($${validated.totalAmount})`,
      );
    }
  }
  
  return this.repository.createExpense(...);
}
```

**Why Copilot Got It Wrong:**
- Schema doesn't automatically know business rules (amounts must sum)
- Copilot generated optional customAmounts but no logic to enforce them
- Needs explicit instruction: "for custom splits, validate amounts sum to total"

**Lesson:** Business validation rules must be explicitly stated; AI doesn't infer domain constraints.

---

### Correction 4: Missing Null Handling in Test Mocks
**What Copilot Generated:**
```typescript
mockRepository.getById.mockResolvedValue(mockExpense);

const result = await service.getExpense(creatorId, expenseId);
expect(result).toEqual(mockExpense);  // ❌ What if getById returns null?
```

**What Was Wrong:**
- Test didn't cover NotFoundError case
- Mock always returns success; no failure path tested

**How I Fixed It:**
```typescript
it('should throw NotFoundError if expense does not exist', async () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const expenseId = '770e8400-e29b-41d4-a716-446655440000';
  
  mockRepository.getById.mockResolvedValue(null);  // ✅ Return null
  
  await expect(service.getExpense(userId, expenseId)).rejects.toThrow(NotFoundError);
});
```

**Why Copilot Got It Wrong:**
- Generated happy-path tests first
- Didn't automatically generate error paths
- Prompt said "≥6 test cases" but didn't explicitly list all cases

**Lesson:** Prompt must list ALL test cases, not just "happy path + edge cases".

---

### Correction 5: Response Wrapper Missing Timestamp
**What Copilot Generated:**
```typescript
res.json({
  success: true,
  data: expense,
  error: null,
});  // ❌ MISSING: timestamp
```

**What Was Wrong:**
- Instructions said all responses must include timestamp
- This response doesn't have it

**How I Fixed It:**
```typescript
res.json({
  success: true,
  data: expense,
  error: null,
  timestamp: new Date().toISOString(),  // ✅ ISO 8601 format
});
```

**Why Copilot Got It Wrong:**
- Generated basic response structure
- Didn't consistently include all fields from the specification
- Copilot follows the pattern from first example; if early example lacks timestamp, others will too

**Lesson:** Provide complete examples in prompts; Copilot copies patterns from first occurrence.

---

### Correction 6: Decimal Precision Loss in Calculation
**What Copilot Generated:**
```typescript
const amounts = customAmounts.map(a => a / participantCount);  // ❌ Float division!
```

**What Was Wrong:**
- Uses JavaScript float division
- Loses precision for Decimal amounts
- Violates .github/copilot-instructions.md: "Amounts must be Decimal"

**How I Fixed It:**
```typescript
const amounts = Object.values(customAmounts).map(amount =>
  amount.div(participantCount)  // ✅ Decimal division with precision
);
```

**Why Copilot Got It Wrong:**
- Copilot defaults to JavaScript operators for numeric operations
- Doesn't automatically know to use Decimal methods
- Needs explicit instruction in prompts: "Use Decimal.div() not /"

**Lesson:** Library-specific methods must be highlighted in prompts.

---

## Summary: How Copilot Performed

| Aspect | Result | Notes |
|--------|--------|-------|
| Code scaffolding | ⭐⭐⭐⭐⭐ | Excellent at basic structure, boilerplate |
| Error handling | ⭐⭐⭐⭐ | Good with explicit types, sometimes forgets try-catch |
| Authorization | ⭐⭐⭐ | Often forgets; needs explicit "verify user owns" instruction |
| Business logic | ⭐⭐ | Oversimplifies; needs detailed algorithm specification |
| Test coverage | ⭐⭐⭐⭐ | Good structure, but misses edge cases unless listed |
| Decimal precision | ⭐⭐ | Defaults to floats; needs "use Decimal type" in prompt |
| Security validation | ⭐⭐⭐ | Good with Zod, but misses domain rules (e.g., amounts must sum) |

**Lesson:** Copilot excels at syntax and patterns. Human oversight essential for domain logic, security, and fintech compliance.
