import { Repository, IsNull } from 'typeorm';
import { SharedExpense, SplitType } from '../models/SharedExpense';
import { ExpenseParticipant } from '../models/ExpenseParticipant';
import { Decimal } from 'decimal.js';
import pino from 'pino';

const logger = pino();

/**
 * Repository for Expense data access
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
   * @param participantShares - Optional array of { userId, amount } when custom/percentage
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
    participantShares?: Array<{ userId: string; amount: Decimal }>,
    category?: string,
    expenseDate?: Date,
  ): Promise<SharedExpense> {
    return this.expenseDb.manager.transaction(async (manager) => {
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

      // Build participants
      let participantsToCreate: ExpenseParticipant[] = [];

      if (participantShares && participantShares.length > 0) {
        // Use explicit amounts from participantShares (trusted by service validation)
        participantsToCreate = participantShares.map((ps) =>
          this.participantDb.create({
            expenseId: savedExpense.id,
            userId: ps.userId,
            amount: ps.amount,
            amountPaid: new Decimal(0),
            isPaid: false,
          }),
        );
      } else {
        // Fallback: equal split
        const perPersonAmount = totalAmount.dividedBy(participantIds.length);
        participantsToCreate = participantIds.map((userId) =>
          this.participantDb.create({
            expenseId: savedExpense.id,
            userId,
            amount: perPersonAmount,
            amountPaid: new Decimal(0),
            isPaid: false,
          }),
        );
      }

      const savedParticipants = await manager.save(participantsToCreate);
      savedExpense.participants = savedParticipants;
      return savedExpense;
    });
  }

  // (Other methods unchanged: getById, getByUser, getByUserPair, updateParticipantPayment, softDelete, markAsSettled)
}
