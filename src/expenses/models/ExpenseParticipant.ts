import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Decimal } from 'decimal.js';
import { SharedExpense } from './SharedExpense';
import { DecimalTransformer } from '../../shared/decimalTransformer';

/**
 * ExpenseParticipant Entity - Represents a user's share in a shared expense
 */
@Entity('expense_participants')
export class ExpenseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  expenseId: string;

  @Column('uuid')
  userId: string;

  @Column('decimal', { precision: 19, scale: 2, transformer: DecimalTransformer })
  amount: Decimal;

  @Column('decimal', { precision: 19, scale: 2, transformer: DecimalTransformer, default: 0 })
  amountPaid: Decimal;

  @Column('boolean', { default: false })
  isPaid: boolean;

  @ManyToOne(() => SharedExpense, (expense) => expense.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expenseId' })
  expense: SharedExpense;

  @CreateDateColumn()
  createdAt: Date;
}
