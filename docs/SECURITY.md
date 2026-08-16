# MedTwin Security Architecture & Compliance Controls

This document details the security design, privacy safeguards, authorization mechanics, and HIPAA-aligned controls implemented in **MedTwin – Clinical Patient Digital Twin Platform**.

---

## 🔒 Mandatory HIPAA-Aligned Design Disclaimer

> [!IMPORTANT]
> **Prototype Compliance & Safeguards Notice**
>
> **MedTwin is designed with HIPAA-aligned privacy and security principles in mind.** The prototype demonstrates technical controls relevant to protecting electronic protected health information (ePHI), including role-based access control (RBAC), patient-controlled consent management, tamper-evident audit logging, secure credential handling, least-privilege data access, and backend secret isolation.
>
> **Important:** This hackathon prototype has not undergone an independent HIPAA compliance audit or certification. HIPAA compliance in a production deployment would require organizational, administrative, physical, and technical safeguards, formal policies, comprehensive risk assessments, Business Associate Agreements (BAAs) where applicable, and independent compliance validation.

---

## 1. Authentication Architecture

- **Token-Based Authentication**: Secure JWT (JSON Web Token) authentication signed exclusively on the backend node server using HS256 algorithm with configurable secret (`JWT_SECRET`).
- **Password Hashing**: Passwords stored using `bcryptjs` with a cost factor of 10 (`SALT_ROUNDS = 10`).
- **Context Augmentation**: Express middleware (`auth.middleware.ts`) extracts Bearer tokens from authorization headers, validates token integrity, verifies user active status, and injects authenticated user payload into context (`req.user`).
- **Token Invalidation**: Standardized unauthorized (401) HTTP handler clears local storage tokens on client state change.

---

## 2. Authorization & Role-Based Access Control (RBAC)

MedTwin strictly enforces role boundaries across three explicit user roles (`UserRole`):

| Role | Access Scope & Capabilities |
| :--- | :--- |
| **PATIENT** | Primary owner of personal health record (PHR) and Digital Twin telemetry. Can view vitals, medications, organ status, uploaded medical documents, clinical notes, and manage doctor access consent. |
| **DOCTOR** | Access restricted strictly to consented patients. Must present a valid 6-digit access PIN or invoke emergency break-glass authorization. |
| **ADMIN** | System governance, compliance telemetry monitoring, and immutable audit log inspection. **Explicitly barred from viewing raw clinical patient records or digital twins.** |

---

## 3. Patient Ownership & Doctor Access Consent Architecture

Data ownership is centered on the patient:

```
[Patient] --(Generates Temporary 6-Digit PIN)--> [AccessConsent Model]
                                                         |
                                        (SHA-256 Hash Verification)
                                                         |
[Doctor] <--(Grants Time-Bound Access)-------------------+
```

- **6-Digit PIN System**: Generated using Node.js `crypto.randomInt(100000, 999999)` for cryptographic randomness.
- **PIN Hashing**: PINs are never stored in plaintext. They are hashed using SHA-256 (`crypto.createHash('sha256')`) with salt before database persistence (`AccessConsent` schema).
- **Time-Bound Expiration**: Consents default to configurable expiration windows (e.g. 1 hour, 24 hours, 7 days).
- **Permission Levels**: Supports `FULL` access (complete digital twin + document history) or `LIMITED` access (vitals + active medications only).
- **Brute-Force Safeguards**: `AccessConsent` model tracks `failedAttempts`. Access is automatically locked after 5 consecutive failed PIN attempts.

---

## 4. Emergency Break-Glass Access Workflow

In critical clinical scenarios where a patient is incapacitated:
- **Break-Glass Authorization**: Doctors can trigger an emergency override (`/api/doctor/emergency-access`).
- **High-Priority Audit Log**: Instantly generates an indelible `EMERGENCY_ACCESS_OVERRIDE` audit event recording doctor identity, timestamp, clinical justification reason, and target patient ID.
- **Notification**: Triggers real-time alerts on patient dashboard and administrative governance monitors.

---

## 5. Tamper-Evident Audit Logging & Integrity Hashing

Every security-sensitive operation creates an immutable audit entry in MongoDB (`AuditLog` collection):

- **Logged Events**: User authentication, document upload/view, consent generation/revocation, PIN verification attempts, clinical note creation, and break-glass overrides.
- **SHA-256 Integrity Chain**: Each audit record calculates an `auditHash` binding `actorUserId`, `action`, `resourceType`, `timestamp`, and `previousHash` in a Merkle-like chain (`auditHash.util.ts`).
- **Tamper Detection**: Administrative API (`/api/admin/audit-logs/verify`) recalculates chain integrity to detect unauthorized database tampering.

---

## 6. Server-Side AI Integration & Key Protection

- **Backend Secret Isolation**: Google Gemini AI keys (`GEMINI_API_KEY`) are accessed strictly on the Node server via `process.env.GEMINI_API_KEY`.
- **Zero Frontend Key Exposure**: Frontend React code contains zero AI API keys or direct Google AI Studio SDK dependencies.
- **Proxy Endpoints**: AI-driven features (Document OCR via Gemini 3.7 Flash and AI Drug Safety interaction analysis) are invoked through backend controller endpoints (`/api/patient/documents/ocr` and `/api/doctor/drug-safety/check`).

---

## 7. Input Validation & Defense-in-Depth

- **NoSQL Injection Guard**: Custom middleware (`nosqlSanitize.middleware.ts`) strips MongoDB operators (`$gt`, `$where`, `$ne`) from incoming request bodies and query parameters.
- **Rate Limiting**: IP and route-based rate limiters (`rateLimit.middleware.ts`) protect authentication and PIN verification endpoints against denial-of-service (DoS) attacks.
- **Security Headers**: Custom security headers middleware enforces standard web defenses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy).
- **Strict Data Minimization**: All seed data and demo datasets use synthetic names ("Hardish Sharma", "Dr. Priya Sharma") and mock telemetry. No real patient health information (PHI/ePHI) exists in the repository.

---

## 8. Prototype vs Production Implementation Comparison

| Safeguard Feature | Hackathon Prototype Implementation | Production Requirement |
| :--- | :--- | :--- |
| **Database Storage** | In-Memory MongoDB Server / Local MongoDB | Encrypted MongoDB Enterprise (Atlas / AWS DocumentDB) with TLS in transit & AES-256 at rest |
| **Secret Management** | Local `.env` files (excluded via `.gitignore`) | Hardware Security Module (HSM) or Secret Manager (AWS Secrets Manager, HashiCorp Vault) |
| **Transport Security** | Local HTTP (`http://localhost:3001`) | Mandatory TLS 1.3 HTTPS with HSTS headers |
| **Audit Log Storage** | MongoDB `AuditLog` collection with chained hash | Immutable Write-Once-Read-Many (WORM) storage or AWS QLDB |
| **Legal Certification** | Demonstrates HIPAA technical controls | Formal legal risk assessment, BAA agreements, independent SOC2 Type II & HIPAA audit |
