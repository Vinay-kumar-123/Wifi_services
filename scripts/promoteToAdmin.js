/**
 * WiFi Service Desk - Admin Role Provisioning Guide / Script
 *
 * In production:
 * 1. An administrator promotes users via the Admin Portal or Cloud Function.
 * 2. To bootstrap the FIRST super-admin account in a new Firebase project:
 *    - Register a user via the registration screen (e.g. admin@wifidesk.com).
 *    - In Firebase Console -> Cloud Firestore -> 'users' collection -> locate the user's document.
 *    - Change the 'role' field from "customer" to "admin".
 *
 * This script provides a quick programmatic helper if you have a Firebase Service Account key.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');

async function promoteUserToAdmin(email) {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`\n[!] Service account key not found at ${serviceAccountPath}`);
    console.log('To promote a user to admin without a service account:');
    console.log('1. Go to Firebase Console -> Firestore Database');
    console.log('2. Open the "users" collection');
    console.log('3. Find the user with email:', email);
    console.log('4. Edit field "role" and set value to "admin"\n');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();

  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();

  if (snapshot.empty) {
    console.error(`[!] No user document found matching email: ${email}`);
    process.exit(1);
  }

  const docSnap = snapshot.docs[0];
  await docSnap.ref.update({
    role: 'admin',
    updatedAt: new Date(),
  });

  console.log(`[✓] Successfully promoted ${email} (${docSnap.id}) to System Administrator (admin).`);
}

const targetEmail = process.argv[2];
if (!targetEmail) {
  console.log('Usage: node scripts/promoteToAdmin.js <user-email>');
  process.exit(0);
}

promoteUserToAdmin(targetEmail).catch((err) => {
  console.error('Promotion error:', err);
  process.exit(1);
});
