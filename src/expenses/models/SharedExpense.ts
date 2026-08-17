import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ExpenseParticipant } from './ExpenseParticipant';
import { DecimalTransformer } from '../../shared/decimalTransformer';

/**
 * SharedExpense Entity - Represents a shared expense between multiple users
 */
export enum SplitType {
  EQUAL = 'equal',
  CUSTOM = 'custom',
  PERCENTAGE = 'percentage',
}

@Entity('shared_expenses')
export class SharedExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  creatorId: string;

  @Column('varchar', { length: 255 })
  description: string;

  @Column('decimal', { precision: 19, scale: 2, transformer: DecimalTransformer })
  totalAmount: Decimal;

  @Column('enum', { enum: SplitType, default: SplitType.EQUAL })
  splitType: SplitType;

  @Column('varchar', { length: 50, nullable: true })
  category: string | null;

  @Column('date', { nullable: true })
  expenseDate: Date | null;

  @Column('boolean', { default: false })
  isSettled: boolean;

  @OneToMany(
    () => ExpenseParticipant,
    (participant) => participant.expense,
    { cascade: true, eager: true },
  )
  participants: ExpenseParticipant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
