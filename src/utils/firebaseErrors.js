/**
 * Firebase Error Handling Utility
 * Maps Firebase Auth and Firestore error codes to clear, actionable user-friendly messages.
 * Prevents exposing raw internal stack traces while logging full diagnostics during development.
 */

export const getFirebaseAuthErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = typeof error === 'string' ? error : error.code;

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/invalid-email':
      return 'The email address provided is not valid.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled in this project. Please contact support.';
    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters with mixed letters and numbers.';
    case 'auth/user-disabled':
      return 'This user account has been deactivated by an administrator. Please contact support.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to multiple failed login attempts. Please reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network connection failure. Please check your internet connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in popup was closed before completing the operation.';
    case 'permission-denied':
      return 'Permission denied: You do not have authorization to perform this action.';
    default:
      return error.message || 'An error occurred during authentication. Please try again.';
  }
};

/**
 * Maps Cloud Firestore error codes to safe, specific, and actionable messages.
 * Logs the full error details to console for debugging.
 */
export const getFirestoreErrorMessage = (error, operationName = 'operation') => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || (typeof error === 'string' ? error : '');
  const message = error.message || '';

  // Log full error details for development diagnostics
  console.error(`[Firestore ${operationName} Error]`, {
    code,
    message,
    operationName,
    rawError: error,
  });

  switch (code) {
    case 'permission-denied':
      return 'Permission denied: Your account does not have access to this data. Please verify your active session and role permissions.';
    case 'failed-precondition':
      if (message.includes('index') || message.includes('indexes')) {
        return 'Database index configuration required. Please ensure composite indexes are deployed in Firebase Console.';
      }
      return 'Operation failed: A database precondition was not met. Please refresh and try again.';
    case 'unauthenticated':
      return 'Authentication expired: Your session is invalid or expired. Please sign in again.';
    case 'unavailable':
      return 'Network unavailable: Unable to reach Cloud Firestore service. Please check your network connection or verify emulator status.';
    case 'not-found':
      return 'Record not found: The requested document does not exist or has been removed.';
    case 'already-exists':
      return 'Document already exists in database.';
    case 'resource-exhausted':
      return 'Quota exceeded: Service quota limits reached. Please try again later.';
    case 'cancelled':
      return 'The operation was cancelled.';
    case 'deadline-exceeded':
      return 'Request timed out: Server took too long to respond. Please check your connection and try again.';
    case 'data-loss':
      return 'Unrecoverable data corruption or loss reported by backend.';
    default:
      if (message.includes('network') || message.includes('offline') || message.includes('Failed to fetch')) {
        return 'Network connection failure: Unable to communicate with Firebase servers.';
      }
      return error.message || 'An unexpected database error occurred. Please try again.';
  }
};
