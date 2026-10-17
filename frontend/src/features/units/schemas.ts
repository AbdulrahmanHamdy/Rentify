import { z } from 'zod';

export const createUnitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required').max(50, 'Max 50 characters'),
  floor: z.coerce.number().int().min(-5).max(500).optional().nullable(),
  areaSqm: z.coerce.number().positive('Area must be greater than 0'),
  bedrooms: z.coerce.number().int().min(0, 'Bedrooms cannot be negative').max(50),
  bathrooms: z.coerce.number().int().min(0, 'Bathrooms cannot be negative').max(50),
  monthlyRent: z.coerce.number().positive('Monthly rent must be greater than 0'),
  depositAmount: z.coerce.number().min(0, 'Deposit cannot be negative'),
});

export type CreateUnitFormData = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = createUnitSchema.extend({
  status: z.enum(['Available', 'Reserved', 'Rented', 'Maintenance']),
});

export type UpdateUnitFormData = z.infer<typeof updateUnitSchema>;
