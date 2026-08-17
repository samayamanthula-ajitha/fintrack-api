import { Router, Request, Response } from 'express';
import Decimal from 'decimal.js';
import { getRepository } from 'typeorm';
import { Transaction } from '../models/Transaction';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { TransactionService } from '../services/TransactionService';

const router = Router();

function makeService() {
  const repo = new TransactionRepository(getRepository(Transaction));
  return new TransactionService(repo);
}

function sendSuccess(res: Response, data: any) {
  return res.json({ success: true, data, error: null, timestamp: new Date().toISOString() });
}

function sendError(res: Response, status: number, code: string, message: string, details?: any) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, details: details || null },
    timestamp: new Date().toISOString(),
  });
}

// POST /api/v1/transactions
router.post('/', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  const { description, amount, recipientId } = req.body ?? {};

  try {
    if (amount === undefined || amount === null) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Amount is required', { field: 'amount' });
    }
    const decimalAmount = new Decimal(amount);
    const input = { description, amount: decimalAmount, recipientId };

    const created = await service.createTransaction(requestingUserId, requestingUserId, input);
    return sendSuccess(res, created);
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      return sendError(res, 400, 'VALIDATION_ERROR', err.message);
    }
    if (err.name === 'ForbiddenError') {
      return sendError(res, 403, 'FORBIDDEN', err.message);
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create transaction');
  }
});

// GET /api/v1/transactions
router.get('/', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  try {
    const items = await service.getTransactionsByUser(requestingUserId, requestingUserId);
    return sendSuccess(res, items);
  } catch (err: any) {
    if (err.name === 'ForbiddenError') {
      return sendError(res, 403, 'FORBIDDEN', err.message);
    }
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch transactions');
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  try {
    const item = await service.getTransactionById(requestingUserId, req.params.id);
    return sendSuccess(res, item);
  } catch (err: any) {
    if (err.name === 'NotFoundError') return sendError(res, 404, 'NOT_FOUND', err.message);
    if (err.name === 'ForbiddenError') return sendError(res, 403, 'FORBIDDEN', err.message);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch transaction');
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  try {
    await service.deleteTransaction(requestingUserId, req.params.id);
    return sendSuccess(res, { deleted: true });
  } catch (err: any) {
    if (err.name === 'NotFoundError') return sendError(res, 404, 'NOT_FOUND', err.message);
    if (err.name === 'ForbiddenError') return sendError(res, 403, 'FORBIDDEN', err.message);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete transaction');
  }
});

export default router;
