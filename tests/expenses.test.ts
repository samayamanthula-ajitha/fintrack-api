import { ExpenseService, ValidationError, NotFoundError, ForbiddenError } from '../src/expenses/services/ExpenseService';
import { ExpenseRepository } from '../src/expenses/repositories/ExpenseRepository';
import { SharedExpense, SplitType } from '../src/expenses/models/SharedExpense';
import { ExpenseParticipant } from '../src/expenses/models/ExpenseParticipant';
import { Decimal } from 'decimal.js';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let mockRepository: jest.Mocked<ExpenseRepository>;

  beforeEach(() => {
    mockRepository = {
      createExpense: jest.fn(),
      getById: jest.fn(),
      getByUser: jest.fn(),
      getByUserPair: jest.fn(),
      updateParticipantPayment: jest.fn(),
      softDelete: jest.fn(),
      markAsSettled: jest.fn(),
    } as any;

    service = new ExpenseService(mockRepository);
  });

  describe('createExpense', () => {
    it('should create an expense with valid inputs', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const participantIds = [creatorId, userId2];
      const totalAmount = new Decimal('100.00');

      const mockExpense: SharedExpense = {
        id: '770e8400-e29b-41d4-a716-446655440000',
        creatorId,
        description: 'Dinner',
        totalAmount,
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [
          {
            id: '1',
            expenseId: '770e8400-e29b-41d4-a716-446655440000',
            userId: creatorId,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
          {
            id: '2',
            expenseId: '770e8400-e29b-41d4-a716-446655440000',
            userId: userId2,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.createExpense.mockResolvedValue(mockExpense);

      const result = await service.createExpense(creatorId, {
        description: 'Dinner',
        totalAmount,
        participantIds,
        category: 'food',
      });

      expect(result).toEqual(mockExpense);
      expect(mockRepository.createExpense).toHaveBeenCalled();
    });

    it('should throw ValidationError if amount is negative', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';

      await expect(
        service.createExpense(creatorId, {
          description: 'Dinner',
          totalAmount: new Decimal('-100.00'),
          participantIds: [creatorId, userId2],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if creator not in participants', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const userId3 = '770e8400-e29b-41d4-a716-446655440002';

      await expect(
        service.createExpense(creatorId, {
          description: 'Dinner',
          totalAmount: new Decimal('100.00'),
          participantIds: [userId2, userId3],  // creatorId not included
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if less than 2 participants', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        service.createExpense(creatorId, {
          description: 'Dinner',
          totalAmount: new Decimal('100.00'),
          participantIds: [creatorId],  // Only one
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getExpense', () => {
    it('should return expense if user is creator', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const expenseId = '770e8400-e29b-41d4-a716-446655440000';

      const mockExpense: SharedExpense = {
        id: expenseId,
        creatorId,
        description: 'Dinner',
        totalAmount: new Decimal('100.00'),
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [
          {
            id: '1',
            expenseId,
            userId: creatorId,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
          {
            id: '2',
            expenseId,
            userId: userId2,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockExpense);

      const result = await service.getExpense(creatorId, expenseId);

      expect(result).toEqual(mockExpense);
    });

    it('should return expense if user is participant', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const expenseId = '770e8400-e29b-41d4-a716-446655440000';

      const mockExpense: SharedExpense = {
        id: expenseId,
        creatorId,
        description: 'Dinner',
        totalAmount: new Decimal('100.00'),
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [
          {
            id: '1',
            expenseId,
            userId: creatorId,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
          {
            id: '2',
            expenseId,
            userId: userId2,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockExpense);

      const result = await service.getExpense(userId2, expenseId);

      expect(result).toEqual(mockExpense);
    });

    it('should throw NotFoundError if expense does not exist', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const expenseId = '770e8400-e29b-41d4-a716-446655440000';

      mockRepository.getById.mockResolvedValue(null);

      await expect(service.getExpense(userId, expenseId)).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not involved', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const userId3 = '770e8400-e29b-41d4-a716-446655440002';
      const expenseId = '880e8400-e29b-41d4-a716-446655440000';

      const mockExpense: SharedExpense = {
        id: expenseId,
        creatorId,
        description: 'Dinner',
        totalAmount: new Decimal('100.00'),
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [
          {
            id: '1',
            expenseId,
            userId: creatorId,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
          {
            id: '2',
            expenseId,
            userId: userId2,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockExpense);

      await expect(service.getExpense(userId3, expenseId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteExpense', () => {
    it('should delete expense if user is creator', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const expenseId = '770e8400-e29b-41d4-a716-446655440000';

      const mockExpense: SharedExpense = {
        id: expenseId,
        creatorId,
        description: 'Dinner',
        totalAmount: new Decimal('100.00'),
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockExpense);
      mockRepository.softDelete.mockResolvedValue(true);

      await expect(service.deleteExpense(creatorId, expenseId)).resolves.not.toThrow();
      expect(mockRepository.softDelete).toHaveBeenCalledWith(expenseId);
    });

    it('should throw ForbiddenError if user is not creator', async () => {
      const creatorId = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const expenseId = '770e8400-e29b-41d4-a716-446655440000';

      const mockExpense: SharedExpense = {
        id: expenseId,
        creatorId,
        description: 'Dinner',
        totalAmount: new Decimal('100.00'),
        splitType: SplitType.EQUAL,
        category: 'food',
        expenseDate: null,
        isSettled: false,
        participants: [
          {
            id: '1',
            expenseId,
            userId: creatorId,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
          {
            id: '2',
            expenseId,
            userId: userId2,
            amount: new Decimal('50.00'),
            amountPaid: new Decimal('0'),
            isPaid: false,
            expense: null as any,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockExpense);

      await expect(service.deleteExpense(userId2, expenseId)).rejects.toThrow(ForbiddenError);
    });
  });
});
