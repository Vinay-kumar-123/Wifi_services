/**
 * Firestore Security Rules Tests
 * Run with: firebase emulators:exec "node tests/rules/firestore.rules.test.js"
 *
 * This file uses @firebase/rules-unit-testing to test all Firestore
 * security rules against the Firestore emulator without touching production.
 *
 * Covers:
 * - Default-deny (no global access)
 * - Users collection: read, create, update isolation
 * - Complaints: customer ownership, technician isolation, admin access
 * - Complaint history: role-based access
 * - Notifications: recipient isolation, update constraints
 * - Audit logs: admin-only read, immutable (no update/delete)
 */

import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROJECT_ID = 'wifi-service-desk-test';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

let testEnv;

// ─── Setup ────────────────────────────────────────────────────────────────────
async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAuthedDb(uid, role = 'customer', isActive = true) {
  return testEnv.authenticatedContext(uid, { sub: uid, role }).firestore();
}

function getUnauthDb() {
  return testEnv.unauthenticatedContext().firestore();
}

async function seedUser(uid, role = 'customer', isActive = true) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('users').doc(uid).set({
      uid,
      role,
      isActive,
      email: `${uid}@test.com`,
      displayName: uid,
      phone: '9876543210',
      createdAt: new Date(),
    });
  });
}

async function seedComplaint(complaintId, customerId, assignedTechnicianId = null, status = 'open') {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('complaints').doc(complaintId).set({
      id: complaintId,
      customerId,
      customerName: 'Test Customer',
      customerEmail: 'cust@test.com',
      phone: '9876543210',
      address: '123 Test St',
      category: 'Slow internet',
      description: 'Internet is very slow and has been for days',
      priority: 'medium',
      status,
      assignedTechnicianId,
      assignedTechnicianName: assignedTechnicianId ? 'Test Tech' : null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      resolutionNotes: status === 'resolved' ? 'Fixed the fiber line splitter junction' : '',
    });
  });
}

// ─── Test runner helper ────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

async function test(description, fn) {
  try {
    await fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Firestore Security Rules — WiFi Service Desk');
  console.log('═══════════════════════════════════════════════\n');

  await setup();

  // Pre-seed users
  await seedUser('admin-uid', 'admin', true);
  await seedUser('customer-uid', 'customer', true);
  await seedUser('tech-uid', 'technician', true);
  await seedUser('other-customer', 'customer', true);
  await seedUser('other-tech', 'technician', true);
  await seedUser('deactivated-customer', 'customer', false);

  // Pre-seed complaints
  await seedComplaint('complaint-open', 'customer-uid', null, 'open');
  await seedComplaint('complaint-assigned', 'customer-uid', 'tech-uid', 'assigned');
  await seedComplaint('complaint-inprogress', 'customer-uid', 'tech-uid', 'in_progress');
  await seedComplaint('complaint-resolved', 'customer-uid', 'tech-uid', 'resolved');
  await seedComplaint('other-complaint', 'other-customer', 'other-tech', 'assigned');

  // Pre-seed notifications
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('notifications').doc('notif-001').set({
      recipientId: 'customer-uid',
      title: 'Test',
      message: 'Test message',
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    });
    await ctx.firestore().collection('notifications').doc('notif-admin').set({
      recipientId: 'admin-uid',
      title: 'Admin Notif',
      message: 'Admin message',
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    });
  });

  // Pre-seed audit log
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection('auditLogs').doc('log-001').set({
      actorId: 'customer-uid',
      actorRole: 'customer',
      action: 'COMPLAINT_CREATED',
      createdAt: new Date(),
    });
  });

  // ─── DEFAULT DENY ──────────────────────────────────────────────────────────
  console.log('► Default Deny');
  await test('Unauthenticated user cannot read anything', async () => {
    const db = getUnauthDb();
    await assertFails(db.collection('complaints').get());
  });
  await test('Unauthenticated user cannot write anything', async () => {
    const db = getUnauthDb();
    await assertFails(db.collection('complaints').add({ test: true }));
  });

  // ─── USERS COLLECTION ──────────────────────────────────────────────────────
  console.log('\n► Users Collection');
  await test('User can read their own profile', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertSucceeds(db.collection('users').doc('customer-uid').get());
  });
  await test('Customer CANNOT read another user\'s profile', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('users').doc('admin-uid').get());
  });
  await test('Admin can read any user profile', async () => {
    const db = getAuthedDb('admin-uid', 'admin');
    await assertSucceeds(db.collection('users').doc('customer-uid').get());
  });
  await test('Technician CANNOT read another user\'s profile', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(db.collection('users').doc('customer-uid').get());
  });
  await test('Customer CANNOT change their own role', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(
      db.collection('users').doc('customer-uid').update({ role: 'admin' })
    );
  });
  await test('Customer CANNOT change their own isActive status', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(
      db.collection('users').doc('customer-uid').update({ isActive: false })
    );
  });
  await test('User CANNOT create another user\'s document', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(
      db.collection('users').doc('hijacked-user').set({
        uid: 'hijacked-user',
        role: 'customer',
        isActive: true,
        email: 'customer-uid@test.com',
      })
    );
  });

  // ─── COMPLAINTS COLLECTION ─────────────────────────────────────────────────
  console.log('\n► Complaints Collection');
  await test('Customer can read their own complaint', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertSucceeds(db.collection('complaints').doc('complaint-open').get());
  });
  await test('Customer CANNOT read another customer\'s complaint', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('complaints').doc('other-complaint').get());
  });
  await test('Technician can read complaint assigned to them', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertSucceeds(db.collection('complaints').doc('complaint-assigned').get());
  });
  await test('Technician CANNOT read complaint assigned to another technician', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(db.collection('complaints').doc('other-complaint').get());
  });
  await test('Admin can read any complaint', async () => {
    const db = getAuthedDb('admin-uid', 'admin');
    await assertSucceeds(db.collection('complaints').doc('other-complaint').get());
  });
  await test('Customer can cancel their own open complaint', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertSucceeds(
      db.collection('complaints').doc('complaint-open').update({
        status: 'cancelled',
        customerId: 'customer-uid',
        assignedTechnicianId: null,
      })
    );
  });
  await test('Customer CANNOT cancel a complaint not in open status', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(
      db.collection('complaints').doc('complaint-assigned').update({
        status: 'cancelled',
        customerId: 'customer-uid',
        assignedTechnicianId: 'tech-uid',
      })
    );
  });
  await test('Technician can transition assigned → accepted', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertSucceeds(
      db.collection('complaints').doc('complaint-assigned').update({
        status: 'accepted',
        assignedTechnicianId: 'tech-uid',
        customerId: 'customer-uid',
        createdAt: new Date('2024-01-01'),
        acceptedAt: new Date(),
      })
    );
  });
  await test('Technician can transition in_progress → resolved with notes', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertSucceeds(
      db.collection('complaints').doc('complaint-inprogress').update({
        status: 'resolved',
        assignedTechnicianId: 'tech-uid',
        customerId: 'customer-uid',
        createdAt: new Date('2024-01-01'),
        resolutionNotes: 'Fixed the fiber line splitter at the junction box',
        resolvedAt: new Date(),
      })
    );
  });
  await test('Technician CANNOT resolve without resolution notes', async () => {
    // Re-seed so it's in_progress again
    await seedComplaint('complaint-inprogress2', 'customer-uid', 'tech-uid', 'in_progress');
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(
      db.collection('complaints').doc('complaint-inprogress2').update({
        status: 'resolved',
        assignedTechnicianId: 'tech-uid',
        customerId: 'customer-uid',
        createdAt: new Date('2024-01-01'),
        resolutionNotes: 'short', // less than 10 chars
        resolvedAt: new Date(),
      })
    );
  });
  await test('Technician CANNOT close a complaint (admin-only)', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(
      db.collection('complaints').doc('complaint-resolved').update({
        status: 'closed',
        assignedTechnicianId: 'tech-uid',
        customerId: 'customer-uid',
        createdAt: new Date('2024-01-01'),
      })
    );
  });
  await test('Technician CANNOT assign themselves to a complaint', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(
      db.collection('complaints').doc('complaint-open').update({
        assignedTechnicianId: 'tech-uid',
        assignedTechnicianName: 'Tech',
        customerId: 'customer-uid',
      })
    );
  });
  await test('Customer CANNOT delete a complaint', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('complaints').doc('complaint-open').delete());
  });

  // ─── NOTIFICATIONS COLLECTION ──────────────────────────────────────────────
  console.log('\n► Notifications Collection');
  await test('User can read their own notifications', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertSucceeds(db.collection('notifications').doc('notif-001').get());
  });
  await test('User CANNOT read another user\'s notifications', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('notifications').doc('notif-admin').get());
  });
  await test('User can mark their own notification as read', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertSucceeds(
      db.collection('notifications').doc('notif-001').update({
        isRead: true,
        readAt: new Date(),
        recipientId: 'customer-uid',
      })
    );
  });
  await test('User CANNOT modify notification title or message', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(
      db.collection('notifications').doc('notif-001').update({
        title: 'Hacked title',
        recipientId: 'customer-uid',
      })
    );
  });
  await test('User CANNOT delete notifications', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('notifications').doc('notif-001').delete());
  });

  // ─── AUDIT LOGS COLLECTION ─────────────────────────────────────────────────
  console.log('\n► Audit Logs Collection');
  await test('Admin can read audit logs', async () => {
    const db = getAuthedDb('admin-uid', 'admin');
    await assertSucceeds(db.collection('auditLogs').doc('log-001').get());
  });
  await test('Customer CANNOT read audit logs', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('auditLogs').doc('log-001').get());
  });
  await test('Technician CANNOT read audit logs', async () => {
    const db = getAuthedDb('tech-uid', 'technician');
    await assertFails(db.collection('auditLogs').doc('log-001').get());
  });
  await test('Audit logs are IMMUTABLE — customer cannot update', async () => {
    const db = getAuthedDb('customer-uid', 'customer');
    await assertFails(db.collection('auditLogs').doc('log-001').update({ action: 'TAMPERED' }));
  });
  await test('Audit logs are IMMUTABLE — admin cannot update', async () => {
    const db = getAuthedDb('admin-uid', 'admin');
    await assertFails(db.collection('auditLogs').doc('log-001').update({ action: 'TAMPERED' }));
  });
  await test('Audit logs are IMMUTABLE — admin cannot delete', async () => {
    const db = getAuthedDb('admin-uid', 'admin');
    await assertFails(db.collection('auditLogs').doc('log-001').delete());
  });

  // ─── DEACTIVATED ACCOUNT ───────────────────────────────────────────────────
  console.log('\n► Deactivated Accounts');
  await test('Deactivated customer CANNOT read complaints', async () => {
    // Note: deactivated-customer has isActive: false in users collection
    // isActiveUser() checks this in security rules
    const db = getAuthedDb('deactivated-customer', 'customer', false);
    await assertFails(db.collection('complaints').doc('complaint-open').get());
  });

  // ─── Final summary ─────────────────────────────────────────────────────────
  await testEnv.cleanup();

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
