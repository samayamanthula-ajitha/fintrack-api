# FinTrack API - Expense Splitting Feature

## Technology Stack

**Backend:**
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript 5.x
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 15+
- **ORM:** TypeORM 0.3.x
- **Validation:** Zod
- **Testing:** Jest + Supertest
- **Logging:** Pino
- **Security:** Helmet, bcrypt, jsonwebtoken

**Development Tools:**
- ESLint + Prettier
- dotenv for environment management
- ts-node for development

## Features

### Transaction Module (Remediated)
- Create, retrieve, and delete transactions
- User-owned transaction isolation
- Audit logging
- Input validation & error handling

### Expense Splitting Feature
- Create shared expenses with equal/custom splits
- Track pending balances between users
- Net balance calculation
- Participant management

## Project Structure

```
fintrack-api/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── transactions/
│   │   ├── models/
│   │   │   └── Transaction.ts
│   │   ├── repositories/
│   │   │   └── TransactionRepository.ts
│   │   ├── services/
│   │   │   └── TransactionService.ts
│   │   └── controllers/
│   │       └── TransactionController.ts
│   ├── expenses/
│   │   ├── models/
│   │   │   ├── SharedExpense.ts
│   │   │   └── ExpenseParticipant.ts
│   │   ├── repositories/
│   │   │   └── ExpenseRepository.ts
│   │   ├── services/
│   │   │   └── ExpenseService.ts
│   │   └── controllers/
│   │       └── ExpenseController.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── database.ts
│   └── server.ts
├── tests/
│   ├── transactions.test.ts
│   └── expenses.test.ts
├── REVIEW.md
├── PROMPTS.md
├── PR_DESCRIPTION.md
├── TOOL_STRATEGY.md
├── ARCHITECTURE.md
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Getting Started

```bash
npm install
npm run dev        # Start development server
npm test           # Run tests
npm run build      # Build for production
```

## Documentation

- **REVIEW.md** - Transaction module code review
- **ARCHITECTURE.md** - System architecture & design decisions
- **PROMPTS.md** - Copilot prompt engineering documentation
- **PR_DESCRIPTION.md** - Pull request summary & peer review
- **TOOL_STRATEGY.md** - Copilot usage patterns & limitations
