# MedTwin Frontend-Backend Integration Specification

This document summarizes the exact wiring, environment variables, authentication mechanisms, proxy configurations, and API routes used between the MedTwin Frontend and Backend.

---

## 1. Network & Proxy Architecture

### **Ports & URLs**
- **Backend API Server Port:** `3001` (`http://localhost:3001`)
- **Frontend Development Server Port:** `5173` (`http://localhost:5173`)
- **CORS Allowed Origins:** Defined in `backend/.env`:
  `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`

### **Vite Proxy Configuration**
Located in `frontend/vite.config.ts`. In development, all requests targeting `/api/*` are proxied to the backend:
```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### **Environment Files**
- **Frontend Environment File (`frontend/.env`):**
  ```env
  VITE_API_BASE_URL=http://localhost:3001
  ```
- **Backend Environment File (`backend/.env`):**
  ```env
  PORT=3001
  NODE_ENV=development
  MONGODB_URI=mongodb://localhost:27017/medtwin
  JWT_SECRET=medtwin_super_secret_jwt_key_2026
  GEMINI_API_KEY=<your_gemini_key>
  ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
  ```

---

## 2. Authentication & Authorization Contract

1. **Token Storage:** The JWT authentication token is stored in `localStorage` under key `medtwin_token`.
2. **Request Header:** Every authenticated request must pass the token in the headers:
   ```http
   Authorization: Bearer <token>
   Content-Type: application/json
   ```
3. **Session Hydration:** On application mount, `frontend/src/context/AuthContext.tsx` sends:
   - `GET /api/health` to verify server availability.
   - `GET /api/auth/me` with the stored JWT token to restore user session data.
4. **Automatic Unauthorized (401) Handling:**
   - If any API call receives HTTP status `401`, `medtwin_token` is cleared from `localStorage` and the user is logged out automatically.

---

## 3. Complete API Endpoints Reference

### **Health & Auth Routes**
| Method | Endpoint | Request Payload / Params | Response Data |
|---|---|---|---|
| `GET` | `/api/health` | None | `{ status: 'ok', uptime: number }` |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user: BackendUser, token: string }` |
| `POST` | `/api/auth/register` | `{ name, email, password, role: 'PATIENT' \| 'DOCTOR' }` | `{ user: BackendUser, token: string }` |
| `GET` | `/api/auth/me` | None (Requires Bearer Token) | `{ user: BackendUser }` |

---

### **Patient Portal Routes (`/api/patient/`)**
| Method | Endpoint | Request Payload / Params | Purpose |
|---|---|---|---|
| `GET` | `/api/patient/profile` | None | Get patient profile & user info |
| `PUT` | `/api/patient/profile` | Partial profile object | Update profile details |
| `GET` | `/api/patient/vitals` | `?page=1&limit=20` | Paginated vitals history |
| `POST` | `/api/patient/vitals` | `{ heartRate, systolicBP, diastolicBP, spo2, bloodGlucose, temperatureC }` | Record new vitals |
| `GET` | `/api/patient/medications` | None | List active medications |
| `POST` | `/api/patient/medications` | `{ name, dosage, frequency, route, instructions, startDate }` | Add new medication |
| `GET` | `/api/patient/allergies` | None | List patient allergies |
| `POST` | `/api/patient/allergies` | `{ allergen, reaction, severity, notes }` | Log new allergy |
| `GET` | `/api/patient/organs` | None | Get organ system health summaries |
| `GET` | `/api/patient/consents` | None | List generated doctor consents |
| `POST` | `/api/patient/consents` | `{ expiresInMinutes, permissionLevel, doctorId }` | Generate access PIN & consent token |
| `DELETE` | `/api/patient/consents/:id` | None | Revoke a doctor's consent |
| `GET` | `/api/patient/documents` | None | List uploaded medical documents |
| `POST` | `/api/patient/documents` | `FormData` (`file`, `documentType`, `description`) | Upload & trigger OCR analysis |
| `GET` | `/api/patient/documents/:id` | None | View/Download document file |
| `DELETE` | `/api/patient/documents/:id` | None | Delete document |
| `GET` | `/api/patient/notes` | None | Get notes authored by doctors |
| `GET` | `/api/patient/prescriptions` | None | Get prescriptions assigned to patient |

---

### **Doctor Portal Routes (`/api/doctor/`)**
| Method | Endpoint | Request Payload / Params | Purpose |
|---|---|---|---|
| `POST` | `/api/doctor/consents/verify` | `{ patientId, pin }` | Verify PIN and grant doctor access |
| `GET` | `/api/doctor/patients/:id/twin` | None | Get aggregated patient digital twin data |
| `GET` | `/api/doctor/patients/:id/vitals` | `?page=1&limit=20` | View patient vitals |
| `GET` | `/api/doctor/patients/:id/medications` | None | View patient medications |
| `GET` | `/api/doctor/patients/:id/allergies` | None | View patient allergies |
| `GET` | `/api/doctor/patients/:id/organs` | None | View patient organ statuses |
| `GET` | `/api/doctor/patients/:id/documents` | None | View patient medical documents |
| `GET` | `/api/doctor/patients/:id/notes` | None | View clinical notes |
| `POST` | `/api/doctor/patients/:id/notes` | `{ content, noteType }` | Add new clinical note |
| `GET` | `/api/doctor/patients/:id/prescriptions` | None | View prescriptions |
| `POST` | `/api/doctor/patients/:id/prescriptions` | `{ medications: [{name, dosage, frequency}], diagnosis, notes }` | Create new prescription |
| `POST` | `/api/doctor/patients/:id/drug-safety-check` | `{ proposedMedication?: { name, dosage, frequency } }` | Run Gemini AI Drug Interaction Analysis |

---

### **Admin Console Routes (`/api/admin/`)**
| Method | Endpoint | Request Payload / Params | Purpose |
|---|---|---|---|
| `GET` | `/api/admin/users` | `?page=1&limit=10&role=&search=` | Search & list all system users |
| `GET` | `/api/admin/users/:id` | None | Get user account details |
| `PATCH` | `/api/admin/users/:id/status` | `{ status: 'ACTIVE' \| 'SUSPENDED' }` | Update user status |
| `PATCH` | `/api/admin/doctors/:id/verification` | `{ verificationStatus, rejectionReason }` | Approve/reject doctor registration |
| `GET` | `/api/admin/audit-logs` | `?page=1&limit=20&action=&outcome=` | System-wide audit log trail |
| `GET` | `/api/admin/compliance/summary` | None | Compliance and user counts overview |

---

### **Voice Assistant Route**
| Method | Endpoint | Request Payload / Params | Purpose |
|---|---|---|---|
| `POST` | `/api/voice/command` | `{ command: string }` | Process natural language voice command |

---

## 4. Summary Checklist for Wiring New Frontend

When you paste your new frontend folder into `MedTwin_CIT/frontend`:
1. Ensure `frontend/.env` contains `VITE_API_BASE_URL=http://localhost:3001`.
2. Ensure `frontend/vite.config.ts` includes the proxy configuration for `/api` pointing to `http://localhost:3001`.
3. Verify that API calls use relative paths starting with `/api/` (e.g. `/api/auth/login`, `/api/patient/vitals`), OR use `import.meta.env.VITE_API_BASE_URL`.
4. Ensure requests include `Authorization: Bearer <token>` from `localStorage.getItem('medtwin_token')`.
