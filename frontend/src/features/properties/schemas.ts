import { z } from 'zod';

export const propertySchema = z.object({
  name: z.string().min(1, 'Property name is required').max(200, 'Name cannot exceed 200 characters'),
  address: z.string().min(1, 'Address is required').max(300, 'Address cannot exceed 300 characters'),
  city: z.string().max(100, 'City cannot exceed 100 characters').optional().or(z.literal('')),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').optional().or(z.literal('')),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
