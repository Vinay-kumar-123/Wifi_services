/**
 * Emulator Seed Script — WiFi Service Desk
 * 
 * Seeds the Firebase Emulator with test data for full workflow verification.
 * 
 * Usage:
 *   1. Start emulators: npm run emulators
 *   2. In a new terminal: node scripts/seed-emulator.js
 * 
 * This creates:
 *   - 1 Admin user
 *   - 2 Customer users
 *   - 2 Technician users
 *   - 5 sample complaints at various stages
 *
 * IMPORTANT: This script targets the LOCAL EMULATOR ONLY.
 * Never run against production Firebase credentials.
 */

const admin = require('firebase-admin');

// Connect to local Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

admin.initializeApp({ projectId: 'wifi-service-desk-dev' });

const db = admin.firestore();
const auth = admin.auth();

const SEED_USERS = [
  {
    uid: 'admin-seed-001',
    email: 'admin@wifiservice.local',
    password: 'Admin@1234',
    displayName: 'Operations Admin',
    role: 'admin',
    phone: '9000000001',
  },
  {
    uid: 'customer-seed-001',
    email: 'customer1@test.local',
    password: 'Customer@1234',
    displayName: 'Alice Johnson',
    role: 'customer',
    phone: '9111111111',
  },
  {
    uid: 'customer-seed-002',
    email: 'customer2@test.local',
    password: 'Customer@1234',
    displayName: 'Bob Smith',
    role: 'customer',
    phone: '9222222222',
  },
  {
    uid: 'tech-seed-001',
    email: 'tech1@wifiservice.local',
    password: 'Tech@1234',
    displayName: 'Carlos Rivera',
    role: 'technician',
    phone: '9333333333',
  },
  {
    uid: 'tech-seed-002',
    email: 'tech2@wifiservice.local',
    password: 'Tech@1234',
    displayName: 'Diana Chen',
    role: 'technician',
    phone: '9444444444',
  },
];

const SEED_COMPLAINTS = [
  {
    id: 'complaint-seed-open',
    customerId: 'customer-seed-001',
    customerName: 'Alice Johnson',
    customerEmail: 'customer1@test.local',
    phone: '9111111111',
    address: '12 Oak Street, Sector 5, Mumbai - 400001',
    category: 'Internet not working',
    description: 'Complete internet outage since morning. No lights on router. Tried restarting multiple times. This has been happening for 3 days.',
    priority: 'high',
    status: 'open',
    assignedTechnicianId: null,
    assignedTechnicianName: null,
    preferredContactMethod: 'phone',
    attachments: [],
    resolutionNotes: '',
    internalNotes: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: null,
    inProgressAt: null,
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: 'complaint-seed-assigned',
    customerId: 'customer-seed-001',
    customerName: 'Alice Johnson',
    customerEmail: 'customer1@test.local',
    phone: '9111111111',
    address: '12 Oak Street, Sector 5, Mumbai - 400001',
    category: 'Slow internet',
    description: 'Internet speed dropped to 2 Mbps. Speed tests consistently show less than 10% of subscribed 100 Mbps plan. Issue persists since last firmware update.',
    priority: 'medium',
    status: 'assigned',
    assignedTechnicianId: 'tech-seed-001',
    assignedTechnicianName: 'Carlos Rivera',
    preferredContactMethod: 'email',
    attachments: [],
    resolutionNotes: '',
    internalNotes: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: null,
    inProgressAt: null,
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: 'complaint-seed-inprogress',
    customerId: 'customer-seed-002',
    customerName: 'Bob Smith',
    customerEmail: 'customer2@test.local',
    phone: '9222222222',
    address: '45 Elm Lane, Block C, Delhi - 110001',
    category: 'Wi-Fi signal problem',
    description: 'Wi-Fi signal drops in bedroom and kitchen. Signal is strong near router but degrades beyond 10 meters. Walls may be causing interference.',
    priority: 'low',
    status: 'in_progress',
    assignedTechnicianId: 'tech-seed-001',
    assignedTechnicianName: 'Carlos Rivera',
    preferredContactMethod: 'phone',
    attachments: [],
    resolutionNotes: '',
    internalNotes: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    inProgressAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedAt: null,
    closedAt: null,
  },
  {
    id: 'complaint-seed-resolved',
    customerId: 'customer-seed-002',
    customerName: 'Bob Smith',
    customerEmail: 'customer2@test.local',
    phone: '9222222222',
    address: '45 Elm Lane, Block C, Delhi - 110001',
    category: 'Router problem',
    description: 'Router keeps overheating and rebooting every hour. Have tried different power outlets but issue persists.',
    priority: 'critical',
    status: 'resolved',
    assignedTechnicianId: 'tech-seed-002',
    assignedTechnicianName: 'Diana Chen',
    preferredContactMethod: 'phone',
    attachments: [],
    resolutionNotes: 'Replaced the customer\'s faulty Netgear router with a new TP-Link Archer model. Configured optimal DNS and power settings. Tested connectivity for 30 minutes without overheating.',
    internalNotes: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    inProgressAt: admin.firestore.FieldValue.serverTimestamp(),
    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    closedAt: null,
  },
  {
    id: 'complaint-seed-critical',
    customerId: 'customer-seed-001',
    customerName: 'Alice Johnson',
    customerEmail: 'customer1@test.local',
    phone: '9111111111',
    address: '12 Oak Street, Sector 5, Mumbai - 400001',
    category: 'Frequent disconnection',
    description: 'Entire building with 24 apartments has no connectivity. ISP fiber line appears cut after road construction yesterday.',
    priority: 'critical',
    status: 'accepted',
    assignedTechnicianId: 'tech-seed-002',
    assignedTechnicianName: 'Diana Chen',
    preferredContactMethod: 'phone',
    attachments: [],
    resolutionNotes: '',
    internalNotes: 'Escalated. Road construction contractor may have cut the fiber. Coordinating with civil team.',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    inProgressAt: null,
    resolvedAt: null,
    closedAt: null,
  },
];

async function seedUsers() {
  console.log('\n[1/2] Seeding users to Auth emulator and Firestore...');
  for (const user of SEED_USERS) {
    try {
      await auth.createUser({
        uid: user.uid,
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      });
    } catch (err) {
      if (err.code === 'auth/uid-already-exists') {
        console.log(`  ⚠ User ${user.email} already exists — skipping Auth create`);
      } else {
        console.error(`  ✗ Failed to create Auth user ${user.email}:`, err.message);
      }
    }

    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      role: user.role,
      isActive: true,
      photoURL: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ ${user.role.padEnd(12)} ${user.displayName} (${user.email})`);
  }
}

async function seedComplaints() {
  console.log('\n[2/2] Seeding complaints to Firestore...');
  for (const complaint of SEED_COMPLAINTS) {
    const { id, ...data } = complaint;
    await db.collection('complaints').doc(id).set({ id, ...data });

    // Add initial history record
    await db.collection('complaints').doc(id).collection('history').add({
      complaintId: id,
      changedBy: complaint.customerId,
      changedByName: complaint.customerName,
      changedByRole: 'customer',
      fromStatus: null,
      toStatus: 'open',
      note: 'Complaint registered by customer.',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`  ✓ [${complaint.status.padEnd(12)}] ${complaint.category} — ${complaint.customerName}`);
  }
}

async function main() {
  console.log('══════════════════════════════════════════════');
  console.log('  WiFi Service Desk — Emulator Seed Script   ');
  console.log('══════════════════════════════════════════════');
  console.log('  ⚠  Targeting LOCAL EMULATOR ONLY');
  console.log(`  Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  console.log(`  Auth:      ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

  await seedUsers();
  await seedComplaints();

  console.log('\n══════════════════════════════════════════════');
  console.log('  Seed complete! Emulator is ready to test.');
  console.log('\n  Login credentials:');
  console.log('  Admin:      admin@wifiservice.local / Admin@1234');
  console.log('  Customer 1: customer1@test.local / Customer@1234');
  console.log('  Customer 2: customer2@test.local / Customer@1234');
  console.log('  Tech 1:     tech1@wifiservice.local / Tech@1234');
  console.log('  Tech 2:     tech2@wifiservice.local / Tech@1234');
  console.log('══════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message);
  process.exit(1);
});
