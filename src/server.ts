import express from 'express';
import pinoHttp from 'pino-http';
import bodyParser from 'body-parser';
import transactionRouter from './transactions/controllers/TransactionController';
import expenseRouter from './expenses/controllers/ExpenseController';
import { devAuth } from './middleware/auth';

const PORT = process.env.PORT || 3000;

export function createApp() {
  const app = express();
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(pinoHttp());

  // Health
  app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Apply dev auth for all API routes (production: replace with JWT auth)
  app.use('/api/v1', devAuth);

  // Mount routers
  app.use('/api/v1/transactions', transactionRouter);
  app.use('/api/v1/expenses', expenseRouter);

  return app;
}

if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}
