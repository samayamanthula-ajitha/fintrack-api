import { TransactionRepository } from '../repositories/TransactionRepository';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Decimal } from 'decimal.js';
import { z } from 'zod';
import pino from 'pino';

const logger = pino();

/**
 * Custom error types for specific error handling
 */
export class ValidationError extends Error {
  constructor(public message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Transaction not found') {
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
const CreateTransactionSchema = z.object({
  description: z.string().min(1, 'Description required').max(255, 'Description too long'),
  amount: z
    .instanceof(Decimal)
    .refine((val) => val.isPositive(), 'Amount must be positive'),
  recipientId: z.string().uuid('Invalid recipient ID').optional(),
});

const UpdateTransactionSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  description: z.string().max(255).optional(),
});

export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

/**
 * Transaction Service - Business logic layer
 * 
 * Responsibilities:
 * - Input validation
 * - Authorization checks (verify user ownership)
 * - Business logic (calculations, state management)
 * - Error handling with typed errors
 * - Audit logging for compliance
 */
export class TransactionService {
  constructor(private repository: TransactionRepository) {}

  /**
   * Create a new transaction
   * @param requestingUserId - ID of user making the request (for authorization)
   * @param targetUserId - ID of user who owns the transaction
   * @param input - Transaction data (description, amount, recipientId)
   * @returns Created transaction
   * @throws {ValidationError} If input is invalid
   * @throws {ForbiddenError} If user lacks authorization
   */
  async createTransaction(
    requestingUserId: string,
    targetUserId: string,
    input: unknown,
  ): Promise<Transaction> {
    // ✅ Authorization check
    this.verifyUserOwnership(requestingUserId, targetUserId);

    // ✅ Input validation
    let validated: CreateTransactionDTO;
    try {
      validated = CreateTransactionSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn(
          { error: error.issues, userId: requestingUserId },
          'Validation failed for create transaction',
        );
        throw new ValidationError(error.issues[0].message, error.issues[0].path[0] as string);
      }
      throw error;
    }

    // ✅ Create and log
    logger.info(
      {
        userId: targetUserId,
        amount: validated.amount.toString(),
        action: 'transaction_create',
      },
      'Creating transaction',
    );

    try {
      const transaction = await this.repository.create(
        targetUserId,
        validated.description,
        validated.amount,
        validated.recipientId,
      );

      logger.info(
        { transactionId: transaction.id, userId: targetUserId },
        'Transaction created successfully',
      );

      return transaction;
    } catch (error) {
      logger.error(
        { error: (error as Error).message, userId: targetUserId },
        'Failed to create transaction',
      );
      throw error;
    }
  }

  /**
   * Retrieve all transactions for a user
   * @param requestingUserId - ID of user making the request
   * @param targetUserId - ID of user whose transactions to retrieve
   * @returns Array of transactions
   * @throws {ForbiddenError} If user lacks authorization
   */
  async getTransactionsByUser(requestingUserId: string, targetUserId: string): Promise<Transaction[]> {
    // ✅ Authorization check
    this.verifyUserOwnership(requestingUserId, targetUserId);

    logger.debug(
      { userId: targetUserId, action: 'transaction_list' },
      'Fetching transactions for user',
    );

    return this.repository.getByUser(targetUserId);
  }

  /**
   * Get a specific transaction by ID
   * @param requestingUserId - ID of user making the request
   * @param transactionId - ID of transaction to retrieve
   * @returns Transaction if found
   * @throws {NotFoundError} If transaction doesn't exist
   * @throws {ForbiddenError} If user doesn't own the transaction
   */
  async getTransactionById(requestingUserId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.repository.getById(transactionId);

    if (!transaction) {
      logger.warn(
        { transactionId, userId: requestingUserId },
        'Transaction not found',
      );
      throw new NotFoundError();
    }

    // ✅ Verify ownership
    this.verifyUserOwnership(requestingUserId, transaction.userId);

    return transaction;
  }

  /**
   * Update a transaction's status or description
   * @param requestingUserId - ID of user making the request
   * @param transactionId - ID of transaction to update
   * @param input - Fields to update
   * @returns Updated transaction
   * @throws {ValidationError} If input is invalid
   * @throws {NotFoundError} If transaction doesn't exist
   * @throws {ForbiddenError} If user lacks authorization
   */
  async updateTransaction(
    requestingUserId: string,
    transactionId: string,
    input: unknown,
  ): Promise<Transaction> {
    // ✅ Validate input
    let validated: UpdateTransactionDTO;
    try {
      validated = UpdateTransactionSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.issues[0].message);
      }
      throw error;
    }

    // ✅ Get and verify ownership
    const transaction = await this.getTransactionById(requestingUserId, transactionId);

    logger.info(
      { transactionId, userId: requestingUserId, action: 'transaction_update' },
      'Updating transaction',
    );

    try {
      return await this.repository.update(transactionId, validated);
    } catch (error) {
      logger.error(
        { error: (error as Error).message, transactionId },
        'Failed to update transaction',
      );
      throw error;
    }
  }

  /**
   * Delete (soft-delete) a single transaction
   * @param requestingUserId - ID of user making the request
   * @param transactionId - ID of transaction to delete
   * @throws {NotFoundError} If transaction doesn't exist
   * @throws {ForbiddenError} If user lacks authorization
   */
  async deleteTransaction(requestingUserId: string, transactionId: string): Promise<void> {
    // ✅ Verify ownership first
    await this.getTransactionById(requestingUserId, transactionId);

    logger.info(
      { transactionId, userId: requestingUserId, action: 'transaction_delete' },
      'Deleting transaction',
    );

    try {
      const deleted = await this.repository.softDelete(transactionId);
      if (!deleted) {
        throw new NotFoundError();
      }

      logger.info({ transactionId }, 'Transaction deleted successfully');
    } catch (error) {
      logger.error(
        { error: (error as Error).message, transactionId },
        'Failed to delete transaction',
      );
      throw error;
    }
  }

  /**
   * Delete all transactions for a user
   * Dangerous operation - use with caution
   * @param requestingUserId - ID of user making the request
   * @param targetUserId - ID of user whose transactions to delete
   * @returns Number of transactions deleted
   * @throws {ForbiddenError} If user lacks authorization
   */
  async deleteAllTransactionsForUser(
    requestingUserId: string,
    targetUserId: string,
  ): Promise<number> {
    // ✅ Only user can delete their own transactions
    this.verifyUserOwnership(requestingUserId, targetUserId);

    logger.warn(
      { userId: targetUserId, action: 'transaction_delete_all' },
      'Bulk deleting all transactions for user',
    );

    try {
      const deleted = await this.repository.softDeleteAllByUser(targetUserId);

      logger.info(
        { userId: targetUserId, count: deleted },
        'Bulk delete completed',
      );

      return deleted;
    } catch (error) {
      logger.error(
        { error: (error as Error).message, userId: targetUserId },
        'Failed to bulk delete transactions',
      );
      throw error;
    }
  }

  /**
   * Helper: Verify that requestingUser owns targetUser's resources
   * @param requestingUserId - User making the request
   * @param targetUserId - User whose resource is being accessed
   * @throws {ForbiddenError} If users don't match
   */
  private verifyUserOwnership(requestingUserId: string, targetUserId: string): void {
    if (requestingUserId !== targetUserId) {
      logger.warn(
        { requestingUserId, targetUserId },
        'Authorization check failed - user mismatch',
      );
      throw new ForbiddenError('Cannot access other user\'s transactions');
    }
  }
}
