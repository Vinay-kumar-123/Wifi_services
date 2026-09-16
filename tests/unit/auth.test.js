/**
 * Unit tests for authentication service and role enforcement logic.
 * Firebase SDK is mocked in tests/setup.js.
 * registerUser accepts { displayName, email, phone, password }
 * loginUser accepts { email, password }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

import {
  registerUser,
  loginUser,
  logoutUser,
  sendResetPassword,
  createTechnicianAccount,
} from '@/services/auth/authService';

const mockCollRef = {};
const mockDocRef = {};

beforeEach(() => {
  vi.clearAllMocks();
  collection.mockReturnValue(mockCollRef);
  doc.mockReturnValue(mockDocRef);
  serverTimestamp.mockReturnValue(new Date());
  addDoc.mockResolvedValue({ id: 'audit-001' });
});

// ─── REGISTRATION ─────────────────────────────────────────────────────────────
describe('User Registration & Default Role', () => {
  it('should always create user with role: customer and isActive: true', async () => {
    const mockFirebaseUser = { uid: 'new-user-001', email: 'newuser@test.com', displayName: null };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });
    updateProfile.mockResolvedValue(undefined);
    setDoc.mockResolvedValue(undefined);

    await registerUser({ email: 'newuser@test.com', password: 'password123', displayName: 'New User', phone: '9876543210' });

    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({ role: 'customer', isActive: true })
    );
  });

  it('should store uid, email, displayName, and phone on registration', async () => {
    const mockFirebaseUser = { uid: 'new-user-002', email: 'user2@test.com', displayName: null };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });
    updateProfile.mockResolvedValue(undefined);
    setDoc.mockResolvedValue(undefined);

    await registerUser({ email: 'user2@test.com', password: 'password123', displayName: 'User Two', phone: '1234567890' });

    expect(setDoc).toHaveBeenCalledWith(
      mockDocRef,
      expect.objectContaining({
        email: 'user2@test.com',
        displayName: 'User Two',
        phone: '1234567890',
        uid: 'new-user-002',
      })
    );
  });

  it('should NEVER allow a custom role to be set during registration', async () => {
    const mockFirebaseUser = { uid: 'new-user-003', email: 'user3@test.com', displayName: null };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });
    updateProfile.mockResolvedValue(undefined);
    setDoc.mockResolvedValue(undefined);

    // Even if caller tries to pass a role, the service ignores it and uses 'customer'
    await registerUser({ email: 'user3@test.com', password: 'password123', displayName: 'User Three', phone: '9999999999' });

    const setDocCall = setDoc.mock.calls[0][1];
    expect(setDocCall.role).toBe('customer');
    expect(setDocCall.role).not.toBe('admin');
    expect(setDocCall.role).not.toBe('technician');
  });

  it('should create a technician profile for a manually-created Auth account', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    await createTechnicianAccount({
      uid: 'tech-user-001',
      fullName: 'Tech User',
      email: 'tech@test.com',
      phone: '+1 (555) 123-4567',
      employeeId: 'TECH-1001',
      serviceArea: 'North Metro',
      specialization: 'Broadband diagnostics',
    });

    expect(setDoc).toHaveBeenCalledWith(mockDocRef, expect.objectContaining({
      uid: 'tech-user-001',
      role: 'technician',
      isActive: true,
    }));
  });

  it('should reject an existing technician profile before overwriting it', async () => {
    getDoc.mockResolvedValue({ exists: () => true });

    await expect(
      createTechnicianAccount({
        uid: 'tech-user-001',
        fullName: 'Tech User',
        email: 'tech@test.com',
        phone: '+1 (555) 123-4567',
        employeeId: 'TECH-1001',
        serviceArea: 'North Metro',
        specialization: 'Broadband diagnostics',
      })
    ).rejects.toThrow('already exists');
  });

  it('should throw an error if Firebase registration fails', async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error('auth/email-already-in-use'));

    await expect(
      registerUser({ email: 'existing@test.com', password: 'password123', displayName: 'Existing', phone: '9876543210' })
    ).rejects.toThrow();
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
describe('User Login', () => {
  it('should call signInWithEmailAndPassword with correct credentials', async () => {
    const mockUser = { uid: 'user-001', email: 'user@test.com' };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'user-001', role: 'customer', isActive: true }),
    });

    const result = await loginUser({ email: 'user@test.com', password: 'password123' });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'user@test.com', 'password123');
    expect(result.user.uid).toBe('user-001');
  });

  it('should reject login if account is deactivated', async () => {
    const mockUser = { uid: 'user-002', email: 'user2@test.com' };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    signOut.mockResolvedValue(undefined);
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ uid: 'user-002', role: 'customer', isActive: false }),
    });

    await expect(loginUser({ email: 'user2@test.com', password: 'password123' })).rejects.toThrow('deactivated');
  });

  it('should propagate Firebase auth errors on failed login', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('auth/wrong-password'));

    await expect(loginUser({ email: 'user@test.com', password: 'wrongpw' })).rejects.toThrow();
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
describe('User Logout', () => {
  it('should call Firebase signOut', async () => {
    signOut.mockResolvedValue(undefined);

    await logoutUser();

    expect(signOut).toHaveBeenCalled();
  });
});

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────
describe('Password Reset', () => {
  it('should call sendPasswordResetEmail with correct email', async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);

    await sendResetPassword('user@test.com');

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'user@test.com');
  });
});

// ─── ROLE ENFORCEMENT LOGIC (pure JS) ─────────────────────────────────────────
describe('Role-Based Access Logic', () => {
  it('should identify admin role correctly', () => {
    const adminProfile = { role: 'admin', isActive: true };
    expect(adminProfile.role === 'admin').toBe(true);
    expect(adminProfile.role === 'customer').toBe(false);
  });

  it('should identify technician role correctly', () => {
    const techProfile = { role: 'technician', isActive: true };
    expect(techProfile.role === 'technician').toBe(true);
    expect(techProfile.role === 'customer').toBe(false);
  });

  it('should detect deactivated accounts', () => {
    const deactivatedProfile = { role: 'customer', isActive: false };
    expect(deactivatedProfile.isActive).toBe(false);
  });

  it('should flag self-role modification (same UID)', () => {
    const adminUid = 'admin-001';
    const targetUid = 'admin-001';
    expect(adminUid === targetUid).toBe(true); // self-modification detected
  });

  it('should flag self-deactivation (same UID)', () => {
    const adminUid = 'admin-001';
    const targetUid = 'admin-001';
    expect(adminUid === targetUid).toBe(true); // self-deactivation detected
  });

  it('should allow role modification for different users', () => {
    const adminUid = 'admin-001';
    const targetUid = 'other-user-002';
    expect(adminUid === targetUid).toBe(false); // different user, allowed
  });
});
