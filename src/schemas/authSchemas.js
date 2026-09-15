import { z } from 'zod';

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, { message: 'Full name must be at least 2 characters long' })
      .max(60, { message: 'Full name cannot exceed 60 characters' }),
    email: z
      .string()
      .trim()
      .email({ message: 'Please provide a valid email address' }),
    phone: z
      .string()
      .trim()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .regex(/^(\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,6}$/, {
        message: 'Please provide a valid phone number (e.g., +1234567890 or 9876543210)',
      }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' })
      .regex(/[A-Za-z]/, { message: 'Password must contain at least one letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please provide a valid email address' }),
});
