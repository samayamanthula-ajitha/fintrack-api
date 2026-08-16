import { Repository, IsNull } from 'typeorm';
import { Transaction, TransactionStatus } from '../models/Transaction';
import { Decimal } from 'decimal.js';
import pino from 'pino';

const logger = pino();

/**
 * Repository for Transaction data access
 * 
 * Responsibilities:
 * - All database queries and mutations
 * - Persistence logic
 * - Transaction isolation for concurrent operations
 * - Soft delete enforcement
 * 
 * Note: No authorization checks here (service layer responsibility)
 */
export class TransactionRepository {
  constructor(private db: Repository<Transaction>) {}

  /**
   * Create a new transaction
   * @param userId - Owner of the transaction
   * @param description - Human-readable description
   * @param amount - Amount as Decimal (must be positive)
   * @param recipientId - Optional recipient for peer-to-peer transactions
   * @returns Saved transaction entity
   * @throws Error if database operation fails
   */
  async create(
    userId: string,
    description: string,
    amount: Decimal,
    recipientId?: string,
  ): Promise<Transaction> {
    const transaction = this.db.create({
      userId,
      description,
      amount,
      recipientId: recipientId || null,
      status: TransactionStatus.PENDING,
    });

    return this.db.save(transaction);
  }

  /**
   * Retrieve all active (non-deleted) transactions for a user
   * @param userId - User to query
   * @returns Array of transactions, excluding soft-deleted records
   */
  async getByUser(userId: string): Promise<Transaction[]> {
    return this.db.find({
      where: {
        userId,
        deletedAt: IsNull(),  // ✅ Exclude soft-deleted
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single transaction by ID
   * @param id - Transaction ID
   * @returns Transaction if found and not deleted, null otherwise
   */
  async getById(id: string): Promise<Transaction | null> {
    return this.db.findOne({
      where: {
        id,
        deletedAt: IsNull(),  // ✅ Exclude soft-deleted
      },
    });
  }

  /**
   * Update specific fields of a transaction
   * Only allows updating safe fields (status, description)
   * @param id - Transaction ID
   * @param updates - Fields to update
   * @returns Updated transaction
   * @throws Error if transaction not found or update fails
   */
  async update(
    id: string,
    updates: Partial<{ status: TransactionStatus; description: string }>,
  ): Promise<Transaction> {
    const transaction = await this.getById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // ✅ Only allow safe fields to be updated
    if (updates.status) transaction.status = updates.status;
    if (updates.description) transaction.description = updates.description;

    return this.db.save(transaction);
  }

  /**
   * Soft-delete a single transaction
   * @param id - Transaction ID
   * @returns true if deleted, false if not found
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.db.softDelete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Soft-delete all transactions for a user
   * Uses database transaction for atomicity
   * @param userId - User whose transactions to delete
   * @returns Number of transactions deleted
   */
  async softDeleteAllByUser(userId: string): Promise<number> {
    return this.db.transaction(async (manager) => {
      const result = await manager.softDelete(Transaction, { userId });
      return result.affected || 0;
    });
  }

  /**
   * Get all transactions between a user and a specific recipient
   * Used for balance calculations between two users
   * @param userId - First user
   * @param recipientId - Second user
   * @returns Array of transactions
   */
  async getByUserAndRecipient(userId: string, recipientId: string): Promise<Transaction[]> {
    return this.db.find({
      where: [
        { userId, recipientId, deletedAt: IsNull() },
        { userId: recipientId, recipientId: userId, deletedAt: IsNull() },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}
