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
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/services/firebase/firebaseConfig';
import { ROLES } from '@/constants/roles';

const getTechnicianCreationError = (error) => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (code.includes('unauthenticated')) {
    return new Error('Your session has expired. Please sign in again.');
  }
  if (code.includes('permission-denied')) {
    return new Error('Only active administrators can create technician accounts.');
  }
  if (code.includes('already-exists')) {
    return new Error('A user with this email or employee ID already exists.');
  }
  if (code.includes('invalid-argument')) {
    return new Error(message || 'Please check the technician details and try again.');
  }
  if (code.includes('failed-precondition')) {
    return new Error(message || 'Technician account creation is not currently available.');
  }
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return new Error('The technician service is temporarily unavailable. Please try again.');
  }
  if (code.includes('internal') || code.includes('unknown') || /cors|network|fetch/i.test(message)) {
    return new Error('The technician service could not be reached. Verify the deployed us-central1 Function and try again.');
  }

  return error instanceof Error ? error : new Error('Unable to create technician account.');
};

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
 * Create a technician account through the privileged Cloud Function.
 * The browser must never create this Auth user because that would replace the
 * currently signed-in administrator in the client Auth instance.
 */
export const createTechnicianAccount = async ({
  fullName,
  email,
  phone,
  address,
  employeeId,
  serviceArea,
  specialization,
  photoURL,
}) => {
  if (!fullName?.trim() || !email?.trim() || !phone?.trim()) {
    throw new Error('Full name, email address, and phone number are required.');
  }

  let response;
  try {
    const createTechnician = httpsCallable(functions, 'createTechnician');
    response = await createTechnician({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address?.trim() || '',
      employeeId: employeeId?.trim() || '',
      serviceArea: serviceArea?.trim() || '',
      specialization: specialization?.trim() || '',
      photoURL: photoURL?.trim() || null,
    });
  } catch (error) {
    throw getTechnicianCreationError(error);
  }

  let setupEmailSent = false;
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    setupEmailSent = true;
  } catch (emailError) {
    console.warn('Technician setup email could not be sent:', emailError);
  }

  return {
    ...response.data,
    setupEmailSent,
  };
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
