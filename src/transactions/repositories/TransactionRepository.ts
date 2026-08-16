import { Repository } from 'typeorm';
import { Transaction } from '../models/Transaction';

/**
 * Transaction Repository - Handles database operations for transactions
 * NOTE: AI-generated code - unreviewed
 */
export class TransactionRepository {
  constructor(private db: Repository<Transaction>) {}

  async create(userId: string, description: string, amount: number, recipientId?: string): Promise<Transaction> {
    const transaction = this.db.create({
      userId,
      description,
      amount,
      recipientId,
    });
    return this.db.save(transaction);
  }

  async getByUser(userId: string): Promise<Transaction[]> {
    return this.db.find({ where: { userId } });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.delete({ userId });
  }

  async getById(id: string): Promise<Transaction | null> {
    return this.db.findOne({ where: { id } });
  }
}
