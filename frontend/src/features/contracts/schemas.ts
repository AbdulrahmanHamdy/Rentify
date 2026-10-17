import { z } from 'zod';

export const createContractSchema = z
  .object({
    unitId: z.coerce.number().int().positive('Please select a valid unit'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 28;
    },
    {
      message: 'Rental term must be at least 28 days',
      path: ['endDate'],
    }
  );

export type CreateContractFormData = z.infer<typeof createContractSchema>;
