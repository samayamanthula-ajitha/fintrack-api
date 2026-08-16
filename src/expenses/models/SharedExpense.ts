import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Decimal } from 'decimal.js';
import { ExpenseParticipant } from './ExpenseParticipant';

/**
 * SharedExpense Entity - Represents a shared expense between multiple users
 * 
 * Example: Alice, Bob, Charlie go to dinner for $90
 * - Creator: Alice
 * - Participants: [Alice, Bob, Charlie]
 * - Total: $90
 * - Share per person (equal): $30
 */
export enum SplitType {
  EQUAL = 'equal',        // All participants pay same amount
  CUSTOM = 'custom',      // Each participant has specific amount
  PERCENTAGE = 'percentage', // Each participant pays percentage
}

@Entity('shared_expenses')
export class SharedExpense {
  /**
   * Unique expense identifier (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who created and owns this expense
   */
  @Column('uuid')
  creatorId: string;

  /**
   * Human-readable description of the expense
   * Example: "Dinner at Mario's Restaurant"
   */
  @Column('varchar', { length: 255 })
  description: string;

  /**
   * Total expense amount (sum of all participant shares)
   * Uses Decimal for financial precision
   */
  @Column('decimal', { precision: 19, scale: 2 })
  totalAmount: Decimal;

  /**
   * Type of split: equal | custom | percentage
   */
  @Column('enum', { enum: SplitType, default: SplitType.EQUAL })
  splitType: SplitType;

  /**
   * Category of expense (for reporting/filtering)
   * Examples: food, transport, accommodation, entertainment
   */
  @Column('varchar', { length: 50, nullable: true })
  category: string | null;

  /**
   * Optional date of the expense (may differ from creation date)
   */
  @Column('date', { nullable: true })
  expenseDate: Date | null;

  /**
   * Whether this expense has been settled (all balances paid)
   */
  @Column('boolean', { default: false })
  isSettled: boolean;

  /**
   * Participants in this shared expense
   * Relationship: one expense → many participants
   */
  @OneToMany(
    () => ExpenseParticipant,
    (participant) => participant.expense,
    { cascade: true, eager: true },
  )
  participants: ExpenseParticipant[];

  /**
   * Timestamp when expense was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when expense was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft delete timestamp (null if not deleted)
   */
  @DeleteDateColumn()
  deletedAt: Date | null;
}
