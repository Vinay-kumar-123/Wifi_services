import { z } from 'zod';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from '@/constants/complaintStatus';

export const complaintSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, { message: 'Customer name must be at least 2 characters long' })
    .max(80, { message: 'Customer name cannot exceed 80 characters' }),
  phone: z
    .string()
    .trim()
    .min(10, { message: 'Phone number must be at least 10 digits' })
    .regex(/^(\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,6}$/, {
      message: 'Please provide a valid phone number (e.g. +1234567890 or 9876543210)',
    }),
  address: z
    .string()
    .trim()
    .min(5, { message: 'Service address must be at least 5 characters long' })
    .max(250, { message: 'Address cannot exceed 250 characters' }),
  category: z.enum(COMPLAINT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid complaint category' }),
  }),
  priority: z.enum(
    [
      COMPLAINT_PRIORITIES.LOW,
      COMPLAINT_PRIORITIES.MEDIUM,
      COMPLAINT_PRIORITIES.HIGH,
      COMPLAINT_PRIORITIES.CRITICAL,
    ],
    {
      errorMap: () => ({ message: 'Please select an issue priority level' }),
    }
  ),
  description: z
    .string()
    .trim()
    .min(15, { message: 'Please provide a detailed description (minimum 15 characters)' })
    .max(2000, { message: 'Description cannot exceed 2000 characters' }),
  preferredContactMethod: z
    .enum(['phone', 'email', 'whatsapp'], {
      errorMap: () => ({ message: 'Please select a preferred contact method' }),
    })
    .default('phone'),
});

export const cancelComplaintSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, { message: 'Please provide a reason for cancelling this complaint (at least 5 characters)' })
    .max(300, { message: 'Reason cannot exceed 300 characters' }),
});
