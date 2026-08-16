import { Repository, IsNull, In } from 'typeorm';
import { SharedExpense, SplitType } from '../models/SharedExpense';
import { ExpenseParticipant } from '../models/ExpenseParticipant';
import { Decimal } from 'decimal.js';
import pino from 'pino';

const logger = pino();

/**
 * Repository for Expense data access
 * 
 * Handles:
 * - SharedExpense CRUD operations
 * - ExpenseParticipant management
 * - Balance calculations between users
 * - Expense queries and filtering
 */
export class ExpenseRepository {
  constructor(
    private expenseDb: Repository<SharedExpense>,
    private participantDb: Repository<ExpenseParticipant>,
  ) {}

  /**
   * Create a new shared expense with participants
   * @param creatorId - User creating the expense
   * @param description - Expense description
   * @param totalAmount - Total expense amount
   * @param splitType - How to split (equal/custom/percentage)
   * @param participantIds - User IDs participating
   * @param category - Optional category
   * @param expenseDate - Optional expense date
   * @returns Created SharedExpense with participants
   */
  async createExpense(
    creatorId: string,
    description: string,
    totalAmount: Decimal,
    splitType: SplitType,
    participantIds: string[],
    category?: string,
    expenseDate?: Date,
  ): Promise<SharedExpense> {
    return this.expenseDb.transaction(async (manager) => {
      // Create expense
      const expense = this.expenseDb.create({
        creatorId,
        description,
        totalAmount,
        splitType,
        category: category || null,
        expenseDate: expenseDate || null,
        isSettled: false,
      });

      const savedExpense = await manager.save(expense);

      // Create participants with equal split by default
      const perPersonAmount = totalAmount.dividedBy(participantIds.length);
      const participants = participantIds.map((userId) =>
        this.participantDb.create({
          expenseId: savedExpense.id,
          userId,
          amount: perPersonAmount,
          amountPaid: new Decimal(0),
          isPaid: false,
        }),
      );

      savedExpense.participants = await manager.save(participants);
      return savedExpense;
    });
  }

  /**
   * Get a shared expense by ID
   * @param id - Expense ID
   * @returns Expense if found and not deleted
   */
  async getById(id: string): Promise<SharedExpense | null> {
    return this.expenseDb.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
      relations: ['participants'],
    });
  }

  /**
   * Get all expenses for a user (as creator or participant)
   * @param userId - User ID
   * @returns Array of expenses
   */
  async getByUser(userId: string): Promise<SharedExpense[]> {
    return this.expenseDb.find({
      where: { deletedAt: IsNull() },
      relations: ['participants'],
    });
    // Note: Filtered by userId in service layer for authorization
  }

  /**
   * Get all expenses between two users
   * @param userId1 - First user
   * @param userId2 - Second user
   * @returns Expenses involving both users
   */
  async getByUserPair(userId1: string, userId2: string): Promise<SharedExpense[]> {
    return this.expenseDb.find({
      where: { deletedAt: IsNull() },
      relations: ['participants'],
    });
    // Note: Filtered in service layer
  }

  /**
   * Update participant payment status
   * @param participantId - Participant ID
   * @param amountPaid - New amount paid
   * @returns Updated participant
   */
  async updateParticipantPayment(
    participantId: string,
    amountPaid: Decimal,
  ): Promise<ExpenseParticipant> {
    const participant = await this.participantDb.findOneOrFail({
      where: { id: participantId },
    });

    participant.amountPaid = amountPaid;
    participant.isPaid = amountPaid.gte(participant.amount);

    return this.participantDb.save(participant);
  }

  /**
   * Soft-delete an expense
   * @param id - Expense ID
   * @returns true if deleted
   */
  async softDelete(id: string): Promise<boolean> {
    const result = await this.expenseDb.softDelete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Mark expense as settled (all participants paid)
   * @param id - Expense ID
   */
  async markAsSettled(id: string): Promise<void> {
    await this.expenseDb.update({ id }, { isSettled: true });
  }
}
