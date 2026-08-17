Transaction and Expense Splitting modules follow a layered architecture:

Controller -> Service -> Repository -> Model (TypeORM entities).
Controllers handle HTTP, parsing, auth and response formatting.
Services contain business rules, validation (Zod), authorization checks and logging.
Repositories encapsulate all DB access via TypeORM, use transactions for multi-step writes.
Data flow:

HTTP request -> Controller extracts userId (auth middleware) and normalizes inputs -> Service validates and enforces rules -> Repository persists entities -> Service returns domain objects -> Controller formats API response.
Why this suits fintech:

Clear separation of concerns improves auditability and testability.
Decimal-based money handling + DB transformers preserve precision for regulatory compliance.
Soft deletes and structured logging provide an auditable trail for compliance and forensics.
Key decisions:

Decimal.js + TypeORM ValueTransformer to avoid float rounding.
Soft deletes (DeleteDateColumn) to retain records for required retention windows.
Service-level authorization (requestingUserId param) prevents data leaks and centralizes security checks.
