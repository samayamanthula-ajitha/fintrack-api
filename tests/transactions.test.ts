import { TransactionService, ValidationError, NotFoundError, ForbiddenError } from '../src/transactions/services/TransactionService';
import { TransactionRepository } from '../src/transactions/repositories/TransactionRepository';
import { Transaction, TransactionStatus } from '../src/transactions/models/Transaction';
import { Decimal } from 'decimal.js';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      getByUser: jest.fn(),
      getById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      softDeleteAllByUser: jest.fn(),
      getByUserAndRecipient: jest.fn(),
    } as any;

    service = new TransactionService(mockRepository);
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid inputs', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTransaction: Transaction = {
        id: '660e8400-e29b-41d4-a716-446655440000',
        userId,
        description: 'Groceries',
        amount: new Decimal('50.00'),
        status: TransactionStatus.PENDING,
        recipientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.create.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(userId, userId, {
        description: 'Groceries',
        amount: new Decimal('50.00'),
      });

      expect(result).toEqual(mockTransaction);
      expect(mockRepository.create).toHaveBeenCalledWith(
        userId,
        'Groceries',
        new Decimal('50.00'),
        undefined,
      );
    });

    it('should throw ValidationError for negative amount', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        service.createTransaction(userId, userId, {
          description: 'Test',
          amount: new Decimal('-50.00'),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ForbiddenError when user tries to create for another user', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';

      await expect(
        service.createTransaction(userId1, userId2, {
          description: 'Test',
          amount: new Decimal('50.00'),
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError for invalid description', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        service.createTransaction(userId, userId, {
          description: '',  // Empty
          amount: new Decimal('50.00'),
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getTransactionsByUser', () => {
    it('should return transactions for authorized user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const mockTransactions: Transaction[] = [
        {
          id: '1',
          userId,
          description: 'Transaction 1',
          amount: new Decimal('50.00'),
          status: TransactionStatus.COMPLETED,
          recipientId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockRepository.getByUser.mockResolvedValue(mockTransactions);

      const result = await service.getTransactionsByUser(userId, userId);

      expect(result).toEqual(mockTransactions);
    });

    it('should throw ForbiddenError when accessing another user\'s transactions', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';

      await expect(service.getTransactionsByUser(userId1, userId2)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction if user owns it', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const transactionId = '660e8400-e29b-41d4-a716-446655440000';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId,
        description: 'Test',
        amount: new Decimal('50.00'),
        status: TransactionStatus.COMPLETED,
        recipientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById(userId, transactionId);

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundError if transaction does not exist', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const transactionId = '660e8400-e29b-41d4-a716-446655440000';

      mockRepository.getById.mockResolvedValue(null);

      await expect(service.getTransactionById(userId, transactionId)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('should throw ForbiddenError if user does not own transaction', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const transactionId = '770e8400-e29b-41d4-a716-446655440000';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId: userId2,  // Different owner
        description: 'Test',
        amount: new Decimal('50.00'),
        status: TransactionStatus.COMPLETED,
        recipientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockTransaction);

      await expect(service.getTransactionById(userId1, transactionId)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction if user owns it', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const transactionId = '660e8400-e29b-41d4-a716-446655440000';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId,
        description: 'Test',
        amount: new Decimal('50.00'),
        status: TransactionStatus.PENDING,
        recipientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockTransaction);
      mockRepository.softDelete.mockResolvedValue(true);

      await expect(service.deleteTransaction(userId, transactionId)).resolves.not.toThrow();
      expect(mockRepository.softDelete).toHaveBeenCalledWith(transactionId);
    });

    it('should throw ForbiddenError if user does not own transaction', async () => {
      const userId1 = '550e8400-e29b-41d4-a716-446655440000';
      const userId2 = '660e8400-e29b-41d4-a716-446655440001';
      const transactionId = '770e8400-e29b-41d4-a716-446655440000';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId: userId2,
        description: 'Test',
        amount: new Decimal('50.00'),
        status: TransactionStatus.PENDING,
        recipientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockRepository.getById.mockResolvedValue(mockTransaction);

      await expect(service.deleteTransaction(userId1, transactionId)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
