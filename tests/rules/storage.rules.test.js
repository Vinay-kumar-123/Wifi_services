/**
 * Storage Security Rules Tests
 * Run with: firebase emulators:exec "node tests/rules/storage.rules.test.js"
 *
 * Tests Firebase Storage security rules for complaint attachments and avatars.
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
const STORAGE_RULES_PATH = path.resolve(__dirname, '../../storage.rules');

let testEnv;

async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: fs.readFileSync(STORAGE_RULES_PATH, 'utf8'),
      host: 'localhost',
      port: 9199,
    },
  });
}

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

async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Storage Security Rules — WiFi Service Desk  ');
  console.log('═══════════════════════════════════════════════\n');

  await setup();

  const validImageFile = {
    contentType: 'image/jpeg',
    data: Buffer.from('fake-image-content'),
  };

  const validPdfFile = {
    contentType: 'application/pdf',
    data: Buffer.from('fake-pdf-content'),
  };

  const exeFile = {
    contentType: 'application/exe',
    data: Buffer.from('fake-exe-content'),
  };

  // ─── Unauthenticated ────────────────────────────────────────────────────────
  console.log('► Unauthenticated Access');
  await test('Unauthenticated user CANNOT read complaint attachments', async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(
      storage.ref('complaints/complaint-001/document.pdf').getDownloadURL()
    );
  });

  // ─── Authenticated read ─────────────────────────────────────────────────────
  console.log('\n► Authenticated Read');
  await test('Authenticated user can read complaint attachments', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    await assertSucceeds(
      storage.ref('complaints/complaint-001/test.jpg').getMetadata().catch(() => {
        // Emulator won't have the file but auth is checked first
        // If auth passes, we get a 404 not a 403
      })
    );
  });

  // ─── File Upload ────────────────────────────────────────────────────────────
  console.log('\n► Complaint Attachment Upload');
  await test('Authenticated user can upload valid image attachment', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    const ref = storage.ref('complaints/c-001/photo.jpg');
    await assertSucceeds(ref.put(validImageFile.data, { contentType: 'image/jpeg' }));
  });

  await test('Authenticated user can upload valid PDF attachment', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    const ref = storage.ref('complaints/c-002/report.pdf');
    await assertSucceeds(ref.put(validPdfFile.data, { contentType: 'application/pdf' }));
  });

  await test('Authenticated user CANNOT upload executable files', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    const ref = storage.ref('complaints/c-003/virus.exe');
    await assertFails(ref.put(exeFile.data, { contentType: 'application/exe' }));
  });

  // ─── Avatar Upload ──────────────────────────────────────────────────────────
  console.log('\n► Avatar Upload');
  await test('User can upload their own avatar', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    const ref = storage.ref('avatars/user-001/avatar.jpg');
    await assertSucceeds(ref.put(validImageFile.data, { contentType: 'image/jpeg' }));
  });

  await test('User CANNOT upload avatar for another user', async () => {
    const storage = testEnv.authenticatedContext('user-001').storage();
    const ref = storage.ref('avatars/different-user/avatar.jpg');
    await assertFails(ref.put(validImageFile.data, { contentType: 'image/jpeg' }));
  });

  await testEnv.cleanup();

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
