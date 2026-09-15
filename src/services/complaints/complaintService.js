import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/services/firebase/firebaseConfig';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';
import { ROLES } from '@/constants/roles';
import { createNotification } from '@/services/notifications/notificationService';

/**
 * Upload an array of files to Firebase Storage under complaints/{complaintId}/
 */
export const uploadComplaintAttachments = async (complaintId, files) => {
  if (!files || files.length === 0) return [];

  const uploadPromises = files.map(async (file) => {
    // Sanitize file name and prefix with timestamp
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const fileRef = storageRef(storage, `complaints/${complaintId}/${safeName}`);

    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        size: String(file.size),
      },
    };

    const snapshot = await uploadBytes(fileRef, file, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      name: file.name,
      url: downloadUrl,
      storagePath: snapshot.ref.fullPath,
      size: file.size,
      type: file.type,
    };
  });

  return Promise.all(uploadPromises);
};

/**
 * Create a new customer complaint.
 * Non-negotiable requirements:
 * 1. Belongs to the authenticated customer.
 * 2. Initial status MUST be 'open'.
 * 3. assignedTechnicianId and assignedTechnicianName MUST be null.
 * 4. Automatic technician assignment is strictly prohibited.
 * 5. Creates an initial record in complaints/{complaintId}/history subcollection.
 */
export const createComplaint = async (user, complaintData, attachments = []) => {
  if (!user || !user.uid) {
    throw new Error('User must be authenticated to register a complaint.');
  }

  // Create a new reference with auto-generated ID
  const complaintsColRef = collection(db, 'complaints');
  const complaintDocRef = doc(complaintsColRef);
  const complaintId = complaintDocRef.id;

  // Upload attachments if any
  let uploadedFiles = [];
  if (attachments && attachments.length > 0) {
    try {
      uploadedFiles = await uploadComplaintAttachments(complaintId, attachments);
    } catch (storageErr) {
      console.warn('Attachment upload failed or storage not configured:', storageErr);
    }
  }

  const newComplaint = {
    id: complaintId,
    complaintNumber: `WIFI-${complaintId.slice(0, 8).toUpperCase()}`,
    title: complaintData.title || `${complaintData.category} - ${complaintData.address?.slice(0, 30) || 'Service Request'}`,
    customerId: user.uid,
    customerName: complaintData.customerName || user.displayName || 'Customer',
    customerEmail: user.email,
    phone: complaintData.phone,
    customerPhone: complaintData.phone,
    address: complaintData.address,
    category: complaintData.category,
    description: complaintData.description,
    priority: complaintData.priority,
    status: COMPLAINT_STATUS.OPEN,
    assignedTechnicianId: null, // Strictly null on creation
    assignedTechnicianName: null,
    preferredContactMethod: complaintData.preferredContactMethod || 'phone',
    attachments: uploadedFiles,
    resolutionNotes: '',
    dispatchNotes: '',
    internalNotes: '',
    createdBy: user.uid,
    lastUpdatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    acceptedAt: null,
    inProgressAt: null,
    resolvedAt: null,
    closedAt: null,
  };

  // 1. Write the complaint document
  await setDoc(complaintDocRef, newComplaint);

  // 2. Write initial history entry in subcollection
  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: user.uid,
    changedByName: user.displayName || 'Customer',
    changedByRole: ROLES.CUSTOMER,
    fromStatus: null,
    toStatus: COMPLAINT_STATUS.OPEN,
    note: 'Complaint registered by customer.',
    createdAt: serverTimestamp(),
  });

  // 3. Write immutable audit log
  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: user.uid,
      actorName: user.displayName || 'Customer',
      actorRole: ROLES.CUSTOMER,
      action: 'COMPLAINT_CREATED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: {
        category: complaintData.category,
        priority: complaintData.priority,
      },
      createdAt: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr);
  }

  return { id: complaintId, ...newComplaint };
};

/**
 * Fetch customer complaints with pagination, status filtering, and sorting.
 * Restricted to customerId == user.uid.
 */
export const getCustomerComplaints = async (
  customerId,
  { status = 'all', priority = 'all', category = 'all', pageSize = 10, lastVisibleDoc = null } = {}
) => {
  if (!customerId) return { complaints: [], lastDoc: null, hasMore: false };

  const hasExtraFilters = status !== 'all' || priority !== 'all' || category !== 'all';

  const baseQueryConstraints = [where('customerId', '==', customerId)];

  if (!hasExtraFilters) {
    baseQueryConstraints.push(orderBy('createdAt', 'desc'));

    if (lastVisibleDoc) {
      baseQueryConstraints.push(startAfter(lastVisibleDoc));
    }

    baseQueryConstraints.push(limit(pageSize + 1));
  }

  const q = query(collection(db, 'complaints'), ...baseQueryConstraints);
  const snapshot = await getDocs(q);
  let complaints = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (hasExtraFilters) {
    complaints = complaints.filter((complaint) => {
      const matchesStatus = status === 'all' || complaint.status === status;
      const matchesPriority = priority === 'all' || (complaint.priority || '').toLowerCase() === priority.toLowerCase();
      const matchesCategory = category === 'all' || complaint.category === category;
      return matchesStatus && matchesPriority && matchesCategory;
    });

    complaints.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  const hasMore = complaints.length > pageSize;
  const visibleComplaints = hasMore ? complaints.slice(0, pageSize) : complaints;
  const nextLastDoc = visibleComplaints.length > 0 ? snapshot.docs.find((docSnap) => docSnap.id === visibleComplaints[visibleComplaints.length - 1].id) || null : null;

  return {
    complaints: visibleComplaints,
    lastDoc: nextLastDoc,
    hasMore,
  };
};

/**
 * Fetch a single complaint by ID.
 */
export const getComplaintById = async (complaintId) => {
  if (!complaintId) return null;
  const docRef = doc(db, 'complaints', complaintId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
};

/**
 * Subscribe to real-time updates for a single complaint.
 */
export const subscribeToComplaint = (complaintId, callback, onError) => {
  const docRef = doc(db, 'complaints', complaintId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    },
    onError
  );
};

/**
 * Fetch all history records for a complaint ordered chronologically.
 */
export const getComplaintHistory = async (complaintId) => {
  if (!complaintId) return [];
  const historyRef = collection(db, 'complaints', complaintId, 'history');
  const q = query(historyRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

/**
 * Subscribe to real-time history records for a complaint.
 */
export const subscribeToComplaintHistory = (complaintId, callback, onError) => {
  const historyRef = collection(db, 'complaints', complaintId, 'history');
  const q = query(historyRef, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      callback(records);
    },
    onError
  );
};

/**
 * Cancel a complaint.
 * Non-negotiable requirement: A customer can ONLY cancel a complaint if the status is currently 'open'.
 * If already assigned or in progress, cancellation is disallowed.
 */
export const cancelComplaint = async (complaintId, customerUser, reason) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  const currentSnap = await getDoc(complaintRef);

  if (!currentSnap.exists()) {
    throw new Error('Complaint not found.');
  }

  const currentData = currentSnap.data();

  // Validate ownership
  if (currentData.customerId !== customerUser.uid) {
    throw new Error('You do not have permission to cancel this complaint.');
  }

  // Validate status condition
  if (currentData.status !== COMPLAINT_STATUS.OPEN) {
    throw new Error(
      `Complaints cannot be cancelled once they are ${currentData.status.replace('_', ' ')}. Please contact support.`
    );
  }

  // 1. Update status to cancelled
  await updateDoc(complaintRef, {
    status: COMPLAINT_STATUS.CANCELLED,
    updatedAt: serverTimestamp(),
  });

  // 2. Add history record
  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: customerUser.uid,
    changedByName: customerUser.displayName || 'Customer',
    changedByRole: ROLES.CUSTOMER,
    fromStatus: COMPLAINT_STATUS.OPEN,
    toStatus: COMPLAINT_STATUS.CANCELLED,
    note: reason ? `Cancelled by customer: ${reason}` : 'Cancelled by customer.',
    createdAt: serverTimestamp(),
  });

  // 3. Add audit log
  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: customerUser.uid,
      actorName: customerUser.displayName || 'Customer',
      actorRole: ROLES.CUSTOMER,
      action: 'COMPLAINT_CANCELLED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: { reason },
      createdAt: serverTimestamp(),
    });
  } catch (auditErr) {
    console.warn('Audit log write error on cancellation:', auditErr);
  }

  // 4. Notification for technician if assigned
  if (currentData.assignedTechnicianId) {
    try {
      await createNotification({
        recipientId: currentData.assignedTechnicianId,
        title: 'Complaint Cancelled by Customer',
        message: `Ticket #${complaintId.slice(0, 8)} (${currentData.category}) was cancelled by the customer.`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    } catch (notifErr) {
      console.warn('Notification send error on cancellation:', notifErr);
    }
  }

  return true;
};

/**
 * Fetch summary metrics for customer dashboard.
 */
export const getCustomerMetrics = async (customerId) => {
  if (!customerId) return { total: 0, open: 0, inProgress: 0, resolved: 0 };

  const q = query(collection(db, 'complaints'), where('customerId', '==', customerId));
  const snapshot = await getDocs(q);

  let total = 0;
  let open = 0;
  let inProgress = 0;
  let resolved = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    total += 1;
    if (data.status === COMPLAINT_STATUS.OPEN || data.status === COMPLAINT_STATUS.ASSIGNED) {
      open += 1;
    } else if (
      data.status === COMPLAINT_STATUS.ACCEPTED ||
      data.status === COMPLAINT_STATUS.IN_PROGRESS
    ) {
      inProgress += 1;
    } else if (
      data.status === COMPLAINT_STATUS.RESOLVED ||
      data.status === COMPLAINT_STATUS.CLOSED
    ) {
      resolved += 1;
    }
  });

  return { total, open, inProgress, resolved };
};

/**
 * Fetch comprehensive metrics for Admin Dashboard.
 * Counts tickets across all status categories and critical priority.
 */
export const getAdminMetrics = async () => {
  const snapshot = await getDocs(collection(db, 'complaints'));

  const metrics = {
    total: 0,
    open: 0,
    assigned: 0,
    accepted: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
    critical: 0,
  };

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    metrics.total += 1;

    if (data.status === COMPLAINT_STATUS.OPEN) metrics.open += 1;
    else if (data.status === COMPLAINT_STATUS.ASSIGNED) metrics.assigned += 1;
    else if (data.status === COMPLAINT_STATUS.ACCEPTED) metrics.accepted += 1;
    else if (data.status === COMPLAINT_STATUS.IN_PROGRESS) metrics.inProgress += 1;
    else if (data.status === COMPLAINT_STATUS.RESOLVED) metrics.resolved += 1;
    else if (data.status === COMPLAINT_STATUS.CLOSED) metrics.closed += 1;
    else if (data.status === COMPLAINT_STATUS.CANCELLED) metrics.cancelled += 1;

    if (data.priority === 'critical' && data.status !== COMPLAINT_STATUS.CLOSED && data.status !== COMPLAINT_STATUS.CANCELLED) {
      metrics.critical += 1;
    }
  });

  return metrics;
};

/**
 * Admin Master Query for all complaints.
 * Supports filtering by status, priority, category, technicianId, sorting, and pagination.
 */
export const getAdminComplaints = async ({
  status = 'all',
  priority = 'all',
  category = 'all',
  technicianId = 'all',
  sortOrder = 'desc',
  pageSize = 15,
  lastVisibleDoc = null,
} = {}) => {
  const hasExtraFilters =
    status !== 'all' ||
    priority !== 'all' ||
    category !== 'all' ||
    technicianId !== 'all';

  const baseQueryConstraints = [];

  if (!hasExtraFilters) {
    baseQueryConstraints.push(orderBy('createdAt', sortOrder === 'asc' ? 'asc' : 'desc'));

    if (lastVisibleDoc) {
      baseQueryConstraints.push(startAfter(lastVisibleDoc));
    }

    baseQueryConstraints.push(limit(pageSize + 1));
  }

  const q = query(collection(db, 'complaints'), ...baseQueryConstraints);
  const snapshot = await getDocs(q);

  let complaints = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (hasExtraFilters) {
    complaints = complaints.filter((complaint) => {
      const matchesStatus = status === 'all' || complaint.status === status;
      const matchesPriority = priority === 'all' || (complaint.priority || '').toLowerCase() === priority.toLowerCase();
      const matchesCategory = category === 'all' || complaint.category === category;
      const matchesTechnician =
        technicianId === 'all' ||
        (technicianId === 'unassigned' ? !complaint.assignedTechnicianId : complaint.assignedTechnicianId === technicianId);
      return matchesStatus && matchesPriority && matchesCategory && matchesTechnician;
    });

    complaints.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });
  }

  const hasMore = complaints.length > pageSize;
  const visibleComplaints = hasMore ? complaints.slice(0, pageSize) : complaints;
  const nextLastDoc = visibleComplaints.length > 0 ? snapshot.docs.find((docSnap) => docSnap.id === visibleComplaints[visibleComplaints.length - 1].id) || null : null;

  return {
    complaints: visibleComplaints,
    lastDoc: nextLastDoc,
    hasMore,
  };
};

/**
 * MANUAL Technician Assignment by Admin.
 * Strictly checks:
 * 1. Admin authority.
 * 2. Updates assignedTechnicianId and assignedTechnicianName.
 * 3. Transitions status from 'open' to 'assigned'.
 * 4. Records assignment history record with admin name, timestamp, and optional reason.
 * 5. Creates audit log.
 * 6. Creates notification for technician.
 */
export const assignTechnicianToComplaint = async (
  complaintId,
  technician,
  adminUser,
  { note = '', isReassignment = false } = {}
) => {
  if (!complaintId || !technician || !adminUser) {
    throw new Error('Complaint, Technician, and Admin details are required.');
  }

  const assignTechnician = httpsCallable(functions, 'assignTechnician');
  const response = await assignTechnician({
    complaintId,
    technicianId: technician.uid,
    assignmentNote: note,
  });

  return response.data;
};

/**
 * Update Admin Internal Notes on a complaint.
 */
export const updateComplaintInternalNotes = async (complaintId, internalNotes, adminUser) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  await updateDoc(complaintRef, {
    internalNotes,
    updatedAt: serverTimestamp(),
  });

  // History note
  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: adminUser.uid,
    changedByName: adminUser.displayName || 'Administrator',
    changedByRole: ROLES.ADMIN,
    fromStatus: null,
    toStatus: null,
    note: 'Internal operational notes updated by administrator.',
    createdAt: serverTimestamp(),
  });

  return true;
};

/**
 * Close a complaint (Admin action).
 */
export const closeComplaintByAdmin = async (complaintId, adminUser, closureNotes = '') => {
  const complaintRef = doc(db, 'complaints', complaintId);
  const currentSnap = await getDoc(complaintRef);
  if (!currentSnap.exists()) throw new Error('Complaint not found.');

  const currentData = currentSnap.data();

  const updatePayload = {
    status: COMPLAINT_STATUS.CLOSED,
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (closureNotes) {
    updatePayload.internalNotes = currentData.internalNotes
      ? `${currentData.internalNotes}\n[Closure Note]: ${closureNotes}`
      : `[Closure Note]: ${closureNotes}`;
  }

  await updateDoc(complaintRef, updatePayload);

  // History record
  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: adminUser.uid,
    changedByName: adminUser.displayName || 'Administrator',
    changedByRole: ROLES.ADMIN,
    fromStatus: currentData.status,
    toStatus: COMPLAINT_STATUS.CLOSED,
    note: closureNotes ? `Ticket verified and closed: ${closureNotes}` : 'Ticket verified and closed by administrator.',
    createdAt: serverTimestamp(),
  });

  // Audit log
  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: adminUser.uid,
      actorName: adminUser.displayName || 'Administrator',
      actorRole: ROLES.ADMIN,
      action: 'COMPLAINT_CLOSED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: { closureNotes },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit log creation error:', err);
  }

  // Notification for Customer & Technician
  try {
    if (currentData.customerId) {
      await createNotification({
        recipientId: currentData.customerId,
        title: 'Complaint Verified & Closed',
        message: `Your ticket #${complaintId.slice(0, 8)} has been verified and closed by administration.`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    }
    if (currentData.assignedTechnicianId) {
      await createNotification({
        recipientId: currentData.assignedTechnicianId,
        title: 'Ticket Closed by Admin',
        message: `Ticket #${complaintId.slice(0, 8)} has been verified and closed.`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    }
  } catch (notifErr) {
    console.warn('Notification error on closure:', notifErr);
  }

  return true;
};

/**
 * ===================================================================
 * TECHNICIAN OPERATIONS & FIELD WORKFLOW SERVICES
 * Enforces: assignedTechnicianId == currentUser.uid
 * ===================================================================
 */

/**
 * Query complaints assigned specifically to a technician.
 * Strict technician isolation enforced.
 */
export const getTechnicianComplaints = async (
  technicianId,
  { tab = 'all', pageSize = 15, lastVisibleDoc = null } = {}
) => {
  if (!technicianId) return { complaints: [], lastDoc: null, hasMore: false };

  const hasExtraFilters = tab !== 'all';
  const baseQueryConstraints = [where('assignedTechnicianId', '==', technicianId)];

  if (!hasExtraFilters) {
    baseQueryConstraints.push(orderBy('createdAt', 'desc'));

    if (lastVisibleDoc) {
      baseQueryConstraints.push(startAfter(lastVisibleDoc));
    }

    baseQueryConstraints.push(limit(pageSize + 1));
  }

  const q = query(collection(db, 'complaints'), ...baseQueryConstraints);
  const snapshot = await getDocs(q);

  let complaints = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));

  if (hasExtraFilters) {
    if (tab === 'assigned') {
      complaints = complaints.filter((c) => c.status === COMPLAINT_STATUS.ASSIGNED);
    } else if (tab === 'active') {
      complaints = complaints.filter((c) =>
        [COMPLAINT_STATUS.ACCEPTED, COMPLAINT_STATUS.IN_PROGRESS].includes(c.status)
      );
    } else if (tab === 'resolved') {
      complaints = complaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED);
    }

    complaints.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  const hasMore = complaints.length > pageSize;
  const visibleComplaints = hasMore ? complaints.slice(0, pageSize) : complaints;
  const nextLastDoc = visibleComplaints.length > 0 ? snapshot.docs.find((docSnap) => docSnap.id === visibleComplaints[visibleComplaints.length - 1].id) || null : null;

  return { complaints: visibleComplaints, lastDoc: nextLastDoc, hasMore };
};

/**
 * Compute metrics for technician workspace.
 */
export const getTechnicianMetrics = async (technicianId) => {
  if (!technicianId) return { newAssignments: 0, active: 0, resolved: 0, critical: 0 };

  const q = query(
    collection(db, 'complaints'),
    where('assignedTechnicianId', '==', technicianId)
  );
  const snapshot = await getDocs(q);

  let newAssignments = 0;
  let active = 0;
  let resolved = 0;
  let critical = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.status === COMPLAINT_STATUS.ASSIGNED) {
      newAssignments += 1;
    } else if (
      data.status === COMPLAINT_STATUS.ACCEPTED ||
      data.status === COMPLAINT_STATUS.IN_PROGRESS
    ) {
      active += 1;
    } else if (data.status === COMPLAINT_STATUS.RESOLVED) {
      resolved += 1;
    }

    if (
      data.priority === 'critical' &&
      data.status !== COMPLAINT_STATUS.RESOLVED &&
      data.status !== COMPLAINT_STATUS.CLOSED
    ) {
      critical += 1;
    }
  });

  return { newAssignments, active, resolved, critical };
};

/**
 * Technician Action: Accept Assignment
 * Transition: assigned -> accepted
 * Records acceptedAt timestamp.
 */
export const acceptComplaintByTechnician = async (complaintId, technicianUser) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(complaintRef);
  if (!snap.exists()) throw new Error('Complaint not found.');

  const data = snap.data();
  if (data.assignedTechnicianId !== technicianUser.uid) {
    throw new Error('Access Denied: Ticket is not assigned to you.');
  }

  await updateDoc(complaintRef, {
    status: COMPLAINT_STATUS.ACCEPTED,
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: technicianUser.uid,
    changedByName: technicianUser.displayName || 'Technician',
    changedByRole: ROLES.TECHNICIAN,
    fromStatus: COMPLAINT_STATUS.ASSIGNED,
    toStatus: COMPLAINT_STATUS.ACCEPTED,
    note: 'Technician acknowledged dispatch and accepted the assignment.',
    createdAt: serverTimestamp(),
  });

  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: technicianUser.uid,
      actorName: technicianUser.displayName || 'Technician',
      actorRole: ROLES.TECHNICIAN,
      action: 'STATUS_CHANGED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: { fromStatus: COMPLAINT_STATUS.ASSIGNED, toStatus: COMPLAINT_STATUS.ACCEPTED },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit error:', err);
  }

  // Notification for customer
  try {
    if (data.customerId) {
      await createNotification({
        recipientId: data.customerId,
        title: 'Technician Accepted Complaint',
        message: `Technician ${technicianUser.displayName || 'Technician'} accepted your ticket #${complaintId.slice(0, 8)} and is preparing for dispatch.`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    }
  } catch (notifErr) {
    console.warn('Notification error on accept:', notifErr);
  }

  return true;
};

/**
 * Technician Action: Start Work
 * Transition: accepted -> in_progress
 * Records inProgressAt timestamp.
 */
export const startWorkByTechnician = async (complaintId, technicianUser) => {
  const complaintRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(complaintRef);
  if (!snap.exists()) throw new Error('Complaint not found.');

  const data = snap.data();
  if (data.assignedTechnicianId !== technicianUser.uid) {
    throw new Error('Access Denied: Ticket is not assigned to you.');
  }

  await updateDoc(complaintRef, {
    status: COMPLAINT_STATUS.IN_PROGRESS,
    inProgressAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: technicianUser.uid,
    changedByName: technicianUser.displayName || 'Technician',
    changedByRole: ROLES.TECHNICIAN,
    fromStatus: data.status,
    toStatus: COMPLAINT_STATUS.IN_PROGRESS,
    note: 'Field investigation and technical diagnostics started.',
    createdAt: serverTimestamp(),
  });

  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: technicianUser.uid,
      actorName: technicianUser.displayName || 'Technician',
      actorRole: ROLES.TECHNICIAN,
      action: 'STATUS_CHANGED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: { fromStatus: data.status, toStatus: COMPLAINT_STATUS.IN_PROGRESS },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit error:', err);
  }

  // Notification for customer
  try {
    if (data.customerId) {
      await createNotification({
        recipientId: data.customerId,
        title: 'Field Work Started',
        message: `Technician ${technicianUser.displayName || 'Technician'} started active diagnostics on ticket #${complaintId.slice(0, 8)}.`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    }
  } catch (notifErr) {
    console.warn('Notification error on start work:', notifErr);
  }

  return true;
};

/**
 * Technician Action: Mark as Resolved
 * Non-negotiable requirement: Requires MANDATORY non-empty resolution notes!
 * Transition: in_progress -> resolved
 * Records resolvedAt timestamp.
 */
export const resolveComplaintByTechnician = async (
  complaintId,
  technicianUser,
  resolutionNotes
) => {
  if (!resolutionNotes || resolutionNotes.trim().length < 10) {
    throw new Error('Resolution notes are mandatory (minimum 10 characters required).');
  }

  const complaintRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(complaintRef);
  if (!snap.exists()) throw new Error('Complaint not found.');

  const data = snap.data();
  if (data.assignedTechnicianId !== technicianUser.uid) {
    throw new Error('Access Denied: Ticket is not assigned to you.');
  }

  await updateDoc(complaintRef, {
    status: COMPLAINT_STATUS.RESOLVED,
    resolutionNotes: resolutionNotes.trim(),
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: technicianUser.uid,
    changedByName: technicianUser.displayName || 'Technician',
    changedByRole: ROLES.TECHNICIAN,
    fromStatus: data.status,
    toStatus: COMPLAINT_STATUS.RESOLVED,
    note: `Work completed and resolved: ${resolutionNotes.trim()}`,
    createdAt: serverTimestamp(),
  });

  try {
    const auditColRef = collection(db, 'auditLogs');
    await addDoc(auditColRef, {
      actorId: technicianUser.uid,
      actorName: technicianUser.displayName || 'Technician',
      actorRole: ROLES.TECHNICIAN,
      action: 'COMPLAINT_RESOLVED',
      targetType: 'complaint',
      targetId: complaintId,
      metadata: { resolutionNotes: resolutionNotes.trim() },
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Audit error:', err);
  }

  // Notification for customer
  try {
    if (data.customerId) {
      await createNotification({
        recipientId: data.customerId,
        title: 'Complaint Resolved',
        message: `Technician ${technicianUser.displayName || 'Technician'} marked ticket #${complaintId.slice(0, 8)} as resolved: ${resolutionNotes.trim()}`,
        type: 'status_change',
        relatedComplaintId: complaintId,
      });
    }
  } catch (notifErr) {
    console.warn('Notification error on resolve:', notifErr);
  }

  return true;
};

/**
 * Technician Action: Add Work Note / Diagnostic Update
 */
export const addWorkNoteByTechnician = async (complaintId, technicianUser, workNote) => {
  if (!workNote || workNote.trim().length === 0) {
    throw new Error('Work note cannot be empty.');
  }

  const complaintRef = doc(db, 'complaints', complaintId);
  const snap = await getDoc(complaintRef);
  if (!snap.exists()) throw new Error('Complaint not found.');

  const data = snap.data();
  if (data.assignedTechnicianId !== technicianUser.uid) {
    throw new Error('Access Denied: Ticket is not assigned to you.');
  }

  await updateDoc(complaintRef, {
    updatedAt: serverTimestamp(),
  });

  const historyColRef = collection(db, 'complaints', complaintId, 'history');
  await addDoc(historyColRef, {
    complaintId,
    changedBy: technicianUser.uid,
    changedByName: technicianUser.displayName || 'Technician',
    changedByRole: ROLES.TECHNICIAN,
    fromStatus: null,
    toStatus: null,
    note: `Work Log: ${workNote.trim()}`,
    createdAt: serverTimestamp(),
  });

  return true;
};

