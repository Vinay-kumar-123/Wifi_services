import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';

/**
 * Fetch chronological audit logs for the Admin Audit Log Viewer.
 * Read access is restricted strictly to administrators in Firestore Security Rules.
 */
export const getAuditLogs = async ({
  action = 'all',
  targetType = 'all',
  pageSize = 20,
  lastVisibleDoc = null,
} = {}) => {
  const auditRef = collection(db, 'auditLogs');
  let qConstraints = [];

  if (action && action !== 'all') {
    qConstraints.push(where('action', '==', action));
  }

  if (targetType && targetType !== 'all') {
    qConstraints.push(where('targetType', '==', targetType));
  }

  qConstraints.push(orderBy('createdAt', 'desc'));

  if (lastVisibleDoc) {
    qConstraints.push(startAfter(lastVisibleDoc));
  }

  qConstraints.push(limit(pageSize + 1));

  const q = query(auditRef, ...qConstraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const visibleDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const logs = visibleDocs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  const nextLastDoc = visibleDocs.length > 0 ? visibleDocs[visibleDocs.length - 1] : null;

  return {
    logs,
    lastDoc: nextLastDoc,
    hasMore,
  };
};
