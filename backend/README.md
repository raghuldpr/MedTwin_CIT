# MedTwin — Backend API

MedTwin is an AI-powered Clinical Patient Digital Twin platform connecting patients, doctors, and hospital administrators.

This repository houses the Node.js, Express, TypeScript, and MongoDB backend architecture.

---

## 🏗️ Project Architecture

```text
src/
├── config/
│   ├── env.config.ts          # Typed environment variable loader (dotenv)
│   ├── database.config.ts     # Mongoose connection manager & lifecycle hooks
│   └── index.ts               # Central config export
├── controllers/
│   ├── auth.controller.ts      # Authentication handler (register, login, me)
│   ├── health.controller.ts    # Health check handler
│   ├── patient.controller.ts   # Patient Digital Twin handler (profile, vitals, meds, allergies, organs)
│   ├── consent.controller.ts   # Patient-controlled doctor consent & PIN verification handlers
│   └── index.ts
├── middleware/
│   ├── auth.middleware.ts      # JWT verification & request context augmentation (authenticate)
│   ├── role.middleware.ts      # Role-Based Access Control authorization (authorizeRoles)
│   ├── consent.middleware.ts   # Doctor patient access consent verification (requirePatientConsent)
│   ├── error.middleware.ts     # Centralized error & 404 handlers
│   └── index.ts
├── models/
│   ├── User.ts                # Mongoose User schema, roles, and safe serialization
│   ├── PatientTwinProfile.ts  # Patient Digital Twin core demographics and emergency contacts
│   ├── VitalSigns.ts          # Vital sign telemetry (HR, BP, SpO2, glucose, temp)
│   ├── MedicationItem.ts      # Patient medications and dosage schedules
│   ├── AllergyItem.ts         # Known allergies, reactions, and severity grades
│   ├── OrganSystemStatus.ts   # 10 clinical organ systems and status tracking
│   ├── AccessConsent.ts       # Patient-issued doctor access consent records & PIN hashes
│   └── index.ts
├── routes/
│   ├── auth.routes.ts          # /api/auth routes (register, login, me)
│   ├── health.routes.ts        # /api/health route
│   ├── patient.routes.ts       # /api/patient routes (Digital Twin data & consent generation)
│   ├── doctor.routes.ts        # /api/doctor routes (PIN verification & clinical access)
│   ├── test.routes.ts          # /api/test RBAC verification routes
│   └── index.ts                # Central API router (/api)
├── services/
│   ├── auth.service.ts         # Authentication business logic & password hashing
│   ├── patient.service.ts      # Patient data isolation queries & mutations
│   ├── consent.service.ts      # PIN generation, hashing, verification, & brute-force protection
│   └── index.ts
├── utils/
│   ├── generatePin.ts         # Cryptographically random 6-digit PIN generator (crypto.randomInt)
│   ├── hash.ts                # SHA-256 hashing and timing-safe comparison
│   ├── logger.util.ts          # Structured console logger
│   ├── response.util.ts        # Standardized JSON response helper
│   ├── roles.ts                # User roles definition (PATIENT, DOCTOR, ADMIN) & helpers
│   └── index.ts
├── app.ts                     # Express application configuration & middlewares
└── server.ts                  # Startup coordinator (DB -> Server) & graceful shutdown
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/medtwin
JWT_SECRET=replace_with_secure_secret
GEMINI_API_KEY=replace_with_gemini_api_key
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

### 4. Start Production Server
```bash
npm start
```

---

## 🔐 Authentication Endpoints

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a new user (`PATIENT`, `DOCTOR`, `ADMIN`) |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/me` | Protected (`Bearer <JWT>`) | Get authenticated user identity |

---

## 🧬 Patient Digital Twin Endpoints (`/api/patient`)

All patient endpoints require `authenticate` + `authorizeRoles(UserRole.PATIENT)`. All operations scope strictly to the authenticated `req.user.id`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/patient/profile` | Retrieve the authenticated patient's Digital Twin profile |
| `PUT` | `/api/patient/profile` | Create or update the patient's Digital Twin demographics |
| `GET` | `/api/patient/vitals?page=1&limit=20` | Paginated vital signs history (newest first) |
| `POST` | `/api/patient/vitals` | Record a new vital signs entry |
| `GET` | `/api/patient/medications` | Retrieve the patient's medication list |
| `POST` | `/api/patient/medications` | Add a medication entry |
| `GET` | `/api/patient/allergies` | Retrieve the patient's recorded allergies |
| `POST` | `/api/patient/allergies` | Add an allergy record |
| `GET` | `/api/patient/organs` | Retrieve the status of 10 organ systems |

---

## 🔑 Doctor Access Consent & PIN Endpoints

Patient-controlled 6-digit access PIN and consent authorization workflow:

| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/patient/consents` | `PATIENT` | Generate a cryptographically secure 6-digit PIN and consent grant (`expiresInMinutes`: 15, 30, 60, 240, 1440, 10080) |
| `GET` | `/api/patient/consents` | `PATIENT` | List the patient's issued consent grants (excluding PIN hashes) |
| `DELETE` | `/api/patient/consents/:consentId` | `PATIENT` | Revoke an active access consent grant |
| `POST` | `/api/doctor/consents/verify` | `DOCTOR` | Doctor verifies a patient's 6-digit PIN to establish time-limited authorization |

---

## 🩺 Doctor Authorized Patient Digital Twin Access (`/api/doctor/patients/:patientId`)

All routes require `authenticate` + `authorizeRoles(UserRole.DOCTOR)` + `requirePatientConsent()`.
Doctors may ONLY read patient data if an active, non-expired, doctor-specific consent exists.

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/doctor/patients/:patientId/twin` | `BASIC` / `FULL` | Retrieve structured Digital Twin (BASIC: demographics & recent vitals; FULL: complete profile, vitals, meds, allergies, organs) |
| `GET` | `/api/doctor/patients/:patientId/profile` | `BASIC` / `FULL` | Retrieve authorized patient demographics & baseline profile |
| `GET` | `/api/doctor/patients/:patientId/vitals?page=1&limit=20` | `BASIC` / `FULL` | Paginated vital signs history (newest first) |
| `GET` | `/api/doctor/patients/:patientId/medications` | `FULL` only | Retrieve patient medication records (403 on BASIC) |
| `GET` | `/api/doctor/patients/:patientId/allergies` | `FULL` only | Retrieve patient allergy records (403 on BASIC) |
| `GET` | `/api/doctor/patients/:patientId/organs` | `FULL` only | Retrieve 10 organ systems health status (403 on BASIC) |

---

## 🛡️ Role-Based Access Control (RBAC) Test Endpoints

| Endpoint | Allowed Role(s) | Unauthenticated | Permitted Role | Non-Permitted Role |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/test/patient` | `PATIENT` | `401 Unauthorized` | `200 OK` | `403 Forbidden` |
| `GET /api/test/doctor` | `DOCTOR` | `401 Unauthorized` | `200 OK` | `403 Forbidden` |
| `GET /api/test/admin` | `ADMIN` | `401 Unauthorized` | `200 OK` | `403 Forbidden` |
| `GET /api/test/clinical` | `DOCTOR` | `401 Unauthorized` | `200 OK` | `403 Forbidden` |
| `GET /api/test/governance` | `ADMIN` | `401 Unauthorized` | `200 OK` | `403 Forbidden` |
