import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/services/firebase/firebaseConfig';
import {
  registerUser,
  loginUser,
  logoutUser,
  sendResetPassword,
} from '@/services/auth/authService';
import { ROLES } from '@/constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile = null;
    let graceTimeout = null;

    // Listen to Firebase Auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setCurrentUser(user);
      setProfileError(null);

      if (user) {
        setLoading(true);

        // Set up real-time listener for user profile in Firestore
        // Guarantees immediate session update if an admin deactivates an account or changes roles
        const profileRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(
          profileRef,
          async (docSnap) => {
            if (graceTimeout) {
              clearTimeout(graceTimeout);
              graceTimeout = null;
            }

            if (docSnap.exists()) {
              const data = docSnap.data();

              // Real-time deactivation check
              if (data.isActive === false) {
                await logoutUser();
                setUserProfile(null);
                setLoading(false);
                return;
              }

              setUserProfile(data);
              setLoading(false);
            } else {
              // Profile document does not exist in Firestore.
              // Check if account was created within the last 15 seconds (write may be in flight)
              const creationTimeMs = user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).getTime()
                : 0;
              const isBrandNewAccount = Date.now() - creationTimeMs < 15000;

              if (isBrandNewAccount) {
                // Wait for setDoc in registerUser to complete before setting loading = false
                graceTimeout = setTimeout(() => {
                  setUserProfile(null);
                  setLoading(false);
                }, 3000);
              } else {
                setUserProfile(null);
                setProfileError('User profile not found. Please contact support.');
                setLoading(false);
              }
            }
          },
          (error) => {
            console.error('[AuthContext] Error reading user profile:', error);
            setUserProfile(null);
            setProfileError('Failed to load user profile permissions.');
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        if (graceTimeout) {
          clearTimeout(graceTimeout);
          graceTimeout = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (graceTimeout) clearTimeout(graceTimeout);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    role: userProfile?.role || null,
    isActive: userProfile?.isActive ?? false,
    isAdmin: userProfile?.role === ROLES.ADMIN,
    isTechnician: userProfile?.role === ROLES.TECHNICIAN,
    isCustomer: userProfile?.role === ROLES.CUSTOMER,
    loading,
    profileError,
    register: registerUser,
    login: loginUser,
    logout: logoutUser,
    resetPassword: sendResetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
