import { ValueTransformer } from 'typeorm';
import { Decimal } from 'decimal.js';

/**
 * DecimalTransformer converts between DB decimal (string) and Decimal.js
 * - to: Decimal|string|number -> string for DB
 * - from: string|null -> Decimal|null for entity usage
 */
export const DecimalTransformer: ValueTransformer = {
  to: (value: Decimal | string | number | null): string | null => {
    if (value === null || value === undefined) return null;
    // new Decimal handles Decimal, number, and string inputs
    return new Decimal(value as any).toFixed(2);
  },
  from: (value: string | null): Decimal | null => {
    if (value === null || value === undefined) return null;
    return new Decimal(value);
  },
};
