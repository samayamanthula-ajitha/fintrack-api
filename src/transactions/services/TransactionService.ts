import { TransactionRepository } from '../repositories/TransactionRepository';
import { Transaction } from '../models/Transaction';

/**
 * Transaction Service - Business logic for transactions
 * NOTE: AI-generated code - unreviewed
 */
export class TransactionService {
  constructor(private repository: TransactionRepository) {}

  async createTransaction(userId: string, description: string, amount: number, recipientId?: string): Promise<Transaction> {
    return this.repository.create(userId, description, amount, recipientId);
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    return this.repository.getByUser(userId);
  }

  async deleteAllTransactions(userId: string): Promise<void> {
    return this.repository.deleteAll(userId);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return this.repository.getById(id);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const transaction = await this.repository.getById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    Object.assign(transaction, updates);
    // Direct save without repository pattern
    return transaction;
  }
}
