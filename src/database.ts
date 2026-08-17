import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Transaction } from './transactions/models/Transaction';
import { SharedExpense } from './expenses/models/SharedExpense';
import { ExpenseParticipant } from './expenses/models/ExpenseParticipant';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'fintrack_dev',
  synchronize: true, // dev only — use migrations for prod
  logging: false,
  entities: [Transaction, SharedExpense, ExpenseParticipant],
});
