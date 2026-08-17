import { ExpenseService, ValidationError } from '../src/expenses/services/ExpenseService';
import { ExpenseRepository } from '../src/expenses/repositories/ExpenseRepository';
import { SharedExpense, SplitType } from '../src/expenses/models/SharedExpense';
import { ExpenseParticipant } from '../src/expenses/models/ExpenseParticipant';
import { Decimal } from 'decimal.js';

describe('Expense feature tests (missing cases)', () => {
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

  it('equal split among 3 participants - should create with equal shares', async () => {
    const creatorId = '550e8400-e29b-41d4-a716-446655440000';
    const user2 = '660e8400-e29b-41d4-a716-446655440001';
    const user3 = '770e8400-e29b-41d4-a716-446655440002';
    const participantIds = [creatorId, user2, user3];
    const totalAmount = new Decimal('90.00');

    const perPerson = new Decimal('30.00');

    const mockExpense: SharedExpense = {
      id: 'e1',
      creatorId,
      description: 'Dinner',
      totalAmount,
      splitType: SplitType.EQUAL,
      category: 'food',
      expenseDate: null,
      isSettled: false,
      participants: participantIds.map((u, i) => ({
        id: `p${i + 1}`,
        expenseId: 'e1',
        userId: u,
        amount: perPerson,
        amountPaid: new Decimal(0),
        isPaid: false,
        expense: null as any,
        createdAt: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockRepository.createExpense.mockResolvedValue(mockExpense);

    const result = await service.createExpense(creatorId, {
      description: 'Dinner',
      totalAmount,
      participantIds,
      splitType: SplitType.EQUAL,
    } as any);

    expect(result).toEqual(mockExpense);
    expect(mockRepository.createExpense).toHaveBeenCalledWith(
      creatorId,
      'Dinner',
      totalAmount,
      SplitType.EQUAL,
      participantIds,
      expect.any(Array),
      undefined,
      undefined,
    );
  });

  it('custom split with amounts that match the total should succeed', async () => {
    const creatorId = '550e8400-e29b-41d4-a716-446655440000';
    const user2 = '660e8400-e29b-41d4-a716-446655440001';
    const participantIds = [creatorId, user2];
    const totalAmount = new Decimal('100.00');

    const customAmounts = {
      [creatorId]: new Decimal('40.00'),
      [user2]: new Decimal('60.00'),
    };

    const mockExpense: SharedExpense = {
      id: 'e2',
      creatorId,
      description: 'Custom Dinner',
      totalAmount,
      splitType: SplitType.CUSTOM,
      category: null,
      expenseDate: null,
      isSettled: false,
      participants: participantIds.map((u, i) => ({
        id: `pc${i + 1}`,
        expenseId: 'e2',
        userId: u,
        amount: customAmounts[u],
        amountPaid: new Decimal(0),
        isPaid: false,
        expense: null as any,
        createdAt: new Date(),
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockRepository.createExpense.mockResolvedValue(mockExpense);

    const result = await service.createExpense(creatorId, {
      description: 'Custom Dinner',
      totalAmount,
      participantIds,
      splitType: SplitType.CUSTOM,
      customAmounts,
    } as any);

    expect(result).toEqual(mockExpense);
    // Expect repository called with participantShares matching custom amounts
    expect(mockRepository.createExpense).toHaveBeenCalledWith(
      creatorId,
      'Custom Dinner',
      totalAmount,
      SplitType.CUSTOM,
      participantIds,
      [
        { userId: creatorId, amount: customAmounts[creatorId] },
        { userId: user2, amount: customAmounts[user2] },
      ],
      undefined,
      undefined,
    );
  });

  it('custom split where amounts do not sum correctly should fail validation', async () => {
    const creatorId = '550e8400-e29b-41d4-a716-446655440000';
    const user2 = '660e8400-e29b-41d4-a716-446655440001';
    const participantIds = [creatorId, user2];
    const totalAmount = new Decimal('100.00');

    const badCustomAmounts = {
      [creatorId]: new Decimal('30.00'),
      [user2]: new Decimal('40.00'),
    };

    await expect(
      service.createExpense(creatorId, {
        description: 'Bad Custom',
        totalAmount,
        participantIds,
        splitType: SplitType.CUSTOM,
        customAmounts: badCustomAmounts,
      } as any),
    ).rejects.toThrow(ValidationError);

    expect(mockRepository.createExpense).not.toHaveBeenCalled();
  });

  it('net balance calculation between two users with multiple shared expenses', async () => {
    const userA = 'a1';
    const userB = 'b1';

    // Expense 1: A created, B owes 30
    const expense1: SharedExpense = {
      id: 's1',
      creatorId: userA,
      description: 'Lunch',
      totalAmount: new Decimal('30.00'),
      splitType: SplitType.EQUAL,
      category: 'food',
      expenseDate: null,
      isSettled: false,
      participants: [
        { id: 'pa1', expenseId: 's1', userId: userA, amount: new Decimal('15.00'), amountPaid: new Decimal(15), isPaid: true, expense: null as any, createdAt: new Date() },
        { id: 'pb1', expenseId: 's1', userId: userB, amount: new Decimal('15.00'), amountPaid: new Decimal(0), isPaid: false, expense: null as any, createdAt: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    // Expense 2: B created, A owes 10
    const expense2: SharedExpense = {
      id: 's2',
      creatorId: userB,
      description: 'Taxi',
      totalAmount: new Decimal('20.00'),
      splitType: SplitType.EQUAL,
      category: 'transport',
      expenseDate: null,
      isSettled: false,
      participants: [
        { id: 'pa2', expenseId: 's2', userId: userA, amount: new Decimal('10.00'), amountPaid: new Decimal(0), isPaid: false, expense: null as any, createdAt: new Date() },
        { id: 'pb2', expenseId: 's2', userId: userB, amount: new Decimal('10.00'), amountPaid: new Decimal(10), isPaid: true, expense: null as any, createdAt: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockRepository.getByUserPair.mockResolvedValue([expense1, expense2]);

    const balance = await service.calculateBalance(userA, userB);

    expect(balance.toFixed(2)).toBe(new Decimal(5).toFixed(2));
  });
});
