import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firebaseConfig';
import { ROLES } from '@/constants/roles';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

/**
 * Fetch all active technicians and compute their live active ticket workload.
 * Workload = count of tickets in 'assigned', 'accepted', or 'in_progress'.
 */
export const getActiveTechniciansWithWorkload = async () => {
  // 1. Query active technicians
  const usersRef = collection(db, 'users');
  const techQuery = query(
    usersRef,
    where('role', '==', ROLES.TECHNICIAN),
    where('isActive', '==', true)
  );
  const techSnapshot = await getDocs(techQuery);

  if (techSnapshot.empty) {
    return [];
  }

  const technicians = techSnapshot.docs.map((docSnap) => ({
    uid: docSnap.id,
    ...docSnap.data(),
    activeWorkload: 0,
  }));

  // 2. Query all active complaints to calculate workloads
  // Active statuses: assigned, accepted, in_progress
  const complaintsRef = collection(db, 'complaints');
  const activeStatuses = [
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.ACCEPTED,
    COMPLAINT_STATUS.IN_PROGRESS,
  ];

  const activeComplaintsQuery = query(
    complaintsRef,
    where('status', 'in', activeStatuses)
  );

  try {
    const complaintsSnapshot = await getDocs(activeComplaintsQuery);
    const workloadMap = {};

    complaintsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.assignedTechnicianId) {
        workloadMap[data.assignedTechnicianId] =
          (workloadMap[data.assignedTechnicianId] || 0) + 1;
      }
    });

    technicians.forEach((tech) => {
      tech.activeWorkload = workloadMap[tech.uid] || 0;
    });
  } catch (err) {
    console.warn('Could not compute workloads via composite query:', err);
  }

  // Sort technicians by lowest workload first (load balancing recommendation)
  technicians.sort((a, b) => a.activeWorkload - b.activeWorkload);

  return technicians;
};

/**
 * Fetch total counts of customers and technicians for admin overview.
 */
export const getUserStats = async () => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  let totalCustomers = 0;
  let totalTechnicians = 0;
  let totalAdmins = 0;
  let totalActive = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.role === ROLES.CUSTOMER) totalCustomers += 1;
    else if (data.role === ROLES.TECHNICIAN) totalTechnicians += 1;
    else if (data.role === ROLES.ADMIN) totalAdmins += 1;
    if (data.isActive) totalActive += 1;
  });

  return {
    totalUsers: snapshot.size,
    totalCustomers,
    totalTechnicians,
    totalAdmins,
    totalActive,
  };
};

/**
 * Get all users with filtering and cursor pagination for admin user management.
 */
export const getUsersPaginated = async ({
  role = 'all',
  isActive = 'all',
  pageSize = 15,
  lastVisibleDoc = null,
} = {}) => {
  const usersRef = collection(db, 'users');
  let qConstraints = [];

  if (role && role !== 'all') {
    qConstraints.push(where('role', '==', role));
  }
  if (isActive && isActive !== 'all') {
    qConstraints.push(where('isActive', '==', isActive === 'true'));
  }

  qConstraints.push(orderBy('createdAt', 'desc'));

  if (lastVisibleDoc) {
    qConstraints.push(startAfter(lastVisibleDoc));
  }

  qConstraints.push(limit(pageSize + 1));

  const q = query(usersRef, ...qConstraints);
  const snapshot = await getDocs(q);

  const docs = snapshot.docs;
  const hasMore = docs.length > pageSize;
  const visibleDocs = hasMore ? docs.slice(0, pageSize) : docs;

  const users = visibleDocs.map((docSnap) => ({
    uid: docSnap.id,
    ...docSnap.data(),
  }));

  const nextLastDoc = visibleDocs.length > 0 ? visibleDocs[visibleDocs.length - 1] : null;

  return {
    users,
    lastDoc: nextLastDoc,
    hasMore,
  };
};

/**
 * Change a user's role (Admin action).
 * Non-negotiable requirements:
 * 1. Admin cannot modify their own role (self-demotion/lockout prevention).
 * 2. Target user must exist.
 * 3. Records previous and new role in immutable audit log.
 */
export const changeUserRoleAdmin = async (targetUserId, newRole, adminUser) => {
  if (!targetUserId || !newRole || !adminUser) {
    throw new Error('Target user, new role, and admin context are required.');
  }

  // Self-role modification guard
  if (adminUser.uid === targetUserId) {
    throw new Error('Security Violation: Administrators cannot alter their own account role.');
  }

  const allowedRoles = [ROLES.CUSTOMER, ROLES.TECHNICIAN, ROLES.ADMIN];
  if (!allowedRoles.includes(newRole)) {
    throw new Error(`Invalid role '${newRole}'. Allowed roles: customer, technician, admin.`);
  }

  const targetUserRef = doc(db, 'users', targetUserId);
  const targetSnap = await getDoc(targetUserRef);
  if (!targetSnap.exists()) {
    throw new Error('Target user account not found.');
  }

  const targetData = targetSnap.data();
  const previousRole = targetData.role;

  if (previousRole === newRole) {
    return true; // No change needed
  }

  // 1. Update user document
  await updateDoc(targetUserRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });

  // 2. Create immutable audit log
  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: adminUser.uid,
      actorName: adminUser.displayName || 'Administrator',
      actorRole: ROLES.ADMIN,
      action: 'ROLE_CHANGED',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        targetName: targetData.displayName,
        targetEmail: targetData.email,
        fromRole: previousRole,
        toRole: newRole,
      },
      createdAt: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log creation error:', auditErr);
  }

  return true;
};

/**
 * Toggle user account status (Activate / Deactivate).
 * Non-negotiable requirements:
 * 1. Admin cannot deactivate their own account (self-lockout prevention).
 * 2. Records previous and new account status in audit log.
 */
export const toggleUserStatusAdmin = async (targetUserId, newActiveState, adminUser) => {
  if (!targetUserId || typeof newActiveState !== 'boolean' || !adminUser) {
    throw new Error('Target user, new status, and admin context are required.');
  }

  // Self-deactivation guard
  if (adminUser.uid === targetUserId) {
    throw new Error('Security Violation: Administrators cannot deactivate their own account.');
  }

  const targetUserRef = doc(db, 'users', targetUserId);
  const targetSnap = await getDoc(targetUserRef);
  if (!targetSnap.exists()) {
    throw new Error('Target user account not found.');
  }

  const targetData = targetSnap.data();
  const previousStatus = targetData.isActive ?? true;

  if (previousStatus === newActiveState) {
    return true;
  }

  // 1. Update user doc
  await updateDoc(targetUserRef, {
    isActive: newActiveState,
    updatedAt: serverTimestamp(),
  });

  // 2. Create immutable audit log
  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: adminUser.uid,
      actorName: adminUser.displayName || 'Administrator',
      actorRole: ROLES.ADMIN,
      action: 'USER_STATUS_TOGGLED',
      targetType: 'user',
      targetId: targetUserId,
      metadata: {
        targetName: targetData.displayName,
        targetEmail: targetData.email,
        targetRole: targetData.role,
        fromStatus: previousStatus ? 'active' : 'inactive',
        toStatus: newActiveState ? 'active' : 'inactive',
      },
      createdAt: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log creation error:', auditErr);
  }

  return true;
};

