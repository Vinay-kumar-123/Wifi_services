const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const FUNCTION_REGION = 'us-central1';

const requireActiveAdmin = async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin' || callerDoc.data().isActive !== true) {
    throw new HttpsError('permission-denied', 'Only active administrators can perform this operation.');
  }

  return callerDoc;
};

/**
 * Privileged operation: Create a technician without changing the caller's
 * browser Auth session. The Firebase Auth user is created by Admin SDK only.
 */
exports.createTechnician = onCall({ region: FUNCTION_REGION }, async (request) => {
  const callerDoc = await requireActiveAdmin(request);
  const {
    fullName,
    email,
    phone,
    address = '',
    employeeId = '',
    serviceArea = '',
    specialization = '',
    photoURL = null,
  } = request.data || {};

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedEmployeeId = String(employeeId || '').trim();

  if (!String(fullName || '').trim() || !normalizedEmail || !String(phone || '').trim()) {
    throw new HttpsError('invalid-argument', 'Full name, email address, and phone number are required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }

  try {
    await admin.auth().getUserByEmail(normalizedEmail);
    throw new HttpsError('already-exists', 'A user with this email already exists.');
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    if (error.code !== 'auth/user-not-found') {
      throw new HttpsError('internal', 'Unable to validate the technician email address.');
    }
  }

  if (normalizedEmployeeId) {
    const employeeSnapshot = await db.collection('users')
      .where('employeeId', '==', normalizedEmployeeId)
      .limit(1)
      .get();
    if (!employeeSnapshot.empty) {
      throw new HttpsError('already-exists', 'A user with this employee ID already exists.');
    }
  }

  let authUser = null;
  let profileCreated = false;
  try {
    authUser = await admin.auth().createUser({
      email: normalizedEmail,
      displayName: String(fullName).trim(),
      photoURL: photoURL || undefined,
      disabled: false,
    });

    const profile = {
      uid: authUser.uid,
      displayName: String(fullName).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      address: String(address || '').trim(),
      employeeId: normalizedEmployeeId,
      serviceArea: String(serviceArea || '').trim(),
      specialization: String(specialization || '').trim(),
      role: 'technician',
      isActive: true,
      photoURL: photoURL || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.auth().generatePasswordResetLink(normalizedEmail);
    await db.collection('users').doc(authUser.uid).set(profile);
    profileCreated = true;

    try {
      await db.collection('auditLogs').add({
        actorId: request.auth.uid,
        actorName: callerDoc.data().displayName || 'Administrator',
        actorRole: 'admin',
        action: 'TECHNICIAN_CREATED',
        targetType: 'user',
        targetId: authUser.uid,
        metadata: { email: normalizedEmail, employeeId: normalizedEmployeeId, role: 'technician' },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (auditError) {
      console.warn('Technician creation audit log warning:', auditError);
    }

    return {
      uid: authUser.uid,
      profile: {
        uid: authUser.uid,
        displayName: profile.displayName,
        email: profile.email,
        role: profile.role,
        isActive: profile.isActive,
      },
    };
  } catch (error) {
    console.error('Technician creation failed:', error);
    if (authUser && !profileCreated) {
      try {
        await admin.auth().deleteUser(authUser.uid);
      } catch (rollbackError) {
        console.error('Technician Auth rollback failed:', rollbackError);
      }
    }
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(error.code === 'auth/email-already-exists' ? 'already-exists' : 'internal', error.message || 'Unable to create technician account.');
  }
});

/**
 * Privileged operation: Change User Role
 */
exports.changeUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerUid = request.auth.uid;
  const { targetUserId, newRole } = request.data;

  const allowedRoles = ['customer', 'technician', 'admin'];
  if (!targetUserId || !newRole || !allowedRoles.includes(newRole)) {
    throw new HttpsError('invalid-argument', 'Invalid targetUserId or newRole provided.');
  }

  if (callerUid === targetUserId) {
    throw new HttpsError('permission-denied', 'Administrators cannot alter their own role.');
  }

  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin' || !callerDoc.data().isActive) {
    throw new HttpsError('permission-denied', 'Only active administrators can change user roles.');
  }

  const targetUserRef = db.collection('users').doc(targetUserId);
  const targetDoc = await targetUserRef.get();
  if (!targetDoc.exists) {
    throw new HttpsError('not-found', 'Target user document does not exist.');
  }

  const oldRole = targetDoc.data().role;
  await targetUserRef.update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('auditLogs').add({
    actorId: callerUid,
    actorName: callerDoc.data().displayName || 'Administrator',
    actorRole: 'admin',
    action: 'ROLE_CHANGED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: {
      fromRole: oldRole,
      toRole: newRole,
      targetEmail: targetDoc.data().email,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Role successfully updated to ${newRole}` };
});

/**
 * Privileged operation: Toggle User Active Status
 */
exports.toggleUserActiveStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerUid = request.auth.uid;
  const { targetUserId, isActive } = request.data;

  if (!targetUserId || typeof isActive !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Invalid targetUserId or isActive flag.');
  }

  if (callerUid === targetUserId) {
    throw new HttpsError('permission-denied', 'Administrators cannot deactivate their own account.');
  }

  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin' || !callerDoc.data().isActive) {
    throw new HttpsError('permission-denied', 'Only active administrators can modify user status.');
  }

  const targetUserRef = db.collection('users').doc(targetUserId);
  await targetUserRef.update({
    isActive,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    await admin.auth().updateUser(targetUserId, { disabled: !isActive });
  } catch (authErr) {
    console.warn('Firebase Auth state toggle warning:', authErr);
  }

  await db.collection('auditLogs').add({
    actorId: callerUid,
    actorName: callerDoc.data().displayName || 'Administrator',
    actorRole: 'admin',
    action: 'USER_STATUS_TOGGLED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { isActive },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `User status successfully updated to ${isActive ? 'active' : 'inactive'}` };
});

/**
 * Privileged operation: Manual Technician Assignment
 */
exports.assignTechnician = onCall({ region: FUNCTION_REGION }, async (request) => {
  const callerDoc = await requireActiveAdmin(request);

  const callerUid = request.auth.uid;
  const { complaintId, technicianId, assignmentNote } = request.data;

  if (!complaintId || !technicianId) {
    throw new HttpsError('invalid-argument', 'Complaint ID and Technician ID are required.');
  }

  const techDoc = await db.collection('users').doc(technicianId).get();
  if (!techDoc.exists || techDoc.data().role !== 'technician' || !techDoc.data().isActive) {
    throw new HttpsError('invalid-argument', 'Selected user is not an active technician.');
  }

  const technicianName = techDoc.data().displayName || 'Technician';

  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new HttpsError('not-found', 'Complaint not found.');
  }

  const complaintData = complaintDoc.data();
  const isReassignment = Boolean(complaintData.assignedTechnicianId);
  const previousTechName = complaintData.assignedTechnicianName;

  const updateData = {
    assignedTechnicianId: technicianId,
    assignedTechnicianName: technicianName,
    assignedTechnicianEmail: techDoc.data().email || null,
    assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    assignedBy: callerUid,
    status: 'assigned',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await complaintRef.update(updateData);

  const historyNote = isReassignment
    ? `Reassigned from ${previousTechName} to ${technicianName} by admin.${assignmentNote ? ` Note: ${assignmentNote}` : ''}`
    : `Manually assigned to technician ${technicianName} by admin.${assignmentNote ? ` Note: ${assignmentNote}` : ''}`;

  await complaintRef.collection('history').add({
    complaintId,
    changedBy: callerUid,
    changedByName: callerDoc.data().displayName || 'Administrator',
    changedByRole: 'admin',
    fromStatus: complaintData.status,
    toStatus: updateData.status || complaintData.status,
    note: historyNote,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('auditLogs').add({
    actorId: callerUid,
    actorName: callerDoc.data().displayName || 'Administrator',
    actorRole: 'admin',
    action: isReassignment ? 'TECHNICIAN_REASSIGNED' : 'TECHNICIAN_ASSIGNED',
    targetType: 'complaint',
    targetId: complaintId,
    metadata: {
      technicianId,
      technicianName,
      technicianEmail: techDoc.data().email || null,
      previousTechnician: previousTechName || null,
      note: assignmentNote || null,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('notifications').add({
    recipientId: technicianId,
    title: isReassignment ? 'Complaint Reassigned to You' : 'New Complaint Assigned',
    message: `You have been assigned complaint #${complaintId.slice(0, 8)} (${complaintData.category}) at ${complaintData.address}.`,
    type: 'assigned',
    relatedComplaintId: complaintId,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Also notify the customer about the technician assignment
  if (complaintData.customerId) {
    await db.collection('notifications').add({
      recipientId: complaintData.customerId,
      title: isReassignment ? 'Technician Reassigned to Your Complaint' : 'Technician Assigned to Your Complaint',
      message: `Technician ${technicianName} has been assigned to your ticket #${complaintId.slice(0, 8)}.`,
      type: 'status_change',
      relatedComplaintId: complaintId,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return {
    success: true,
    message: `Technician ${technicianName} successfully assigned to ticket.`,
  };
});

/**
 * Privileged operation: Close Complaint
 */
exports.closeComplaint = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerUid = request.auth.uid;
  const { complaintId, closureNotes } = request.data;

  if (!complaintId) {
    throw new HttpsError('invalid-argument', 'Complaint ID is required.');
  }

  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin' || !callerDoc.data().isActive) {
    throw new HttpsError('permission-denied', 'Only authorized administrators can close complaints.');
  }

  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new HttpsError('not-found', 'Complaint not found.');
  }

  const complaintData = complaintDoc.data();

  await complaintRef.update({
    status: 'closed',
    closedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    internalNotes: closureNotes
      ? `${complaintData.internalNotes || ''}\n[Closure Note]: ${closureNotes}`.trim()
      : (complaintData.internalNotes || ''),
  });

  await complaintRef.collection('history').add({
    complaintId,
    changedBy: callerUid,
    changedByName: callerDoc.data().displayName || 'Administrator',
    changedByRole: 'admin',
    fromStatus: complaintData.status,
    toStatus: 'closed',
    note: closureNotes ? `Ticket verified and closed: ${closureNotes}` : 'Ticket verified and closed by administrator.',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('auditLogs').add({
    actorId: callerUid,
    actorName: callerDoc.data().displayName || 'Administrator',
    actorRole: 'admin',
    action: 'COMPLAINT_CLOSED',
    targetType: 'complaint',
    targetId: complaintId,
    metadata: { closureNotes },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: 'Complaint successfully closed.' };
});

/**
 * Privileged operation: Technician Status Transition
 * Enforces exact status flow:
 * - assigned -> accepted
 * - accepted -> in_progress
 * - in_progress -> resolved (requires mandatory non-empty resolution notes)
 * Technicians can ONLY update tickets where assignedTechnicianId == callerUid
 */
exports.technicianUpdateStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const callerUid = request.auth.uid;
  const { complaintId, targetStatus, resolutionNotes, note } = request.data;

  if (!complaintId || !targetStatus) {
    throw new HttpsError('invalid-argument', 'Complaint ID and target status are required.');
  }

  // 1. Verify caller is active technician
  const callerDoc = await db.collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'technician' || !callerDoc.data().isActive) {
    throw new HttpsError('permission-denied', 'Only active technicians can perform this action.');
  }

  const technicianName = callerDoc.data().displayName || 'Technician';

  // 2. Fetch complaint and verify assigned ownership
  const complaintRef = db.collection('complaints').doc(complaintId);
  const complaintDoc = await complaintRef.get();
  if (!complaintDoc.exists) {
    throw new HttpsError('not-found', 'Complaint not found.');
  }

  const complaintData = complaintDoc.data();
  if (complaintData.assignedTechnicianId !== callerUid) {
    throw new HttpsError('permission-denied', 'You can only update complaints assigned to your account.');
  }

  // 3. Enforce valid state machine transitions
  const currentStatus = complaintData.status;
  const updatePayload = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  let historyNote = note || '';

  if (targetStatus === 'accepted') {
    if (currentStatus !== 'assigned') {
      throw new HttpsError('failed-precondition', `Cannot accept ticket currently in '${currentStatus}' status.`);
    }
    updatePayload.status = 'accepted';
    updatePayload.acceptedAt = admin.firestore.FieldValue.serverTimestamp();
    historyNote = historyNote || 'Assignment accepted by technician.';
  } else if (targetStatus === 'in_progress') {
    if (currentStatus !== 'accepted' && currentStatus !== 'assigned') {
      throw new HttpsError('failed-precondition', `Cannot start work from '${currentStatus}' status.`);
    }
    updatePayload.status = 'in_progress';
    updatePayload.inProgressAt = admin.firestore.FieldValue.serverTimestamp();
    historyNote = historyNote || 'Field investigation and technical work started.';
  } else if (targetStatus === 'resolved') {
    // Firestore rules only allow in_progress → resolved
    if (currentStatus !== 'in_progress') {
      throw new HttpsError('failed-precondition', `Cannot resolve ticket from '${currentStatus}'. Ticket must be in_progress first.`);
    }
    // Strict mandatory resolution notes requirement
    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      throw new HttpsError('invalid-argument', 'Resolution notes are mandatory (minimum 10 characters).');
    }
    updatePayload.status = 'resolved';
    updatePayload.resolutionNotes = resolutionNotes.trim();
    updatePayload.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
    historyNote = `Issue resolved: ${resolutionNotes.trim()}`;
  } else {
    throw new HttpsError('invalid-argument', `Technicians cannot transition tickets to '${targetStatus}'.`);
  }

  // 4. Update complaint
  await complaintRef.update(updatePayload);

  // 5. Create History record
  await complaintRef.collection('history').add({
    complaintId,
    changedBy: callerUid,
    changedByName: technicianName,
    changedByRole: 'technician',
    fromStatus: currentStatus,
    toStatus: targetStatus,
    note: historyNote,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 6. Create Audit log
  await db.collection('auditLogs').add({
    actorId: callerUid,
    actorName: technicianName,
    actorRole: 'technician',
    action: targetStatus === 'resolved' ? 'COMPLAINT_RESOLVED' : 'STATUS_CHANGED',
    targetType: 'complaint',
    targetId: complaintId,
    metadata: {
      fromStatus: currentStatus,
      toStatus: targetStatus,
      resolutionNotes: resolutionNotes || null,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: `Status updated to ${targetStatus}` };
});
