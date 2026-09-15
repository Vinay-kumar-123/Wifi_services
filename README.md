# WiFi Service Desk — Production SaaS Platform

**WiFi Service Desk** is a production-quality SaaS web application for Wi-Fi and broadband service providers. It manages customer complaints, technician dispatch workflows, role-based access, in-app notifications, operational analytics, and immutable security audit logs.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Language | JavaScript (ESM, JSX — no TypeScript) |
| Routing | React Router v7 with role-based guards |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts 2 |
| Backend | Firebase Auth, Cloud Firestore, Storage, Cloud Functions (v2) |
| Testing | Vitest 5, @firebase/rules-unit-testing |
| CI/Build | Vite rollup with code-split vendor chunks |

---

## User Roles

| Role | Description |
|---|---|
| `customer` | Registers, submits complaints, tracks status, receives notifications |
| `technician` | Sees only assigned tickets, accepts, works, resolves |
| `admin` | Full system access: assigns technicians, manages users/roles, views analytics and audit logs |

> **Security Guarantee**: New registrations are **always** created as `customer`. Role changes are Cloud Function-only operations performed exclusively by active administrators.

---

## Architecture Overview

```
wifi-service-desk/
├── src/
│   ├── components/
│   │   ├── common/            — LoadingSpinner, shared UI
│   │   ├── complaints/        — Cards, timeline, history list
│   │   ├── layout/            — Header (with NotificationDropdown), Sidebar, MobileNav
│   │   ├── notifications/     — NotificationDropdown.jsx
│   │   └── users/             — ChangeRoleModal, ToggleStatusModal
│   ├── constants/             — COMPLAINT_STATUS, ROLES enums
│   ├── context/               — AuthContext (real-time profile listener)
│   ├── layouts/               — DashboardLayout
│   ├── pages/
│   │   ├── admin/             — Dashboard, Complaints, Users, AuditLogs, Analytics
│   │   ├── auth/              — Login, Register, ForgotPassword, Unauthorized, Deactivated
│   │   ├── customer/          — Dashboard, NewComplaint, Complaints, ComplaintDetail
│   │   └── technician/        — Dashboard, ComplaintDetail
│   ├── routes/                — AppRoutes, ProtectedRoute, RoleRoute, PublicRoute
│   ├── schemas/               — Zod validation schemas
│   └── services/
│       ├── analytics/         — analyticsService.js
│       ├── auth/              — authService.js
│       ├── complaints/        — complaintService.js
│       ├── firebase/          — firebaseConfig.js (emulator-aware)
│       ├── notifications/     — notificationService.js
│       └── users/             — userService.js
├── functions/src/index.js     — Cloud Functions (changeUserRole, assignTechnician, etc.)
├── tests/
│   ├── setup.js               — Vitest global Firebase mocks
│   ├── unit/                  — auth, complaints, notifications, analytics tests
│   └── rules/                 — Firestore + Storage security rules tests
├── firestore.rules            — Production-hardened Firestore security rules
├── firestore.indexes.json     — All required composite indexes
├── storage.rules              — Storage security rules
├── firebase.json              — Hosting + emulator configuration
└── scripts/seed-emulator.js   — Emulator seed for manual testing
```

---

## Prerequisites

- Node.js v18+ (tested on v22.14.0)
- NPM v9+ (tested on v10.9.2)
- Firebase CLI: `npm install -g firebase-tools`
- Java 11+ (required for Firebase Emulator Suite)

---

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd wifi-service-desk
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Email/Password** authentication.
3. Create a **Firestore** database (production mode — rules are in `firestore.rules`).
4. Enable **Cloud Storage**.
5. Deploy **Cloud Functions** (see below).
6. Copy the web app config from **Project Settings → General → Your apps**.

```bash
cp .env.example .env
# Fill in your Firebase credentials in .env
```

### 3. Deploy Security Rules and Indexes

```bash
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Deploy Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 5. Run Development Server

```bash
npm run dev
# App runs at http://localhost:3000
```

### 6. Bootstrap Admin Account

After your first registration, go to Firebase Console → Firestore → `users/{uid}` and manually set `role: "admin"`. All subsequent role changes are made through the Admin Users interface.

---

## Firebase Emulator Suite (Local Development)

### Setup

All emulators are pre-configured in `firebase.json`:

| Service | Port |
|---|---|
| Auth | 9099 |
| Firestore | 8080 |
| Cloud Functions | 5001 |
| Storage | 9199 |
| Hosting | 5000 |
| Emulator UI | 4000 |

### Start Emulators

```bash
npm run emulators
# Opens Emulator UI at http://localhost:4000
```

### Seed Test Data

In a separate terminal while emulators are running:

```bash
node scripts/seed-emulator.js
```

This creates:

| Role | Email | Password |
|---|---|---|
| Admin | admin@wifiservice.local | Admin@1234 |
| Customer 1 | customer1@test.local | Customer@1234 |
| Customer 2 | customer2@test.local | Customer@1234 |
| Technician 1 | tech1@wifiservice.local | Tech@1234 |
| Technician 2 | tech2@wifiservice.local | Tech@1234 |

### Connect Frontend to Emulators

```env
# In .env (local only — NEVER in production)
VITE_USE_FIREBASE_EMULATORS=true
```

Then run `npm run dev`. The app will connect to emulators instead of production Firebase.

> **Safety**: `VITE_USE_FIREBASE_EMULATORS` is `false` by default. The emulator connection only activates when explicitly set to `true`.

---

## Running Tests

### Unit Tests (No Emulator Needed)

```bash
npm test
# Expected: 4 test files, 52 tests — all passing
```

```bash
npm run test:coverage
# Generates coverage report in coverage/
```

### Firestore Security Rules Tests (Requires Emulator)

```bash
# Terminal 1: Start emulators
firebase emulators:start --only auth,firestore,storage

# Terminal 2: Run rules tests
firebase emulators:exec --only auth,firestore,storage \
  "node tests/rules/firestore.rules.test.js"

firebase emulators:exec --only auth,firestore,storage \
  "node tests/rules/storage.rules.test.js"
```

---

## Test Matrix

### Unit Tests (Automated — No Emulator)

| Test Suite | Tests | Status |
|---|---|---|
| `auth.test.js` | Default customer role, login, deactivated account rejection, self-role/self-deactivation guards | ✅ 14 pass |
| `complaintService.test.js` | Status machine (accept/start/resolve), mandatory resolution notes, ownership isolation, admin assignment, technician isolation | ✅ 15 pass |
| `notificationService.test.js` | Create with validation, markAsRead, markAllAsRead, subscription | ✅ 13 pass |
| `analyticsService.test.js` | KPI aggregation, status/priority counts, resolution time, technician leaderboard, trend generation | ✅ 10 pass |
| **Total** | | **✅ 52/52** |

### Firestore Security Rules Tests (Emulator-Based)

| Category | Tests |
|---|---|
| Default Deny | Unauthenticated read/write blocked |
| Users | Own read ✓, cross-user blocked ✓, role escalation blocked ✓, isActive escalation blocked ✓ |
| Complaints | Customer isolation ✓, technician isolation ✓, admin full access ✓, cancellation rules ✓, state machine ✓ |
| Complaints (Technician) | Accept, start work, resolve with notes ✓, resolve without notes rejected ✓, close blocked ✓, self-assign blocked ✓ |
| Notifications | Own read ✓, cross-read blocked ✓, mark-read only ✓, title edit blocked ✓, delete blocked ✓ |
| Audit Logs | Admin read ✓, customer/tech read blocked ✓, update immutable ✓, delete immutable ✓ |
| Deactivated Accounts | Firestore reads blocked for deactivated users ✓ |

### Production Build

```
✓ 2613 modules transformed
✓ built in 7.76s (exit code 0)
All chunks < 450 kB uncompressed
```

---

## Security Model

### Non-Negotiable Rules (Enforced Server-Side)

1. **Default-Deny**: All Firestore and Storage rules begin with `allow read, write: if false`.
2. **Default Customer Role**: Registration always creates `role: 'customer'`. Frontend cannot override. Firestore rules enforce `request.resource.data.role == 'customer'` on create.
3. **Customer Isolation**: `resource.data.customerId == request.auth.uid` enforced in Firestore rules.
4. **Technician Isolation**: `resource.data.assignedTechnicianId == request.auth.uid` enforced in Firestore rules.
5. **No Automatic Assignment**: `assignedTechnicianId` must be `null` on complaint creation. Enforced in Firestore rules.
6. **Mandatory Resolution Notes**: `resolutionNotes.size() >= 10` enforced in Firestore rules AND Cloud Functions. Both layers enforce independently.
7. **Admin-Only Privileged Operations**: Role changes, account activation/deactivation, and ticket closure are Cloud Functions enforcing server-side role and active status checks.
8. **Self-Modification Guards**: Cloud Functions reject `callerUid === targetUserId` for role changes and deactivation.
9. **Audit Log Immutability**: `allow update, delete: if false` in Firestore rules. No client can alter audit history.
10. **Real-Time Revocation**: `AuthContext` subscribes to `users/{uid}` in real-time. Deactivated accounts are immediately logged out without requiring a page refresh.
11. **Notification Isolation**: Notifications enforce `recipientId == request.auth.uid` for reads; create validates required fields including `isRead == false`.

### Security Findings Fixed in Stage 7

| # | Finding | Fix Applied |
|---|---|---|
| 1 | Storage `allow delete: if false` was missing for complaint attachments | Added explicit delete deny |
| 2 | Notification `create` had no field validation | Added `recipientId`, `title`, `message`, `isRead == false` checks |
| 3 | `assignTechnician` Cloud Function only notified technician, not customer | Added customer notification in CF |
| 4 | `technicianUpdateStatus` CF allowed `accepted → resolved` (inconsistent with Firestore rules) | Restricted to `in_progress → resolved` only |
| 5 | `emulator-data/` not in `.gitignore` | Added |
| 6 | `functions/node_modules/` not in `.gitignore` | Added |

---

## Required Firestore Indexes

All indexes are defined in [`firestore.indexes.json`](./firestore.indexes.json). Deploy with:

```bash
firebase deploy --only firestore:indexes
```

Key composite indexes:

| Collection | Fields |
|---|---|
| `complaints` | `customerId` + `createdAt DESC` |
| `complaints` | `customerId` + `status` + `createdAt DESC` |
| `complaints` | `assignedTechnicianId` + `status` + `createdAt DESC` |
| `complaints` | `status` + `priority` + `createdAt DESC` |
| `notifications` | `recipientId` + `createdAt DESC` |
| `notifications` | `recipientId` + `isRead` + `createdAt DESC` |
| `auditLogs` | `action` + `createdAt DESC` |
| `users` | `role` + `isActive` + `createdAt DESC` |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Storage bucket name |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Web app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | ⬜ | Analytics (optional) |
| `VITE_APP_ENV` | ⬜ | `development` / `production` |
| `VITE_USE_FIREBASE_EMULATORS` | ⬜ | `true` only for local emulator dev |

---

## Production Deployment Checklist

- [ ] `.env` contains real production Firebase credentials
- [ ] `VITE_USE_FIREBASE_EMULATORS=false` (or not set)
- [ ] `.env` is in `.gitignore` ✅
- [ ] `npm run build` exits code 0 ✅
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage` completed
- [ ] `firebase deploy --only functions` completed
- [ ] `firebase deploy --only hosting` completed (or CI/CD)
- [ ] Admin account bootstrapped in Firestore console
- [ ] Firebase Auth Email/Password sign-in enabled
- [ ] Firestore database created in production mode
- [ ] Storage enabled and rules deployed
- [ ] No secrets or `.env` files in git history
- [ ] `npm test` — all 52 tests passing ✅

---

## Full Production Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. Deploy everything
firebase deploy --only firestore:rules,firestore:indexes,storage,functions,hosting
```

---

## Known Limitations

1. **Storage attachment read is authenticated-not-owner-scoped**: Storage rules cannot look up Firestore to verify complaint ownership. All authenticated users with a direct URL can read attachments. Complaint IDs are UUID-based and filenames are timestamped, making enumeration infeasible without Firestore access.
2. **No FCM push notifications**: In-app notifications are Firestore real-time only. Push notifications to mobile/browser require Firebase Cloud Messaging setup.
3. **No email notifications**: Outbound email (e.g., SendGrid) is not integrated. Extend Cloud Functions for email workflows.
4. **Analytics are client-aggregated**: `analyticsService.js` fetches all complaint documents and aggregates client-side. For large datasets (10,000+ complaints), move to Cloud Functions-based aggregation or BigQuery.
5. **Firestore Security Rules tests require Java**: The Firebase Emulator Suite requires Java 11+. Confirm with `java -version`.
