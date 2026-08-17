import { Router, Request, Response } from 'express';
import Decimal from 'decimal.js';
import { getRepository } from 'typeorm';
import { SharedExpense } from '../models/SharedExpense';
import { ExpenseParticipant } from '../models/ExpenseParticipant';
import { ExpenseRepository } from '../repositories/ExpenseRepository';
import { ExpenseService } from '../services/ExpenseService';

const router = Router();

function makeService() {
  const expenseRepo = new ExpenseRepository(getRepository(SharedExpense), getRepository(ExpenseParticipant));
  return new ExpenseService(expenseRepo);
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

// POST /api/v1/expenses
router.post('/', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  const { description, totalAmount, splitType, participantIds, category, expenseDate } = req.body ?? {};

  try {
    if (totalAmount === undefined || totalAmount === null) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'totalAmount is required', { field: 'totalAmount' });
    }

    const parsedTotal = new Decimal(totalAmount);
    const input = {
      description,
      totalAmount: parsedTotal,
      splitType,
      participantIds,
      category,
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
    };

    const created = await service.createExpense(requestingUserId, input);
    return sendSuccess(res, created);
  } catch (err: any) {
    if (err.name === 'ValidationError') return sendError(res, 400, 'VALIDATION_ERROR', err.message);
    if (err.name === 'ForbiddenError') return sendError(res, 403, 'FORBIDDEN', err.message);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create expense');
  }
});

// GET /api/v1/users/:userId/balances
router.get('/users/:userId/balances', async (req: Request, res: Response) => {
  const service = makeService();
  const requestingUserId = (req as any).userId as string;
  const { userId } = req.params;

  if (requestingUserId !== userId) {
    return sendError(res, 403, 'FORBIDDEN', 'Cannot access other user balances');
  }

  try {
    // Build set of counterparties from user's expenses
    const repo = (service as any).repository as ExpenseRepository;
    const expenses = await repo.getByUser(userId);

    const counterparties = new Set<string>();
    for (const exp of expenses) {
      for (const p of exp.participants) {
        if (p.userId !== userId) counterparties.add(p.userId);
      }
    }

    const results: Array<{ userId: string; netBalance: string }> = [];
    for (const otherId of Array.from(counterparties)) {
      const balance = await service.calculateBalance(userId, otherId);
      results.push({ userId: otherId, netBalance: balance.toFixed(2) });
    }

    return sendSuccess(res, results);
  } catch (err: any) {
    return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to compute balances');
  }
});

export default router;
