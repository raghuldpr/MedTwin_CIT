/**
 * MedTwin Master Prototype Seed Script
 * Generates comprehensive demo dataset for 3 Patients, 3 Doctors, and 1 Admin.
 *
 * Usage: cd backend && npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDatabase, disconnectDatabase } from '../config/database.config.js';
import { User } from '../models/User.js';
import { PatientTwinProfile } from '../models/PatientTwinProfile.js';
import { VitalSigns } from '../models/VitalSigns.js';
import { MedicationItem } from '../models/MedicationItem.js';
import { AllergyItem } from '../models/AllergyItem.js';
import { OrganSystemStatus, OrganSystemName, OrganHealthStatus } from '../models/OrganSystemStatus.js';
import { AccessConsent, ConsentStatus, PermissionLevel } from '../models/AccessConsent.js';
import { MedicalDocument, DocumentCategory, OcrStatus } from '../models/MedicalDocument.js';
import { ClinicalNote, ClinicalNoteType } from '../models/ClinicalNote.js';
import { Prescription, PrescriptionStatus } from '../models/Prescription.js';
import { AuditLog, AuditAction, AuditResourceType, AuditOutcome } from '../models/AuditLog.js';
import { createAuditLog } from '../services/auditLog.service.js';

import { UserRole } from '../utils/roles.js';
import { logger } from '../utils/logger.util.js';
import { hashPin } from '../utils/hash.js';
import { DOCUMENTS_UPLOAD_DIR } from '../utils/storage.util.js';

const SALT_ROUNDS = 10;

// 1. Define Accounts: 3 Patients, 3 Doctors, 1 Admin
const DEMO_USERS = [
  // Patients
  {
    key: 'patient1',
    name: 'Hardish Sharma',
    email: 'patient@medtwin.test',
    password: 'Patient123!',
    role: UserRole.PATIENT,
    profile: {
      dob: '1993-04-15',
      gender: 'Male',
      bloodGroup: 'O+',
      heightCm: 175,
      weightKg: 74,
      emergencyContact: { name: 'Priya Sharma', relationship: 'Spouse', phone: '+91 98765 43211' },
      pin: '123456',
      condition: 'Hypertension & Type 2 Diabetes Mellitus',
    },
  },
  {
    key: 'patient2',
    name: 'Aarav Patel',
    email: 'patient2@medtwin.test',
    password: 'Patient123!',
    role: UserRole.PATIENT,
    profile: {
      dob: '1988-11-20',
      gender: 'Male',
      bloodGroup: 'A+',
      heightCm: 180,
      weightKg: 81,
      emergencyContact: { name: 'Meera Patel', relationship: 'Sister', phone: '+91 98123 45678' },
      pin: '234567',
      condition: 'Chronic Asthma & Severe Allergic Rhinitis',
    },
  },
  {
    key: 'patient3',
    name: 'Sunita Verma',
    email: 'patient3@medtwin.test',
    password: 'Patient123!',
    role: UserRole.PATIENT,
    profile: {
      dob: '1968-07-08',
      gender: 'Female',
      bloodGroup: 'B+',
      heightCm: 162,
      weightKg: 68,
      emergencyContact: { name: 'Ramesh Verma', relationship: 'Son', phone: '+91 97654 32109' },
      pin: '345678',
      condition: 'Chronic Kidney Disease (Stage 2) & Osteoarthritis',
    },
  },
  // Doctors
  {
    key: 'doctor1',
    name: 'Dr. Priya Sharma',
    email: 'doctor@medtwin.test',
    password: 'Doctor123!',
    role: UserRole.DOCTOR,
    specialty: 'Cardiology & Internal Medicine',
    hospital: 'Fortis Heart Institute',
  },
  {
    key: 'doctor2',
    name: 'Dr. Rajesh Kumar',
    email: 'doctor2@medtwin.test',
    password: 'Doctor123!',
    role: UserRole.DOCTOR,
    specialty: 'Nephrology & Renal Medicine',
    hospital: 'Apollo Renal Care',
  },
  {
    key: 'doctor3',
    name: 'Dr. Ananya Roy',
    email: 'doctor3@medtwin.test',
    password: 'Doctor123!',
    role: UserRole.DOCTOR,
    specialty: 'Pulmonology & Allergy Immunology',
    hospital: 'Max Healthcare Institute',
  },
  // Admin
  {
    key: 'admin',
    name: 'MedTwin Governance Admin',
    email: 'admin@medtwin.test',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  },
];

const seedUsers = async (): Promise<Record<string, string>> => {
  const userMap: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    let existing = await User.findOne({ email: u.email });
    if (!existing) {
      const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
      existing = await User.create({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        isActive: true,
      });
      logger.info(`Created user: ${u.name} (${u.email}) [${u.role}]`);
    } else {
      logger.info(`Found existing user: ${u.name} (${u.email})`);
    }
    userMap[u.key] = existing._id.toString();
  }
  return userMap;
};

// Seed Patient Twin Profile
const seedProfiles = async (users: Record<string, string>) => {
  for (const u of DEMO_USERS) {
    if (u.role === UserRole.PATIENT && u.profile) {
      const userId = users[u.key];
      await PatientTwinProfile.deleteMany({ userId });
      await PatientTwinProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        dateOfBirth: new Date(u.profile.dob),
        gender: u.profile.gender,
        bloodGroup: u.profile.bloodGroup,
        heightCm: u.profile.heightCm,
        weightKg: u.profile.weightKg,
        emergencyContact: u.profile.emergencyContact,
      });
    }
  }
  logger.info('Digital Twin Profiles seeded for all 3 patients.');
};

// Seed Vital Signs for all 3 Patients
const seedVitals = async (users: Record<string, string>) => {
  const now = Date.now();
  for (const u of DEMO_USERS) {
    if (u.role === UserRole.PATIENT) {
      const patientId = users[u.key];
      await VitalSigns.deleteMany({ patientId });

      let baseHR = 74, baseSys = 118, baseDia = 76, baseSpo2 = 98, baseGlu = 98, baseTemp = 36.5;
      if (u.key === 'patient2') { // Asthma
        baseHR = 82; baseSpo2 = 95; baseGlu = 92;
      } else if (u.key === 'patient3') { // CKD
        baseHR = 68; baseSys = 126; baseDia = 82; baseGlu = 104;
      }

      const vitals = Array.from({ length: 12 }, (_, i) => ({
        patientId: new mongoose.Types.ObjectId(patientId),
        heartRate: baseHR + (i % 5) - 2,
        systolicBP: baseSys + (i % 6) - 3,
        diastolicBP: baseDia + (i % 4) - 2,
        spo2: baseSpo2 + (i % 2),
        bloodGlucose: baseGlu + (i % 12) - 5,
        temperatureC: Number((baseTemp + (i % 3) * 0.1).toFixed(1)),
        recordedAt: new Date(now - (11 - i) * 24 * 3600 * 1000),
        source: 'DEVICE',
      }));
      await VitalSigns.insertMany(vitals);
    }
  }
  logger.info('Vital signs telemetry seeded for all 3 patients.');
};

// Seed Medications for all 3 Patients
const seedMedications = async (users: Record<string, string>) => {
  // Patient 1: Hardish Sharma (Doctor 1: Dr. Priya Sharma)
  const p1Id = users['patient1'];
  const d1Id = users['doctor1'];
  await MedicationItem.deleteMany({ patientId: p1Id });
  await MedicationItem.insertMany([
    {
      patientId: new mongoose.Types.ObjectId(p1Id),
      prescribedBy: new mongoose.Types.ObjectId(d1Id),
      name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', route: 'ORAL',
      startDate: new Date('2024-01-01'), instructions: 'Take in the morning with water.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p1Id),
      prescribedBy: new mongoose.Types.ObjectId(d1Id),
      name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', route: 'ORAL',
      startDate: new Date('2024-02-15'), instructions: 'Take with meals.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p1Id),
      prescribedBy: new mongoose.Types.ObjectId(d1Id),
      name: 'Vitamin D3', dosage: '60,000 IU', frequency: 'Once weekly', route: 'ORAL',
      startDate: new Date('2024-03-01'), instructions: 'Take with milk.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p1Id),
      prescribedBy: new mongoose.Types.ObjectId(d1Id),
      name: 'Omega-3 Fish Oil', dosage: '1000mg', frequency: 'Once daily', route: 'ORAL',
      startDate: new Date('2024-01-01'), instructions: 'Take with dinner.', active: true,
    },
  ]);

  // Patient 2: Aarav Patel (Doctor 3: Dr. Ananya Roy)
  const p2Id = users['patient2'];
  const d3Id = users['doctor3'];
  await MedicationItem.deleteMany({ patientId: p2Id });
  await MedicationItem.insertMany([
    {
      patientId: new mongoose.Types.ObjectId(p2Id),
      prescribedBy: new mongoose.Types.ObjectId(d3Id),
      name: 'Fluticasone / Salmeterol Inhaler', dosage: '250/50 mcg', frequency: '2 puffs twice daily', route: 'INHALATION',
      startDate: new Date('2024-02-10'), instructions: 'Rinse mouth with water after use.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p2Id),
      prescribedBy: new mongoose.Types.ObjectId(d3Id),
      name: 'Montelukast', dosage: '10mg', frequency: 'Once daily', route: 'ORAL',
      startDate: new Date('2024-02-10'), instructions: 'Take at bedtime.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p2Id),
      prescribedBy: new mongoose.Types.ObjectId(d3Id),
      name: 'Albuterol Rescue Inhaler', dosage: '90mcg', frequency: 'As needed', route: 'INHALATION',
      startDate: new Date('2024-01-05'), instructions: '2 puffs every 4-6 hours PRN for acute shortness of breath.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p2Id),
      prescribedBy: new mongoose.Types.ObjectId(d3Id),
      name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily as needed', route: 'ORAL',
      startDate: new Date('2024-03-15'), instructions: 'Take during seasonal pollen flare-ups.', active: true,
    },
  ]);

  // Patient 3: Sunita Verma (Doctor 2: Dr. Rajesh Kumar)
  const p3Id = users['patient3'];
  const d2Id = users['doctor2'];
  await MedicationItem.deleteMany({ patientId: p3Id });
  await MedicationItem.insertMany([
    {
      patientId: new mongoose.Types.ObjectId(p3Id),
      prescribedBy: new mongoose.Types.ObjectId(d2Id),
      name: 'Losartan', dosage: '50mg', frequency: 'Once daily', route: 'ORAL',
      startDate: new Date('2024-01-20'), instructions: 'Take in the morning. Renal protective agent.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p3Id),
      prescribedBy: new mongoose.Types.ObjectId(d2Id),
      name: 'Calcium Carbonate + Cholecalciferol', dosage: '500mg/250 IU', frequency: 'Twice daily', route: 'ORAL',
      startDate: new Date('2024-02-01'), instructions: 'Take after meals for bone health.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p3Id),
      prescribedBy: new mongoose.Types.ObjectId(d2Id),
      name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', route: 'ORAL',
      startDate: new Date('2024-01-20'), instructions: 'Take at bedtime.', active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(p3Id),
      prescribedBy: new mongoose.Types.ObjectId(d2Id),
      name: 'Paracetamol', dosage: '650mg', frequency: 'As needed', route: 'ORAL',
      startDate: new Date('2024-03-10'), instructions: 'Take PRN for knee joint arthritis pain (Max 3/day). Avoid NSAIDs.', active: true,
    },
  ]);

  logger.info('Medications seeded for all 3 patients.');
};

// Seed Allergies for all 3 Patients
const seedAllergies = async (users: Record<string, string>) => {
  // Patient 1
  const p1Id = users['patient1'];
  await AllergyItem.deleteMany({ patientId: p1Id });
  await AllergyItem.insertMany([
    { patientId: new mongoose.Types.ObjectId(p1Id), allergen: 'Penicillin', reaction: 'Skin rash and urticaria', severity: 'MODERATE', notes: 'Documented reaction in 2019.' },
    { patientId: new mongoose.Types.ObjectId(p1Id), allergen: 'Shellfish', reaction: 'Gastrointestinal distress', severity: 'MILD', notes: 'Dietary allergy.' },
  ]);

  // Patient 2
  const p2Id = users['patient2'];
  await AllergyItem.deleteMany({ patientId: p2Id });
  await AllergyItem.insertMany([
    { patientId: new mongoose.Types.ObjectId(p2Id), allergen: 'Aspirin / NSAIDs', reaction: 'Bronchospasm & Severe Anaphylaxis', severity: 'LIFE_THREATENING', notes: 'STRICT CONTRAINDICATION: Avoid all NSAID class analgesics.' },
    { patientId: new mongoose.Types.ObjectId(p2Id), allergen: 'Dust Mites', reaction: 'Allergic asthma exacerbation & sneezing', severity: 'MODERATE', notes: 'Confirmed on IgE panel.' },
    { patientId: new mongoose.Types.ObjectId(p2Id), allergen: 'Peanuts', reaction: 'Facial angioedema', severity: 'SEVERE', notes: 'Requires EpiPen carrying.' },
  ]);

  // Patient 3
  const p3Id = users['patient3'];
  await AllergyItem.deleteMany({ patientId: p3Id });
  await AllergyItem.insertMany([
    { patientId: new mongoose.Types.ObjectId(p3Id), allergen: 'Iodinated Contrast Media', reaction: 'Urticaria & Hypotension', severity: 'SEVERE', notes: 'Requires IV steroid pre-medication before CT scans.' },
    { patientId: new mongoose.Types.ObjectId(p3Id), allergen: 'Sulfa Antibiotics', reaction: 'Maculopapular rash', severity: 'MODERATE', notes: 'Avoid Trimethoprim/Sulfamethoxazole.' },
  ]);

  logger.info('Allergies seeded for all 3 patients.');
};

// Seed Organ System Statuses for all 3 Patients
const seedOrgans = async (users: Record<string, string>) => {
  // Patient 1 (HTN & Diabetes)
  const p1Id = users['patient1'];
  await OrganSystemStatus.deleteMany({ patientId: p1Id });
  await OrganSystemStatus.insertMany([
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.CARDIOVASCULAR, status: OrganHealthStatus.NORMAL, summary: 'Sinus rhythm steady at 74 bpm. Arterial blood pressure tightly regulated with Amlodipine.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.ENDOCRINE, status: OrganHealthStatus.MONITOR, summary: 'HbA1c 5.8%. Glycemic control monitored under Metformin therapy.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.RESPIRATORY, status: OrganHealthStatus.NORMAL, summary: 'Oxygen saturation 98%. Clear pulmonary fields.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.RENAL, status: OrganHealthStatus.NORMAL, summary: 'eGFR 102 mL/min. Creatinine 0.9 mg/dL. Renal filtration optimal.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.HEPATIC, status: OrganHealthStatus.NORMAL, summary: 'ALT/AST liver enzymes within normal clinical limits.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.DIGESTIVE, status: OrganHealthStatus.NORMAL, summary: 'Normal GI motility. Metformin regimen well tolerated.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.NERVOUS, status: OrganHealthStatus.NORMAL, summary: 'Intact neurological status. No peripheral neuropathy symptoms.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.MUSCULOSKELETAL, status: OrganHealthStatus.NORMAL, summary: 'Good muscle tone and joint flexibility.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.IMMUNE, status: OrganHealthStatus.NORMAL, summary: 'Normal WBC count and baseline immune response.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p1Id), system: OrganSystemName.REPRODUCTIVE, status: OrganHealthStatus.NORMAL, summary: 'No anatomical or clinical concerns.', lastUpdated: new Date() },
  ]);

  // Patient 2 (Asthma & Allergic Rhinitis)
  const p2Id = users['patient2'];
  await OrganSystemStatus.deleteMany({ patientId: p2Id });
  await OrganSystemStatus.insertMany([
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.RESPIRATORY, status: OrganHealthStatus.MONITOR, summary: 'FEV1 74% predicted. Mild nocturnal wheezing managed with Fluticasone/Salmeterol.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.IMMUNE, status: OrganHealthStatus.MONITOR, summary: 'Elevated serum IgE (480 IU/mL). Hyper-reactive bronchial response to dust mites and pollens.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.CARDIOVASCULAR, status: OrganHealthStatus.NORMAL, summary: 'Sinus rate 82 bpm. Normal ECG trace.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.ENDOCRINE, status: OrganHealthStatus.NORMAL, summary: 'Fasting glucose 92 mg/dL. Normal thyroid function.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.RENAL, status: OrganHealthStatus.NORMAL, summary: 'Normal urine clearance and serum electrolytes.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.HEPATIC, status: OrganHealthStatus.NORMAL, summary: 'Normal liver function panel.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.DIGESTIVE, status: OrganHealthStatus.NORMAL, summary: 'Intact gastric lining.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.NERVOUS, status: OrganHealthStatus.NORMAL, summary: 'Normal sensory and motor reflexes.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.MUSCULOSKELETAL, status: OrganHealthStatus.NORMAL, summary: 'Full range of motion in all spinal and peripheral joints.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p2Id), system: OrganSystemName.REPRODUCTIVE, status: OrganHealthStatus.NORMAL, summary: 'Normal physiological status.', lastUpdated: new Date() },
  ]);

  // Patient 3 (CKD & Osteoarthritis)
  const p3Id = users['patient3'];
  await OrganSystemStatus.deleteMany({ patientId: p3Id });
  await OrganSystemStatus.insertMany([
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.RENAL, status: OrganHealthStatus.MONITOR, summary: 'Stage 2 CKD. eGFR 68 mL/min, Serum Creatinine 1.4 mg/dL. Proteinuria managed with Losartan.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.MUSCULOSKELETAL, status: OrganHealthStatus.MONITOR, summary: 'Grade 2 Bilateral Knee Osteoarthritis. Joint space narrowing & osteophytes. Managed with Paracetamol.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.CARDIOVASCULAR, status: OrganHealthStatus.NORMAL, summary: 'Blood pressure 124/78 mmHg. No signs of fluid overload or pedal edema.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.ENDOCRINE, status: OrganHealthStatus.NORMAL, summary: 'Serum Calcium 9.2 mg/dL. Parathyroid hormone (PTH) baseline normal.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.RESPIRATORY, status: OrganHealthStatus.NORMAL, summary: 'SpO2 97% on room air. Clear breath sounds.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.HEPATIC, status: OrganHealthStatus.NORMAL, summary: 'Bilirubin and transaminases within reference limits.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.DIGESTIVE, status: OrganHealthStatus.NORMAL, summary: 'No upper GI bleeding. Tolerating oral calcium supplements.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.NERVOUS, status: OrganHealthStatus.NORMAL, summary: 'Intact nerve conduction. No uremic encephalopathy.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.IMMUNE, status: OrganHealthStatus.NORMAL, summary: 'Normal white cell counts.', lastUpdated: new Date() },
    { patientId: new mongoose.Types.ObjectId(p3Id), system: OrganSystemName.REPRODUCTIVE, status: OrganHealthStatus.NORMAL, summary: 'Post-menopausal status.', lastUpdated: new Date() },
  ]);

  logger.info('Organ system statuses seeded for all 3 patients.');
};

// Seed Doctor Access Consent PINs for all 3 Patients
const seedConsents = async (users: Record<string, string>) => {
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000); // 14 days

  const pairs = [
    { pKey: 'patient1', dKey: 'doctor1', pin: '123456' },
    { pKey: 'patient2', dKey: 'doctor3', pin: '234567' },
    { pKey: 'patient3', dKey: 'doctor2', pin: '345678' },
  ];

  for (const pair of pairs) {
    const patientId = users[pair.pKey];
    const doctorId = users[pair.dKey];
    await AccessConsent.deleteMany({ patientId });

    await AccessConsent.create({
      patientId: new mongoose.Types.ObjectId(patientId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      pinHash: hashPin(pair.pin),
      expiresAt,
      status: ConsentStatus.ACTIVE,
      permissionLevel: PermissionLevel.FULL,
      failedAttempts: 0,
      lastVerifiedAt: new Date(),
    });
    logger.info(`Seeded active PIN ${pair.pin} for ${pair.pKey} with doctor ${pair.dKey}`);
  }
};

// Seed Uploaded Medical Documents & OCR Extracted Data
const seedDocuments = async (users: Record<string, string>) => {
  if (!fs.existsSync(DOCUMENTS_UPLOAD_DIR)) {
    fs.mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
  }

  // Create real physical PDF content with valid magic bytes (%PDF-1.4)
  const createPdfBuffer = (title: string, details: string) => Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${100 + title.length + details.length} >>
stream
BT /F1 12 Tf 50 700 Td (${title}) Tj ET
BT /F1 10 Tf 50 670 Td (${details}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000202 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
350
%%EOF`);

  // Create real physical PNG buffer with valid PNG magic header bytes
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89
  ]);

  // Documents dataset for all 3 Patients
  const docsPerPatient: Array<{ pKey: string; docs: any[] }> = [
    {
      pKey: 'patient1',
      docs: [
        {
          originalFileName: 'Lipid_Panel_Comprehensive_LabReport.pdf',
          storedFileName: `demo_p1_lipid_${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          documentType: DocumentCategory.LAB_REPORT,
          description: 'Comprehensive Blood & Lipid Panel from Metropolis Diagnostics',
          buffer: createPdfBuffer('MedTwin Lab Report - Lipid Panel', 'Hardish Sharma - Total Chol 195, Triglycerides 142'),
          extractedData: {
            patientName: 'Hardish Sharma',
            documentType: 'Lab Report',
            doctorOrHospital: 'Metropolis Labs',
            documentDate: '2024-05-10',
            diagnoses: ['Mild Hyperlipidemia'],
            vitalOrLabResults: [
              { testName: 'Total Cholesterol', value: '195', unit: 'mg/dL', referenceRange: '< 200 mg/dL', flag: 'NORMAL' },
              { testName: 'Triglycerides', value: '142', unit: 'mg/dL', referenceRange: '< 150 mg/dL', flag: 'NORMAL' },
              { testName: 'HDL Cholesterol', value: '52', unit: 'mg/dL', referenceRange: '> 40 mg/dL', flag: 'NORMAL' },
              { testName: 'LDL Cholesterol', value: '114', unit: 'mg/dL', referenceRange: '< 100 mg/dL', flag: 'DESIRABLE' },
            ],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Lipid profile parameters remain well-managed under dietary control.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
        {
          originalFileName: 'ECG_12Lead_Cardiac_Scan.png',
          storedFileName: `demo_p1_ecg_${crypto.randomUUID()}.png`,
          mimeType: 'image/png',
          documentType: DocumentCategory.SCAN_REPORT,
          description: '12-Lead Electrocardiogram Trace Analysis',
          buffer: pngBuffer,
          extractedData: {
            patientName: 'Hardish Sharma',
            documentType: 'ECG Trace',
            doctorOrHospital: 'Fortis Cardiac Center',
            documentDate: '2024-04-18',
            diagnoses: ['Normal Sinus Rhythm'],
            clinicalFindings: ['PR interval 152ms', 'QRS duration 88ms', 'QTc 410ms'],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Normal 12-lead ECG. No ischemic ST-T changes or conduction delay.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
        {
          originalFileName: 'Prescription_Amlodipine_Metformin.pdf',
          storedFileName: `demo_p1_presc_${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          documentType: DocumentCategory.PRESCRIPTION,
          description: 'Clinical Prescription issued by Dr. Priya Sharma',
          buffer: createPdfBuffer('Prescription - Dr. Priya Sharma', 'Amlodipine 5mg QD, Metformin 500mg BID'),
          extractedData: {
            patientName: 'Hardish Sharma',
            documentType: 'Prescription',
            doctorOrHospital: 'Dr. Priya Sharma',
            documentDate: '2024-02-15',
            medications: [
              { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
              { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
            ],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Prescribed maintenance dosage for BP and HbA1c control.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
      ],
    },
    {
      pKey: 'patient2',
      docs: [
        {
          originalFileName: 'Pulmonary_Function_Test_PFT_Report.pdf',
          storedFileName: `demo_p2_pft_${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          documentType: DocumentCategory.LAB_REPORT,
          description: 'Spirometry & Pulmonary Function Test (PFT)',
          buffer: createPdfBuffer('PFT Spirometry Report', 'Aarav Patel - FEV1 74%, FVC 85%'),
          extractedData: {
            patientName: 'Aarav Patel',
            documentType: 'Pulmonary Function Test',
            doctorOrHospital: 'Max Pulmonology Center',
            documentDate: '2024-03-05',
            diagnoses: ['Moderate Bronchial Asthma'],
            vitalOrLabResults: [
              { testName: 'FEV1', value: '2.85', unit: 'L', referenceRange: '> 3.5 L (74% predicted)', flag: 'LOW' },
              { testName: 'FVC', value: '3.85', unit: 'L', referenceRange: '> 4.2 L (85% predicted)', flag: 'NORMAL' },
              { testName: 'FEV1/FVC Ratio', value: '74', unit: '%', referenceRange: '> 80%', flag: 'BORDERLINE' },
              { testName: 'Post-Bronchodilator Reversibility', value: '+14', unit: '%', referenceRange: '> 12% Positive', flag: 'ABNORMAL' },
            ],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Spirometry reveals reversible airway obstruction consistent with Asthma.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
        {
          originalFileName: 'Allergy_IgE_Panel_BloodTest.pdf',
          storedFileName: `demo_p2_allergy_${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          documentType: DocumentCategory.LAB_REPORT,
          description: 'Comprehensive Serum Allergy IgE Panel',
          buffer: createPdfBuffer('Allergy IgE Panel', 'Aarav Patel - IgE 480 IU/mL'),
          extractedData: {
            patientName: 'Aarav Patel',
            documentType: 'Lab Report',
            doctorOrHospital: 'Lal PathLabs',
            documentDate: '2024-02-28',
            diagnoses: ['Atopic Allergy Syndrome'],
            vitalOrLabResults: [
              { testName: 'Total Serum IgE', value: '480', unit: 'IU/mL', referenceRange: '< 100 IU/mL', flag: 'HIGH' },
              { testName: 'Dust Mite Specific IgE', value: '18.4', unit: 'kU/L', referenceRange: '< 0.35 kU/L (Class 4)', flag: 'HIGH' },
            ],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Markedly elevated IgE levels with severe sensitivity to house dust mites.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
      ],
    },
    {
      pKey: 'patient3',
      docs: [
        {
          originalFileName: 'Renal_Function_Test_RFT_LabReport.pdf',
          storedFileName: `demo_p3_rft_${crypto.randomUUID()}.pdf`,
          mimeType: 'application/pdf',
          documentType: DocumentCategory.LAB_REPORT,
          description: 'Serum Renal & Electrolyte Function Panel',
          buffer: createPdfBuffer('Renal Function Test', 'Sunita Verma - Creatinine 1.4 mg/dL, eGFR 68'),
          extractedData: {
            patientName: 'Sunita Verma',
            documentType: 'Lab Report',
            doctorOrHospital: 'SRL Diagnostics',
            documentDate: '2024-04-12',
            diagnoses: ['Stage 2 Chronic Kidney Disease'],
            vitalOrLabResults: [
              { testName: 'Serum Creatinine', value: '1.4', unit: 'mg/dL', referenceRange: '0.6 - 1.1 mg/dL', flag: 'HIGH' },
              { testName: 'eGFR (CKD-EPI)', value: '68', unit: 'mL/min/1.73m2', referenceRange: '> 90 mL/min', flag: 'MONITOR' },
              { testName: 'Blood Urea Nitrogen (BUN)', value: '24', unit: 'mg/dL', referenceRange: '7 - 20 mg/dL', flag: 'HIGH' },
              { testName: 'Urine Albumin/Creatinine Ratio', value: '45', unit: 'mg/g', referenceRange: '< 30 mg/g', flag: 'ELEVATED' },
            ],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Mild elevation in serum creatinine consistent with Stage 2 CKD.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
        {
          originalFileName: 'Bilateral_Knee_XRay_Radiology_Scan.png',
          storedFileName: `demo_p3_xray_${crypto.randomUUID()}.png`,
          mimeType: 'image/png',
          documentType: DocumentCategory.SCAN_REPORT,
          description: 'Radiology Report - Standing Bilateral Knee Radiograph',
          buffer: pngBuffer,
          extractedData: {
            patientName: 'Sunita Verma',
            documentType: 'X-Ray Radiology Report',
            doctorOrHospital: 'Max Imaging Center',
            documentDate: '2024-03-18',
            diagnoses: ['Grade 2 Bilateral Osteoarthritis'],
            clinicalFindings: ['Medial compartment joint space narrowing', 'Subchondral sclerosis', 'Marginal osteophytes'],
            extractionStatus: 'SUCCESS',
            rawSummary: 'Bilateral weight-bearing knee X-rays demonstrate moderate degenerative osteoarthritic changes.',
            disclaimer: 'Generated by MedTwin AI OCR pipeline.',
          },
        },
      ],
    },
  ];

  for (const item of docsPerPatient) {
    const patientId = users[item.pKey];
    await MedicalDocument.deleteMany({ patientId });

    for (const doc of item.docs) {
      const filePath = path.join(DOCUMENTS_UPLOAD_DIR, doc.storedFileName);
      fs.writeFileSync(filePath, doc.buffer);

      await MedicalDocument.create({
        patientId: new mongoose.Types.ObjectId(patientId),
        originalFileName: doc.originalFileName,
        storedFileName: doc.storedFileName,
        mimeType: doc.mimeType,
        fileSize: doc.buffer.length,
        documentType: doc.documentType,
        description: doc.description,
        ocrStatus: OcrStatus.COMPLETED,
        extractedData: doc.extractedData,
        extractedText: doc.description,
      });
    }
  }
  logger.info('Physical medical documents & AI OCR data uploaded for all 3 patients.');
};

// Seed Prescriptions & Clinical Notes
const seedNotesAndPrescriptions = async (users: Record<string, string>) => {
  // Patient 1 & Doctor 1
  const p1Id = users['patient1'];
  const d1Id = users['doctor1'];
  await ClinicalNote.deleteMany({ patientId: p1Id });
  await Prescription.deleteMany({ patientId: p1Id });

  await ClinicalNote.create({
    patientId: new mongoose.Types.ObjectId(p1Id),
    doctorId: new mongoose.Types.ObjectId(d1Id),
    noteType: ClinicalNoteType.CONSULTATION,
    title: 'Cardiovascular & Metabolic Bi-Annual Review',
    content: 'Patient Hardish Sharma presented for routine checkup. Resting BP 120/80 mmHg. Sinus rhythm steady at 74 bpm. Amlodipine 5mg and Metformin 500mg regimens well tolerated without side effects.',
    encounterDate: new Date('2024-05-15'),
  });

  await Prescription.create({
    patientId: new mongoose.Types.ObjectId(p1Id),
    doctorId: new mongoose.Types.ObjectId(d1Id),
    medicationName: 'Amlodipine', dosage: '5', dosageUnit: 'mg', frequency: 'Once daily', route: 'ORAL',
    duration: '90 days', quantity: 90, instructions: 'Take 1 tablet every morning.',
    startDate: new Date('2024-05-15'), status: PrescriptionStatus.ACTIVE,
  });

  // Patient 2 & Doctor 3
  const p2Id = users['patient2'];
  const d3Id = users['doctor3'];
  await ClinicalNote.deleteMany({ patientId: p2Id });
  await Prescription.deleteMany({ patientId: p2Id });

  await ClinicalNote.create({
    patientId: new mongoose.Types.ObjectId(p2Id),
    doctorId: new mongoose.Types.ObjectId(d3Id),
    noteType: ClinicalNoteType.CONSULTATION,
    title: 'Asthma & Allergy Evaluation',
    content: 'Aarav Patel evaluated for spring allergy flare. Spirometry demonstrates reversible airway obstruction. Continued Fluticasone/Salmeterol maintenance inhaler and Montelukast at bedtime. Strict avoidance of Aspirin/NSAIDs reinforced.',
    encounterDate: new Date('2024-04-10'),
  });

  await Prescription.create({
    patientId: new mongoose.Types.ObjectId(p2Id),
    doctorId: new mongoose.Types.ObjectId(d3Id),
    medicationName: 'Fluticasone / Salmeterol Inhaler', dosage: '250/50', dosageUnit: 'mcg', frequency: '2 puffs twice daily', route: 'INHALATION',
    duration: '60 days', quantity: 1, instructions: 'Inhale 2 puffs morning and night. Rinse mouth thoroughly.',
    startDate: new Date('2024-04-10'), status: PrescriptionStatus.ACTIVE,
  });

  // Patient 3 & Doctor 2
  const p3Id = users['patient3'];
  const d2Id = users['doctor2'];
  await ClinicalNote.deleteMany({ patientId: p3Id });
  await Prescription.deleteMany({ patientId: p3Id });

  await ClinicalNote.create({
    patientId: new mongoose.Types.ObjectId(p3Id),
    doctorId: new mongoose.Types.ObjectId(d2Id),
    noteType: ClinicalNoteType.CONSULTATION,
    title: 'Nephrology CKD Stage 2 & Arthritis Follow-up',
    content: 'Sunita Verma reviewed for CKD Stage 2 and knee arthritis. eGFR stable at 68 mL/min. Losartan 50mg maintaining renal blood flow and urinary protein ratios. Advised Paracetamol for joint pain; NSAIDs strictly avoided due to renal risk.',
    encounterDate: new Date('2024-04-20'),
  });

  await Prescription.create({
    patientId: new mongoose.Types.ObjectId(p3Id),
    doctorId: new mongoose.Types.ObjectId(d2Id),
    medicationName: 'Losartan', dosage: '50', dosageUnit: 'mg', frequency: 'Once daily', route: 'ORAL',
    duration: '90 days', quantity: 90, instructions: 'Take 1 tablet in the morning with water.',
    startDate: new Date('2024-04-20'), status: PrescriptionStatus.ACTIVE,
  });

  logger.info('Clinical notes and prescriptions seeded for all patients.');
};

// Seed Audit Trail
const seedAuditLogs = async (users: Record<string, string>) => {
  await AuditLog.deleteMany({});
  const p1Id = users['patient1'];
  const d1Id = users['doctor1'];
  const adminId = users['admin'];

  await createAuditLog({
    actorUserId: p1Id, actorRole: UserRole.PATIENT,
    action: AuditAction.AUTH_LOGIN_SUCCESS, resourceType: AuditResourceType.AUTH, outcome: AuditOutcome.SUCCESS,
    metadata: { method: 'JWT_AUTH' },
  });
  await createAuditLog({
    actorUserId: p1Id, actorRole: UserRole.PATIENT,
    action: AuditAction.DOCUMENT_UPLOAD, resourceType: AuditResourceType.MEDICAL_DOCUMENT, outcome: AuditOutcome.SUCCESS,
    metadata: { documentType: 'LAB_REPORT', fileName: 'Lipid_Panel_Comprehensive_LabReport.pdf' },
  });
  await createAuditLog({
    actorUserId: d1Id, actorRole: UserRole.DOCTOR,
    action: AuditAction.CONSENT_VERIFY_SUCCESS, resourceType: AuditResourceType.ACCESS_CONSENT, outcome: AuditOutcome.SUCCESS,
    targetUserId: p1Id, metadata: { permissionLevel: 'FULL' },
  });
  await createAuditLog({
    actorUserId: adminId, actorRole: UserRole.ADMIN,
    action: AuditAction.COMPLIANCE_REPORT_VIEW, resourceType: AuditResourceType.COMPLIANCE, outcome: AuditOutcome.SUCCESS,
    metadata: { auditScan: 'COMPLETE', complianceScore: 100 },
  });

  logger.info('Audit log trail seeded cleanly.');
};

export const seedMasterData = async (): Promise<void> => {
  logger.info('====================================================');
  logger.info('🚀 SEEDING MEDTWIN HACKATHON MASTER DEMO DATASET');
  logger.info('====================================================');

  const users = await seedUsers();

  await seedProfiles(users);
  await seedVitals(users);
  await seedMedications(users);
  await seedAllergies(users);
  await seedOrgans(users);
  await seedConsents(users);
  await seedDocuments(users);
  await seedNotesAndPrescriptions(users);
  await seedAuditLogs(users);

  logger.info('');
  logger.info('========================================================================');
  logger.info('✅ MEDTWIN SEED COMPLETE! PROTOTYPE DEMO ACCOUNTS READY:');
  logger.info('========================================================================');
  logger.info(' 👤 PATIENT 1: Hardish Sharma (Hypertension & Diabetes)');
  logger.info('    Email: patient@medtwin.test  | Password: Patient123! | PIN: 123456');
  logger.info('');
  logger.info(' 👤 PATIENT 2: Aarav Patel (Asthma & Allergic Rhinitis)');
  logger.info('    Email: patient2@medtwin.test | Password: Patient123! | PIN: 234567');
  logger.info('');
  logger.info(' 👤 PATIENT 3: Sunita Verma (CKD Stage 2 & Osteoarthritis)');
  logger.info('    Email: patient3@medtwin.test | Password: Patient123! | PIN: 345678');
  logger.info('');
  logger.info(' 🩺 DOCTOR 1: Dr. Priya Sharma (Cardiology)');
  logger.info('    Email: doctor@medtwin.test   | Password: Doctor123!');
  logger.info('');
  logger.info(' 🩺 DOCTOR 2: Dr. Rajesh Kumar (Nephrology)');
  logger.info('    Email: doctor2@medtwin.test  | Password: Doctor123!');
  logger.info('');
  logger.info(' 🩺 DOCTOR 3: Dr. Ananya Roy (Pulmonology)');
  logger.info('    Email: doctor3@medtwin.test  | Password: Doctor123!');
  logger.info('');
  logger.info(' 🛡️ ADMIN: MedTwin Governance Admin');
  logger.info('    Email: admin@medtwin.test   | Password: Admin123!');
  logger.info('========================================================================');
};

const main = async () => {
  try {
    logger.info('Connecting to MedTwin Database...');
    await connectDatabase();
    await seedMasterData();
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Seed script failed:', error);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
};

if (process.argv[1]?.includes('seed')) {
  main();
}
