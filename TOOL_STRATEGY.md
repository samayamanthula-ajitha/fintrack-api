# Copilot Tool Strategy & Reflection
## FinTrack Expense Splitting Assessment

**Date:** 2026-08-16  
**Assessment Period:** Full sprint (standards → transaction review → expense splitting → tests)  
**Copilot Subscription:** GitHub Copilot Chat + Code Completions

---

## Feature Usage Log

This section documents how I used Copilot across this case study, with rationale for each choice.

### Entry 1: Standards Setup — Chat for Copilot Instructions File
**Feature Used:** GitHub Copilot Chat  
**Context:** Beginning of sprint; needed to create `.github/copilot-instructions.md`

**What I Did:**
```
Prompt: "Create a GitHub Copilot custom instructions file for FinTrack...
[10 explicit sections with constraints: Decimal for amounts, auth required, etc.]"
```

**Why This Feature (Not Another):**
- Needed long-form, structured output (310+ lines)
- Instructions file is complex document with examples
- Chat allows iteration: "Add a section on...", "Revise this part..."
- Code completions alone couldn't generate full document coherently

**What Happened:**
- ✅ Chat generated comprehensive file in one response
- ✅ I refined twice ("Add Pino logging section", "Add prompting guidelines")
- ✅ Final output became foundation for all future Copilot prompts

**Outcome:** Excellent. Saved ~2 hours vs. writing from scratch.

---

### Entry 2: Transaction Review — Chat for Code Audit
**Feature Used:** GitHub Copilot Chat  
**Context:** Had unreviewed AI-generated Transaction module; needed structured audit

**What I Did:**
```
Prompt: "You are a senior fintech security architect. Review src/transactions/...
Focus on: data integrity, security, compliance, error handling, architecture.
Provide structured review with severity, impact, fixes."
```

**Why This Feature (Not Another):**
- Inline suggestions can't analyze entire module structure
- Needed conversational, expert-level review
- Chat's context window could hold 3-4 files and reason about them
- Iterative: could ask follow-up questions ("Is soft delete implementation sufficient?")

**What Happened:**
- ✅ Chat identified 10+ issues (some I initially missed)
- ✅ Explanations included "Why This Matters (Fintech)" — crucial for understanding domain constraints
- ✅ Suggestions were practical and implementation-ready
- ⚠️ Missed one edge case: concurrent payment race conditions (required domain expertise to add)

**Outcome:** Very good. Produced REVIEW.md with minimal editing.

---

### Entry 3: Transaction Model Rewrite — Chat + Inline Suggestions
**Feature Used:** GitHub Copilot Chat (prompting) + Inline Code Suggestions (auto-complete)  
**Context:** Rewriting Transaction.ts to use Decimal, soft deletes, proper decorators

**What I Did:**
1. Chat prompt: "Rewrite Transaction model to production standards. Use Decimal for amount..."
2. Started typing in VS Code: `@Column('decimal', { precision: 19, scale: 2 })`
3. Copilot inline suggestion appeared with complete decorator

**Why This Feature Combination:**
- Chat: Gave high-level requirements and examples
- Inline suggestions: Auto-completed repetitive patterns (decorators, imports)
- Efficiency: Don't retype `@CreateDateColumn()`, `@UpdateDateColumn()`, `@DeleteDateColumn()`

**What Happened:**
- ✅ Chat generated correct type (Decimal, not number)
- ✅ Inline suggestions caught patterns (suggested `@DeleteDateColumn` after seeing `@CreateDateColumn`)
- ✅ Reduced typing by ~30%

**Outcome:** Excellent. Fast and accurate.

---

### Entry 4: Transaction Service — Chat with Decomposition
**Feature Used:** GitHub Copilot Chat  
**Context:** Building TransactionService with authorization, validation, error handling, logging

**What I Did:**
```
Prompt: "Create TransactionService with...
1. AUTHORIZATION (Critical): [3-line requirement]
2. INPUT VALIDATION (Critical): [4-line requirement]
3. ERROR HANDLING: [3-line requirement]
4. LOGGING (Fintech Audit): [4-line requirement]
5. Methods needed: [6 methods listed]

ALL methods must: [5 requirements]"
```

**Why This Feature (Not Another):**
- Complex requirements across 5 dimensions
- Needed explicit structure (Chat respects numbered lists better than completions)
- Decomposition forces Copilot to address each aspect separately
- Follow-up questions easier in Chat

**What Happened:**
- ✅ Generated all 6 methods with authorization checks
- ✅ Added Zod validation schemas
- ✅ Included try-catch with logging
- ⚠️ Initially forgot to log authorization failures (asked Chat to add, it did)

**Outcome:** Good. Required one follow-up refinement.

---

### Entry 5: SharedExpense Models — Chat with Domain Context
**Feature Used:** GitHub Copilot Chat  
**Context:** Creating SharedExpense and ExpenseParticipant entities

**What I Did:**
```
Prompt: "Create SharedExpense and ExpenseParticipant models for Expense Splitting.

CONTEXT: [2-line business description]

SharedExpense Model: [7 fields with types]
ExpenseParticipant Model: [5 fields with types]

CONSTRAINTS: [3 TypeORM-specific requirements]"
```

**Why This Feature:**
- Two related entities needed consistent design
- Needed to explain relationships (OneToMany, ManyToOne)
- Chat's context window held both models while reasoning about them

**What Happened:**
- ✅ Generated proper @OneToMany/@ManyToOne decorators
- ✅ Correct CASCADE configuration
- ✅ Both files compiled without fixes
- ✅ Relationships properly understood (expense.participants was eager-loaded)

**Outcome:** Excellent. No corrections needed.

---

### Entry 6: ExpenseService Business Logic — Chat with Algorithm Specification
**Feature Used:** GitHub Copilot Chat  
**Context:** Building balance calculation logic (most complex method)

**What I Did:**
```
Prompt: "Create ExpenseService with...
3. calculateBalance(user1Id, user2Id) → Decimal:
   - Find all expenses between these two users
   - For each expense:
     - If user1 is creator: user2 owes user1 (user2's share - user2's paid)
     - If user2 is creator: user1 owes user2 (user1's share - user1's paid)
   - Sum to get net balance
   - Positive = user1 owes user2; Negative = user2 owes user1
   - Use Decimal arithmetic (no float)"
```

**Why This Feature:**
- Complex algorithm needed explicit step-by-step explanation
- Chat allowed me to be precise ("Positive means...", "Use Decimal, not float")
- Required domain knowledge (who owes whom calculation)

**What Happened:**
- ✅ Generated correct logic for simple case (creator paid)
- ⚠️ But missed edge case: what if neither user was creator? (no calculation)
- ⚠️ Assumed creator always paid (I documented this as MVP limitation)

**Outcome:** Good but incomplete. Required manual refinement and documentation.

---

### Entry 7: Test Suite Specification — Chat with Constraint-Based Prompting
**Feature Used:** GitHub Copilot Chat  
**Context:** Creating 6+ test cases covering key scenarios

**What I Did:**
```
Prompt: "Create comprehensive test suites...
Must include 6+ test cases covering:
1. Equal Split (3 participants): [scenario]
2. Custom Split (valid amounts): [scenario]
3. Custom Split (invalid amounts - fail): [scenario]
4. Net Balance Calculation: [scenario]
5. Single Participant Edge Case: [scenario]
6. Unauthorized Access: [scenario]

Test Structure (AAA pattern): [example]
Mock Repository: [description]"
```

**Why This Feature:**
- Listing exact test cases forces Copilot to generate all of them
- Chat's ability to follow structured requirements

**What Happened:**
- ✅ Generated 6 test cases exactly as specified
- ✅ Used AAA (Arrange-Act-Assert) pattern
- ✅ Proper Jest structure with beforeEach, mock setup
- ⚠️ Missed NotFoundError case initially (I added it manually)

**Outcome:** Very good. Test suite was solid; only minor gap.

---

### Entry 8: ExpenseController & Routes — Chat with API Specification
**Feature Used:** GitHub Copilot Chat  
**Context:** Building API layer with routes, error handling, response format

**What I Did:**
```
Prompt: "Create ExpenseController with routes:
1. POST /api/v1/expenses [spec]
2. GET /api/v1/expenses/:id [spec]
3. GET /api/v1/users/:userId/balances [spec]
4. POST /api/v1/expenses/:id/payment [spec]

RESPONSE FORMAT (standard): [JSON template]
ERROR RESPONSE: [JSON template]

CONTROLLER CLASS: [requirements for error mapping, logging]"
```

**Why This Feature:**
- API contracts need precise specification (endpoints, status codes, response shape)
- Chat's ability to follow templates
- Iterative refinement easier ("Add rate limiting headers", "Change error code")

**What Happened:**
- ✅ Generated all 4 routes with correct HTTP methods
- ✅ Error mapping correct (ValidationError → 422, ForbiddenError → 403)
- ✅ Response wrapper format consistent
- ✅ Logging added to each route

**Outcome:** Excellent. No corrections needed.

---

### Entry 9 (Bonus): Code Explanation — Chat for Understanding Patterns
**Feature Used:** GitHub Copilot Chat  
**Context:** Understanding TypeORM's relationship configuration and Decimal.js API

**What I Did:**
```
Prompt: "Explain TypeORM's @OneToMany decorator with cascade: true.
When is it used? What does cascade do? Risks?"

Prompt: "How do I use Decimal.js to divide amounts without losing precision?
Show example of dividing $100 among 3 people."
```

**Why This Feature (Not Docs):**
- Quick, conversational explanations
- Chat provided examples I could copy-paste
- Faster than searching documentation

**What Happened:**
- ✅ Explanations were accurate and practical
- ✅ Examples were immediately usable
- ✅ Saved documentation lookup time

**Outcome:** Very good. Accelerated learning.

---

## Copilot Features Used — Summary

| Feature | Used For | Quality | Times Used |
|---------|----------|---------|-----------|
| Chat (long-form requests) | Standards, reviews, complex logic, API specs | ⭐⭐⭐⭐⭐ | 8 |
| Inline Code Suggestions | Auto-completing decorators, method signatures | ⭐⭐⭐⭐ | ~50 (throughout) |
| Code Explanations | Learning TypeORM, Decimal.js patterns | ⭐⭐⭐⭐ | 3 |
| Context Window (multi-file) | Analyzing Transaction module, relationships | ⭐⭐⭐⭐ | 4 |
| Error Squiggles → Quick Fix | Fixing TypeScript compilation errors | ⭐⭐⭐ | 10+ |
| Code Completions (in IDE) | Path imports, object literals | ⭐⭐⭐ | ~100+ (routine) |

**Total Features Used:** 6  
**Chat Prompts:** 8 (structured, decomposed)  
**Prompting Techniques:** 5+ (specificity, decomposition, few-shot, constraints, role-based, iterative)

---

## Scenario Responses

For each scenario below, I specify which Copilot feature I'd use and why.

### Scenario 1: Understanding a Complex 500-Line Function in an Unfamiliar Codebase Before Modifying It

**Copilot Feature:** Chat (Code Explanations)

**Why This Feature:**
- 500 lines too long for inline suggestions to understand holistically
- Iterative conversation allows me to ask follow-ups: "What does this loop do?", "Why this condition?"
- Chat's context window can hold entire function and reason about it
- I can ask conversational questions like a code review peer

**Approach:**
1. Paste entire function into Chat
2. Ask: "Explain what this function does, step-by-step"
3. Chat breaks it into chunks and explains logic
4. Follow-up: "What would break if I change this condition?" → identify side effects
5. Identify safe modification points before touching code

**Alternative (Not Used):** Inline suggestions would only help with individual lines, not overall flow.

---

### Scenario 2: Adding Consistent Error Handling Across 8 Existing Route Handlers

**Copilot Feature:** Inline Code Suggestions (with consistency refinement via Chat)

**Why This Feature:**
- Repetitive task (8 handlers) → Copilot learns pattern after first example
- Once I write error handling in handler #1, Copilot auto-suggests same pattern for handlers #2-8
- Saves typing, ensures consistency
- If pattern isn't right, Chat can refine: "Make error handling use try-catch blocks instead of .catch()"

**Approach:**
1. Write error handling in first handler with try-catch + typed errors
2. Move to second handler, start typing `try {`
3. Copilot suggests full try-catch block matching first handler
4. Accept and move to next handler
5. Repeat for remaining 6 handlers
6. If pattern wrong, ask Chat: "Fix all 8 handlers to use custom ValidationError instead of generic Error"

**Speed:** 5 min with Copilot vs. 20 min manual.

---

### Scenario 3: Quickly Verifying a Regex Handles International Phone Number Formats

**Copilot Feature:** Chat (Code Explanations + Suggestions)

**Why This Feature:**
- Regex is complex; inline suggestions won't generate international patterns reliably
- Chat can explain existing regex and suggest improvements
- Can test with examples

**Approach:**
1. Ask Chat: "Does this regex handle international phone numbers? [paste regex]"
2. Chat explains what it matches/doesn't match
3. Ask: "Create a regex that handles: US (+1-555-1234), UK (+44-20-1234-5678), India (+91-98765-43210)"
4. Chat generates regex with explanation of each part
5. Test cases in Chat: "Test regex against these numbers: [list]"
6. Chat verifies coverage

**Alternative:** Manual regex testing in IDE would take much longer; Chat + testing is faster.

---

### Scenario 4: Enforcing Automated Code Quality Checks on Every Pull Request with No Human Intervention

**Copilot Feature:** None (Copilot isn't designed for this)

**What to Use Instead:** 
- ESLint + Prettier (automated formatting)
- GitHub Actions workflow (run linter on PR)
- Branch protection rules (block merge if checks fail)
- TypeScript strict mode (compiler checks)

**Why Copilot Can't Help:**
- Copilot generates code; it doesn't enforce standards in CI/CD pipelines
- This is an ops/tooling problem, not a code generation problem
- Copilot could help write the GitHub Actions workflow (Chat feature), but the enforcement is GitHub's responsibility

**How I'd Use Copilot (Partially):**
- Ask Chat: "Create a GitHub Actions workflow that runs ESLint, Prettier, and Jest on every PR"
- Chat generates `.github/workflows/ci.yml`
- But the enforcement (blocking merge) is GitHub configuration, not Copilot

---

### Scenario 5: Reviewing a Teammate's AI-Generated Authentication Module for Security Vulnerabilities

**Copilot Feature:** Chat (Code Explanations + Security Analysis)

**Why This Feature:**
- Can't use inline suggestions on someone else's file (they're not actively typing)
- Chat can analyze code pasted into conversation
- Conversational: "Does this JWT implementation check expiration?", "Are tokens invalidated on logout?"
- Can ask domain-specific security questions

**Approach:**
1. Paste teammate's authentication module into Chat
2. Ask: "Review this code for security issues. Focus on: JWT handling, password hashing, token refresh, logout invalidation"
3. Chat identifies issues with explanation
4. Ask follow-ups: "Is bcrypt salt cost sufficient?", "What happens if JWT is expired?"
5. Chat suggests fixes

**Advantage over Manual Review:** 
- Copilot catches patterns I might miss
- Explainable (Chat shows reasoning, not just "Issue here")

**Limitation:**
- Copilot might miss subtle vulnerabilities (require security expertise)
- Always pair with human security review, especially for auth

---

### Scenario 6: Ensuring Copilot Follows Project-Specific Conventions Consistently Across All Developers and Sessions

**Copilot Feature:** `.github/copilot-instructions.md` (Custom Instructions)

**Why This Feature:**
- Only way to enforce consistent output across sessions and developers
- Copilot reads instructions file and follows them automatically
- Without it, each developer would prompt differently, getting different code styles

**How It Works:**
1. Create `.github/copilot-instructions.md` with standards (naming, types, patterns)
2. Every developer (and every Copilot session) reads this file
3. When they prompt Copilot, it considers instructions in context
4. Example: "Always use Decimal for amounts" in instructions → Copilot generates Decimal by default

**Example from This Project:**
```markdown
# In .github/copilot-instructions.md
**TypeScript Rules:**
- All public functions/methods must have explicit return types
- Avoid `any` type - use `unknown` when necessary with type guards
- Use interfaces for contracts, types for aliases
- Enums for fixed sets of values (not magic strings)
```

When any developer asks Copilot to generate code, it follows these rules automatically.

**Limitation:** Instructions are suggestions, not law. Copilot can ignore them if prompt contradicts. But ~90% of the time, instructions guide behavior correctly.

---

## Limitations Encountered

This section documents 3 real situations where Copilot produced incorrect, incomplete, or inappropriate output — what I prompted, what went wrong, how I detected it, how I fixed it, and what I'd do differently.

### Limitation 1: Balance Calculation Logic Oversimplification

**What I Prompted:**
```
"Create calculateBalance(user1Id, user2Id) that calculates net balance between two users.
For each shared expense:
  - If user1 is creator: user2 owes user1
  - If user2 is creator: user1 owes user2
Return net balance (Positive = user1 owes user2)"
```

**What Went Wrong:**
Copilot generated:
```typescript
async calculateBalance(user1Id: string, user2Id: string): Promise<Decimal> {
  const expenses = await this.repository.getByUserPair(user1Id, user2Id);
  let balance = new Decimal(0);
  
  for (const expense of expenses) {
    const user1Participant = expense.participants.find(p => p.userId === user1Id);
    const user2Participant = expense.participants.find(p => p.userId === user2Id);
    
    if (user1Participant && user2Participant) {
      // ❌ WRONG: doesn't check creatorId
      // ❌ WRONG: assumes both exist without checking individually
      // ❌ WRONG: doesn't subtract amountPaid
      balance = balance.plus(user1Participant.amount);
    }
  }
  return balance;
}
```

**Problems:**
1. Doesn't check `expense.creatorId` at all
2. Doesn't track who paid vs. who owes
3. Doesn't subtract `amountPaid` (payment already made)
4. Would show wrong balance if only one user was in expense

**How I Detected:**
- Wrote tests with specific scenarios: Expense 1: user1 paid $100, user2 owes $60; Expense 2: user1 paid $80, user2 owes $50
- Test expected: user2 owes $110; Copilot's code returned: user2_amount + user2_amount (wrong)
- Test failure immediately showed issue

**How I Fixed:**
```typescript
async calculateBalance(user1Id: string, user2Id: string): Promise<Decimal> {
  const expenses = await this.repository.getByUserPair(user1Id, user2Id);
  let balance = new Decimal(0);
  
  for (const expense of expenses) {
    const user1Participant = expense.participants.find((p) => p.userId === user1Id);
    const user2Participant = expense.participants.find((p) => p.userId === user2Id);
    
    if (!user1Participant || !user2Participant) continue;  // ✅ Check both exist
    
    // ✅ Check who paid (assume creator for now)
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

**What I'd Do Differently:**
1. **More explicit algorithm in prompt:** Instead of "If user1 is creator: user2 owes user1", say:
   ```
   "For each expense:
   - Find user1 and user2 participant records
   - If either not found, skip this expense
   - Check expense.creatorId:
     - If creatorId === user1Id:
       - user2 owes user1: balance += user2_share - user2_paid
     - If creatorId === user2Id:
       - user1 owes user2: balance -= user1_share - user1_paid
   - (Handle case where neither is creator)"
   ```

2. **Test-driven:** Ask Copilot to generate test cases first, then implementation:
   ```
   "Generate test cases for calculateBalance() covering:
   1. Expense A: user1 paid $100, user2 owes $60
   2. Expense B: user2 paid $80, user1 owes $50
   3. Result: user2 owes user1 $110"
   ```
   Then: "Now implement calculateBalance() to pass these tests."

3. **Domain context:** Mention that this is fintech, precision critical:
   ```
   "This is fintech balance calculation. Rounding errors will cause user disputes.
   Use Decimal for all arithmetic. Validate test results exactly."
   ```

**Lesson:** Copilot oversimplifies domain logic. Requires: (1) very explicit algorithm, (2) tests first to validate, (3) domain warnings in prompt.

---

### Limitation 2: Authorization Check Forgotten in getExpense()

**What I Prompted:**
```
"Create getExpense(requestingUserId, expenseId) that:
- Returns expense if found
- Throws NotFoundError if not found
- Auth: requestingUserId must be creator or participant"
```

**What Went Wrong:**
Copilot generated:
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

**Problems:**
1. Accepts `requestingUserId` parameter but never uses it
2. No check that user is creator or participant
3. Compiles and runs fine; returns data to unauthorized users
4. Security vulnerability; passes code review unless human carefully reads

**How I Detected:**
- Code review during REVIEW.md creation
- Noticed parameter isn't used → red flag
- Traced data flow: parameter accepted but ignored
- Realized: any user could get any expense

**How I Fixed:**
```typescript
async getExpense(requestingUserId: string, expenseId: string): Promise<SharedExpense> {
  const expense = await this.repository.getById(expenseId);
  
  if (!expense) {
    throw new NotFoundError();
  }
  
  // ✅ FIXED: Verify authorization
  const isCreator = expense.creatorId === requestingUserId;
  const isParticipant = expense.participants.some((p) => p.userId === requestingUserId);
  
  if (!isCreator && !isParticipant) {
    logger.warn({ userId: requestingUserId, expenseId }, 'Unauthorized access attempt');
    throw new ForbiddenError('Cannot access this expense');
  }
  
  return expense;
}
```

**What I'd Do Differently:**
1. **Explicit authorization pattern in prompt:**
   ```
   "Authorization check MUST run before returning data:
   1. Load expense
   2. If not found: throw NotFoundError
   3. ✅ Check if requestingUserId is creator or participant
   4. ✅ If not: throw ForbiddenError
   5. ✅ Only then: return expense"
   ```

2. **Test-driven authorization:**
   ```
   "Test case: user3 tries to get expense created by user1+user2
   Result: should throw ForbiddenError, not return expense"
   ```
   Then request implementation that passes test.

3. **Add to Copilot instructions:** 
   ```
   "⚠️ SECURITY RULE: All service methods accepting requestingUserId parameter
   MUST verify user authorization before accessing/modifying data.
   Pattern:
     if (requestingUserId !== resourceOwnerId) {
       throw new ForbiddenError('...');
     }"
   ```

4. **Code review checklist:**
   ```
   - [ ] Method accepts requestingUserId
   - [ ] Authorization check runs BEFORE returning data
   - [ ] Throws ForbiddenError if unauthorized
   - [ ] Check is logged (for audit)
   ```

**Lesson:** Copilot doesn't know WHERE authorization checks belong. Needs: (1) explicit control flow, (2) test-driven (test unauthorized case), (3) project standards, (4) code review discipline.

---

### Limitation 3: Input Validation Missing for Custom Split Amounts

**What I Prompted:**
```
"Create CreateExpenseSchema (Zod) that validates:
- description: string, 1-255 chars
- totalAmount: Decimal, must be positive
- splitType: 'equal' | 'custom' | 'percentage'
- participantIds: array of UUIDs, at least 2"
```

**What Went Wrong:**
Copilot generated:
```typescript
const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  totalAmount: z.instanceof(Decimal).refine(val => val.isPositive()),
  splitType: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  participantIds: z.array(z.string().uuid()).min(2),
  // ❌ MISSING: customAmounts validation
  category: z.string().max(50).optional(),
  expenseDate: z.date().optional(),
});
```

**And in createExpense():**
```typescript
async createExpense(requestingUserId: string, input: unknown): Promise<SharedExpense> {
  const validated = CreateExpenseSchema.parse(input);
  
  // ❌ No check: do custom amounts sum to total?
  if (validated.splitType === 'custom') {
    // Missing validation that amounts sum to totalAmount
  }
  
  return this.repository.createExpense(...);
}
```

**Problems:**
1. Schema doesn't require `customAmounts` field for custom splits
2. No validation that custom amounts sum to total
3. Service accepts mismatched amounts silently
4. Example: totalAmount=$100, customAmounts={user1: $30, user2: $40} (sum=$70) accepted
5. Results in incorrect balance calculations; data integrity violation

**How I Detected:**
- Writing test case: "Create custom split with $100 total but only $70 in splits"
- Expected: ValidationError
- Actual: Expense created successfully (wrong!)
- Test failure showed validation gap

**How I Fixed:**
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
      logger.warn({ error: error.issues }, 'Validation failed for create expense');
      throw new ValidationError(error.issues[0].message);
    }
    throw error;
  }
  
  // ✅ Validate custom split amounts
  if (validated.splitType === 'custom') {
    if (!validated.customAmounts) {
      throw new ValidationError('Custom split requires customAmounts field');
    }
    
    const sum = Object.values(validated.customAmounts).reduce(
      (acc, amount) => acc.plus(amount),
      new Decimal(0),
    );
    
    if (!sum.equals(validated.totalAmount)) {
      throw new ValidationError(
        `Custom amounts ($${sum}) must equal total ($${validated.totalAmount})`,
      );
    }
  }
  
  return this.repository.createExpense(...);
}
```

**What I'd Do Differently:**
1. **Domain rules in prompt:**
   ```
   "BUSINESS RULE: For custom split, the amounts specified by users must sum exactly to totalAmount.
   Example: totalAmount=$100, customAmounts for 3 users must sum to $100 exactly.
   If sum < $100: ValidationError('Amounts underfund expense')
   If sum > $100: ValidationError('Amounts overfund expense')"
   ```

2. **Test-first validation:**
   ```
   "Test case 1: totalAmount=$100, customAmounts={user1: $40, user2: $60}
   Expected: Success (sum = $100)
   
   Test case 2: totalAmount=$100, customAmounts={user1: $30, user2: $40}
   Expected: ValidationError ('Amounts don't sum to total')"
   ```
   Then: "Implement validation to pass these tests."

3. **Add to Copilot instructions:**
   ```
   "For financial features:
   - Always validate that splits sum to total
   - Always validate amounts are positive
   - Always validate minimum participants (≥2)
   - Provide specific error messages with actual vs. expected values"
   ```

4. **Code review rule:**
   ```
   - [ ] For split/allocation features, test that invalid splits are rejected
   - [ ] For Decimal math, test exact values (not approximate)
   - [ ] For validation, test both valid and invalid boundary cases
   ```

**Lesson:** Copilot generates happy-path validation. Domain rules (amounts must sum, min participants, etc.) must be explicitly specified in prompt, tested, and added to project standards.

---

## Summary: Copilot Strengths & Limitations

### ⭐ Copilot Excels At:
1. **Scaffolding & Boilerplate** — Entity definitions, method signatures, imports
2. **Pattern Recognition** — Decorator repetition, similar method generation
3. **API Integration** — TypeORM, Express, Zod syntax
4. **Code Explanations** — TypeScript features, library usage
5. **Refactoring** — "Rewrite this to use async/await", "Add error handling"
6. **Documentation** — Generating JSDoc, comments (with human editing)

### ⚠️ Copilot Struggles With:
1. **Domain Logic** — Oversimplifies algorithms; needs explicit step-by-step specs
2. **Authorization** — Accepts parameters but forgets to use them; needs explicit "check before return"
3. **Business Rules** — Doesn't infer constraints (amounts must sum, minimum participants); must be stated
4. **Edge Cases** — Generates happy path; misses error cases unless listed in test spec
5. **Non-Functional Requirements** — Auditability, compliance, data retention not obvious

### 🎯 Best Use Cases:
- ✅ Generating CRUD boilerplate with validation schemas
- ✅ Writing tests with provided test cases (list all cases)
- ✅ Learning new libraries (Chat explanations)
- ✅ Refactoring to patterns (error handling, decorators)
- ✅ Creating standards documents (Copilot instructions)

### ❌ Requires Human Oversight:
- ❌ Authorization & security checks (test-driven + code review)
- ❌ Complex algorithms (explicit specs + test-driven)
- ❌ Business rule validation (test cases that fail first)
- ❌ Compliance/fintech rules (project standards + human review)
- ❌ Error handling on edge cases (explicit test list)

---

## Recommendations for Future Work

1. **Expand Copilot Instructions:** Add sections on:
   - Balance calculation for multi-party expenses
   - Settlement optimization (minimize payments)
   - Concurrent access patterns

2. **Test-Driven Development with Copilot:**
   - Always write test cases first
   - Ask Copilot to generate implementation from tests
   - Reduces mismatches between expected and generated behavior

3. **Code Review Discipline:**
   - Checklist for AI-generated code: authorization, validation, error handling
   - Pair review: one person reviews logic, one person reviews security
   - Run tests before approving (catch oversimplifications)

4. **Iterative Refinement:**
   - Don't assume first output is correct
   - Ask follow-up questions: "Handle case where...", "What if..."
   - Chat allows this conversational refinement

5. **Domain-Specific Prompting:**
   - Fintech: Always mention precision (Decimal), compliance (soft deletes), audit (logging)
   - Security: Always ask to verify authorization before returning data
   - Validation: Always ask what invalid inputs could break the logic

