/**
 * Vitest global setup — mocks Firebase modules so unit tests run without
 * a real Firebase project or emulator.
 */
import { vi } from 'vitest';

// ─── Mock Firebase Firestore ──────────────────────────────────────────────────
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  serverTimestamp: vi.fn(() => new Date('2024-01-01T00:00:00Z')),
  onSnapshot: vi.fn(() => () => {}),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
    fromDate: vi.fn((d) => ({ toDate: () => d })),
  },
}));

// ─── Mock Firebase Auth ───────────────────────────────────────────────────────
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

// ─── Mock Firebase Storage ────────────────────────────────────────────────────
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  connectStorageEmulator: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// ─── Mock Firebase App ────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

// ─── Mock firebaseConfig module ───────────────────────────────────────────────
vi.mock('@/services/firebase/firebaseConfig', () => ({
  auth: {},
  db: {},
  storage: {},
  functions: {},
  isFirebaseConfigured: true,
}));
