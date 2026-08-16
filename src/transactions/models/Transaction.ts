import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Decimal } from 'decimal.js';

/**
 * Transaction Entity - Represents a financial transaction
 * 
 * Implements:
 * - Decimal precision for financial amounts (no float rounding errors)
 * - Soft deletes for audit trail preservation
 * - Timestamps for tracking and compliance
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('transactions')
export class Transaction {
  /**
   * Unique transaction identifier (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who owns this transaction (UUID)
   */
  @Column('uuid')
  userId: string;

  /**
   * Human-readable transaction description
   * Max 255 characters for database efficiency
   */
  @Column('varchar', { length: 255 })
  description: string;

  /**
   * Transaction amount in cents/smallest currency unit
   * Uses Decimal type for exact precision (no float rounding)
   * Constraint: Must be positive (validated at service layer)
   */
  @Column('decimal', { precision: 19, scale: 2 })
  amount: Decimal;

  /**
   * Current status of the transaction
   * Enum: pending | completed | failed
   */
  @Column('enum', { enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  /**
   * ID of the recipient user (optional, for peer-to-peer transactions)
   * If null, transaction is standalone (user expense)
   */
  @Column('uuid', { nullable: true })
  recipientId: string | null;

  /**
   * Timestamp when transaction was created
   * Auto-set by TypeORM
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when transaction was last updated
   * Auto-updated by TypeORM
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Soft delete timestamp
   * When set (not null), transaction is logically deleted but recoverable
   * Audit trail preserved; query filters exclude soft-deleted records
   * Required for fintech compliance (7-year retention)
   */
  @DeleteDateColumn()
  deletedAt: Date | null;
}
