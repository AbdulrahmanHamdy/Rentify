import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schemas';
import { createContractSchema } from '@/features/contracts/schemas';
import { propertySchema } from '@/features/properties/schemas';

describe('Zod Validation Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'Password123!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email format', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'owner@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'Owner',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.success).toBe(true);
    });

    it('rejects mismatched password and confirmation', () => {
      const result = registerSchema.safeParse({
        email: 'owner@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        role: 'Owner',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Passwords don't match");
      }
    });

    it('rejects passwords shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        email: 'owner@example.com',
        password: 'short',
        confirmPassword: 'short',
        role: 'Tenant',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createContractSchema', () => {
    it('accepts terms of 28 days or longer', () => {
      const result = createContractSchema.safeParse({
        unitId: 5,
        startDate: '2026-11-01',
        endDate: '2026-12-01', // 30 days
      });
      expect(result.success).toBe(true);
    });

    it('rejects rental terms shorter than 28 days', () => {
      const result = createContractSchema.safeParse({
        unitId: 5,
        startDate: '2026-11-01',
        endDate: '2026-11-15', // 14 days
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 28 days');
      }
    });
  });

  describe('propertySchema', () => {
    it('validates property name and address', () => {
      const result = propertySchema.safeParse({
        name: 'Zamalek Heights',
        address: '22 Nile St, Zamalek',
        city: 'Cairo',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty name or address', () => {
      const result = propertySchema.safeParse({
        name: '',
        address: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
