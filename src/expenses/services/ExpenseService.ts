import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { SharedExpense, SplitType } from '../models/SharedExpense';
import { ExpenseParticipant } from '../models/ExpenseParticipant';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import pino from 'pino';

const logger = pino();

/**
 * Custom error types
 */
export class ValidationError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Expense not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Input validation schemas
 */
const CreateExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  totalAmount: z.instanceof(Decimal).refine((val) => val.isPositive(), 'Amount must be positive'),
  splitType: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  participantIds: z.array(z.string().uuid()).min(2, 'Need at least 2 participants'),
  category: z.string().max(50).optional(),
  expenseDate: z.date().optional(),
});

export type CreateExpenseDTO = z.infer<typeof CreateExpenseSchema>;

/**
 * Expense Service - Business logic for shared expenses
 * 
 * Responsibilities:
 * - Create shared expenses with participant splits
 * - Track balances between users
 * - Calculate who owes whom
 * - Handle payment settlements
 * - Authorization and audit logging
 */
export class ExpenseService {
  constructor(private repository: ExpenseRepository) {}

  /**
   * Create a shared expense
   * @param requestingUserId - User creating the expense (will be creator)
   * @param input - Expense details
   * @returns Created SharedExpense
   * @throws {ValidationError} If input is invalid
   */
  async createExpense(requestingUserId: string, input: unknown): Promise<SharedExpense> {
    // Validate input
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

    // Ensure requesting user is a participant
    if (!validated.participantIds.includes(requestingUserId)) {
      throw new ValidationError('Creator must be a participant');
    }

    logger.info(
      {
        creatorId: requestingUserId,
        amount: validated.totalAmount.toString(),
        participantCount: validated.participantIds.length,
        action: 'expense_create',
      },
      'Creating shared expense',
    );

    try {
      const expense = await this.repository.createExpense(
        requestingUserId,
        validated.description,
        validated.totalAmount,
        validated.splitType as SplitType,
        validated.participantIds,
        validated.category,
        validated.expenseDate,
      );

      logger.info(
        { expenseId: expense.id, creatorId: requestingUserId },
        'Expense created successfully',
      );

      return expense;
    } catch (error) {
      logger.error(
        { error: (error as Error).message, creatorId: requestingUserId },
        'Failed to create expense',
      );
      throw error;
    }
  }

  /**
   * Get expense details
   * @param requestingUserId - User requesting
   * @param expenseId - Expense ID
   * @returns SharedExpense if user is participant or creator
   * @throws {NotFoundError} If not found
   * @throws {ForbiddenError} If user not involved
   */
  async getExpense(requestingUserId: string, expenseId: string): Promise<SharedExpense> {
    const expense = await this.repository.getById(expenseId);

    if (!expense) {
      throw new NotFoundError();
    }

    // Verify user is creator or participant
    const isCreator = expense.creatorId === requestingUserId;
    const isParticipant = expense.participants.some((p) => p.userId === requestingUserId);

    if (!isCreator && !isParticipant) {
      logger.warn(
        { userId: requestingUserId, expenseId },
        'Unauthorized access to expense',
      );
      throw new ForbiddenError('Cannot access this expense');
    }

    return expense;
  }

  /**
   * Calculate net balance between two users
   * Positive = user1 owes user2; Negative = user2 owes user1
   * @param user1Id - First user
   * @param user2Id - Second user
   * @returns Net balance in cents
   */
  async calculateBalance(user1Id: string, user2Id: string): Promise<Decimal> {
    const expenses = await this.repository.getByUserPair(user1Id, user2Id);

    let balance = new Decimal(0);

    for (const expense of expenses) {
      // Find participants
      const user1Participant = expense.participants.find((p) => p.userId === user1Id);
      const user2Participant = expense.participants.find((p) => p.userId === user2Id);

      if (!user1Participant || !user2Participant) continue;

      // Who paid? (assume creator paid for now, advanced: track actual payer)
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

  /**
   * Record a payment from one user to another
   * @param requestingUserId - User making the payment
   * @param expenseId - Expense ID to pay towards
   * @param amount - Amount being paid
   * @throws {NotFoundError} If expense not found
   * @throws {ForbiddenError} If user not a participant
   */
  async recordPayment(
    requestingUserId: string,
    expenseId: string,
    amount: Decimal,
  ): Promise<void> {
    // Verify user can access expense
    const expense = await this.getExpense(requestingUserId, expenseId);

    // Find user's participant record
    const participant = expense.participants.find((p) => p.userId === requestingUserId);
    if (!participant) {
      throw new ForbiddenError('You are not a participant in this expense');
    }

    if (amount.isNegative() || amount.isZero()) {
      throw new ValidationError('Payment amount must be positive');
    }

    const newAmountPaid = participant.amountPaid.plus(amount);
    if (newAmountPaid.gt(participant.amount)) {
      throw new ValidationError('Payment exceeds amount owed');
    }

    logger.info(
      {
        userId: requestingUserId,
        expenseId,
        amount: amount.toString(),
        action: 'payment_recorded',
      },
      'Recording payment',
    );

    try {
      await this.repository.updateParticipantPayment(participant.id, newAmountPaid);

      // Check if all participants settled
      const allSettled = expense.participants.every((p) =>
        p.amountPaid.gte(p.amount),
      );

      if (allSettled) {
        await this.repository.markAsSettled(expenseId);
        logger.info({ expenseId }, 'Expense fully settled');
      }
    } catch (error) {
      logger.error(
        { error: (error as Error).message, expenseId },
        'Failed to record payment',
      );
      throw error;
    }
  }

  /**
   * Delete an expense
   * @param requestingUserId - User deleting
   * @param expenseId - Expense ID
   * @throws {NotFoundError} If not found
   * @throws {ForbiddenError} If user is not creator
   */
  async deleteExpense(requestingUserId: string, expenseId: string): Promise<void> {
    const expense = await this.getExpense(requestingUserId, expenseId);

    // Only creator can delete
    if (expense.creatorId !== requestingUserId) {
      throw new ForbiddenError('Only creator can delete expense');
    }

    logger.info(
      { userId: requestingUserId, expenseId, action: 'expense_delete' },
      'Deleting expense',
    );

    try {
      await this.repository.softDelete(expenseId);
      logger.info({ expenseId }, 'Expense deleted successfully');
    } catch (error) {
      logger.error(
        { error: (error as Error).message, expenseId },
        'Failed to delete expense',
      );
      throw error;
    }
  }
}
