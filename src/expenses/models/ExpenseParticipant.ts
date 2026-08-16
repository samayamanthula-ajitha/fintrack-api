import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Decimal } from 'decimal.js';
import { SharedExpense } from './SharedExpense';

/**
 * ExpenseParticipant Entity - Represents a user's share in a shared expense
 * 
 * Many-to-one relationship with SharedExpense
 * Example: For a $90 dinner, Alice's share might be $30
 */
@Entity('expense_participants')
export class ExpenseParticipant {
  /**
   * Unique participant record identifier
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the SharedExpense this participant belongs to
   */
  @Column('uuid')
  expenseId: string;

  /**
   * User ID of the participant
   */
  @Column('uuid')
  userId: string;

  /**
   * Amount this user owes/paid (Decimal for precision)
   * In equal split: totalAmount / participantCount
   * In custom split: specified amount
   */
  @Column('decimal', { precision: 19, scale: 2 })
  amount: Decimal;

  /**
   * Amount this user has already paid towards their share
   * Starts at 0, increases as user makes payments
   */
  @Column('decimal', { precision: 19, scale: 2, default: 0 })
  amountPaid: Decimal;

  /**
   * Whether this participant has settled their balance
   * (amountPaid >= amount)
   */
  @Column('boolean', { default: false })
  isPaid: boolean;

  /**
   * Back-reference to the SharedExpense
   */
  @ManyToOne(() => SharedExpense, (expense) => expense.participants, {
    onDelete: 'CASCADE',  // Delete participant if expense is deleted
  })
  @JoinColumn({ name: 'expenseId' })
  expense: SharedExpense;

  /**
   * Timestamp when this participant record was created
   */
  @CreateDateColumn()
  createdAt: Date;
}
