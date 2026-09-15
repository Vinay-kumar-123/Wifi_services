import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  addDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';

/**
 * Subscribe to real-time in-app notifications for the authenticated user.
 * Restricted strictly by recipientId == user.uid in Firestore Security Rules.
 */
export const subscribeToUserNotifications = (userId, callback, onError, maxLimit = 30) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('recipientId', '==', userId), limit(maxLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
      callback(notifications);
    },
    (err) => {
      console.warn('Notifications real-time listener error:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Mark a single notification as read.
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  if (!notificationId || !userId) return;

  const notifDocRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifDocRef, {
    isRead: true,
    readAt: serverTimestamp(),
  });
};

/**
 * Mark all unread notifications as read for the user.
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return;

  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('recipientId', '==', userId), limit(250));

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const unreadDocs = snapshot.docs.filter((docSnap) => !docSnap.data().isRead);
  if (unreadDocs.length === 0) return;

  const batch = writeBatch(db);
  unreadDocs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  });

  await batch.commit();
};

/**
 * Create a new notification for a user.
 */
export const createNotification = async ({
  recipientId,
  title,
  message,
  type = 'status_change',
  relatedComplaintId = null,
}) => {
  if (!recipientId || !title || !message) return null;

  const notifRef = collection(db, 'notifications');
  const docRef = await addDoc(notifRef, {
    recipientId,
    title,
    message,
    type,
    relatedComplaintId,
    isRead: false,
    readAt: null,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};
