import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '@/services/firebase/firebaseConfig';
import { ROLES } from '@/constants/roles';

/**
 * Register a new user with email and password.
 * Non-negotiable requirement: New users are ALWAYS created with role 'customer'.
 * Users can never select their own role.
 */
export const registerUser = async ({ displayName, email, phone, password }) => {
  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Update display name in Firebase Auth profile
  await updateProfile(user, { displayName });

  // 3. Create strictly-validated Firestore user document
  const userDocRef = doc(db, 'users', user.uid);
  const userData = {
    uid: user.uid,
    displayName,
    email,
    phone,
    role: ROLES.CUSTOMER, // Always customer
    isActive: true,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userDocRef, userData);

  // 4. Log registration audit event
  try {
    const auditLogsRef = collection(db, 'auditLogs');
    await addDoc(auditLogsRef, {
      actorId: user.uid,
      actorName: displayName,
      actorRole: ROLES.CUSTOMER,
      action: 'USER_REGISTERED',
      targetType: 'user',
      targetId: user.uid,
      metadata: { email, role: ROLES.CUSTOMER },
      createdAt: serverTimestamp(),
    });
  } catch (auditErr) {
    // Non-blocking for signup flow if rules restrict or emulator is warming up
    console.warn('Audit log write error on registration:', auditErr);
  }

  return { user, profile: userData };
};

/**
 * Create a technician profile for an Auth account created manually in Firebase
 * Authentication. The UID is supplied by the administrator and must match the
 * Auth account that was created outside this application.
 */
export const createTechnicianAccount = async ({
  uid,
  fullName,
  email,
  phone,
  address,
  employeeId,
  serviceArea,
  specialization,
  photoURL,
}) => {
  if (!uid?.trim() || !fullName?.trim() || !email?.trim() || !phone?.trim()) {
    throw new Error('Firebase Auth UID, full name, email address, and phone number are required.');
  }

  const profile = {
    uid: uid.trim(),
    fullName: fullName.trim(),
    displayName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    employeeId: employeeId?.trim() || '',
    serviceArea: serviceArea?.trim() || '',
    specialization: specialization?.trim() || '',
    address: address?.trim() || '',
    photoURL: photoURL?.trim() || null,
    role: ROLES.TECHNICIAN,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const existingProfile = await getDoc(doc(db, 'users', profile.uid));
  if (existingProfile.exists()) {
    throw new Error('A Firestore profile already exists for this Auth UID.');
  }

  await setDoc(doc(db, 'users', profile.uid), profile);
  return profile;
};

/**
 * Log in an existing user with email and password.
 * Checks account activation status.
 */
export const loginUser = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Fetch Firestore profile to verify active status and role
  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  
  if (!profileDoc.exists()) {
    await signOut(auth);
    throw new Error('User profile record not found. Please contact support.');
  }

  const profileData = profileDoc.data();

  if (profileData.isActive === false) {
    await signOut(auth);
    throw new Error('This account has been deactivated by an administrator. Access denied.');
  }

  return { user, profile: profileData };
};

/**
 * Log out the currently authenticated user.
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Send password reset email.
 */
export const sendResetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Fetch user profile from Firestore by UID.
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;
  const userDocRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userDocRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return null;
};
