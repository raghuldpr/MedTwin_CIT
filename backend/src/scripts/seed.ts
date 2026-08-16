/**
 * MedTwin Master Hackathon Seed Script
 * Generates comprehensive demo dataset for Patient, Doctor, and Admin flows.
 *
 * Usage: cd backend && npx tsx src/scripts/seed.ts
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

const DEMO_USERS = [
  { name: 'Hardish Sharma', email: 'patient@medtwin.test', password: 'Patient123!', role: UserRole.PATIENT },
  { name: 'Dr. Priya Sharma', email: 'doctor@medtwin.test', password: 'Doctor123!', role: UserRole.DOCTOR },
  { name: 'MedTwin Governance Admin', email: 'admin@medtwin.test', password: 'Admin123!', role: UserRole.ADMIN },
];

const seedUsers = async (): Promise<Record<string, string>> => {
  const ids: Record<string, string> = {};
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
      logger.info('Created user: ' + u.email + ' (' + u.role + ')');
    } else {
      logger.info('Found existing user: ' + u.email + ' (' + u.role + ')');
    }
    ids[u.role] = existing._id.toString();
  }
  return ids;
};

const seedPatientProfile = async (patientId: string) => {
  await PatientTwinProfile.deleteMany({ userId: patientId });
  await PatientTwinProfile.create({
    userId: new mongoose.Types.ObjectId(patientId),
    dateOfBirth: new Date('1993-04-15'),
    gender: 'Male',
    bloodGroup: 'O+',
    heightCm: 175,
    weightKg: 74,
    emergencyContact: {
      name: 'Priya Sharma',
      relationship: 'Spouse',
      phone: '+91 98765 43211',
    },
  });
  logger.info('Patient Digital Twin Profile seeded.');
};

const seedVitals = async (patientId: string) => {
  await VitalSigns.deleteMany({ patientId });
  const now = Date.now();
  const vitals = Array.from({ length: 12 }, (_, i) => ({
    patientId: new mongoose.Types.ObjectId(patientId),
    heartRate: 74 + (i % 5),
    systolicBP: 118 + (i % 6),
    diastolicBP: 76 + (i % 4),
    spo2: 98 - (i % 2),
    bloodGlucose: 98 + (i % 15),
    temperatureC: 36.5 + (i % 3) * 0.1,
    recordedAt: new Date(now - (11 - i) * 24 * 3600 * 1000),
    source: 'DEVICE',
  }));
  await VitalSigns.insertMany(vitals);
  logger.info('Seeded ' + vitals.length + ' vital sign records.');
};

const seedMedications = async (patientId: string, doctorId: string) => {
  await MedicationItem.deleteMany({ patientId });
  await MedicationItem.insertMany([
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      prescribedBy: new mongoose.Types.ObjectId(doctorId),
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'Once daily',
      route: 'ORAL',
      startDate: new Date('2024-01-01'),
      instructions: 'Take in the morning with water.',
      active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      prescribedBy: new mongoose.Types.ObjectId(doctorId),
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      route: 'ORAL',
      startDate: new Date('2024-02-15'),
      instructions: 'Take with meals.',
      active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      prescribedBy: new mongoose.Types.ObjectId(doctorId),
      name: 'Vitamin D3',
      dosage: '60,000 IU',
      frequency: 'Once weekly',
      route: 'ORAL',
      startDate: new Date('2024-03-01'),
      instructions: 'Take with a glass of milk.',
      active: true,
    },
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      prescribedBy: new mongoose.Types.ObjectId(doctorId),
      name: 'Omega-3 Fish Oil',
      dosage: '1000mg',
      frequency: 'Once daily',
      route: 'ORAL',
      startDate: new Date('2024-01-01'),
      instructions: 'Take with dinner.',
      active: true,
    },
  ]);
  logger.info('Medications seeded.');
};

const seedAllergies = async (patientId: string) => {
  await AllergyItem.deleteMany({ patientId });
  await AllergyItem.insertMany([
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      allergen: 'Penicillin',
      reaction: 'Skin rash and urticaria',
      severity: 'MODERATE',
      notes: 'Documented reaction in 2019.',
    },
    {
      patientId: new mongoose.Types.ObjectId(patientId),
      allergen: 'Shellfish',
      reaction: 'Gastrointestinal distress',
      severity: 'MILD',
      notes: 'Dietary allergy.',
    },
  ]);
  logger.info('Allergies seeded.');
};

const seedOrgans = async (patientId: string) => {
  await OrganSystemStatus.deleteMany({ patientId });
  const systems = [
    { system: OrganSystemName.CARDIOVASCULAR, status: OrganHealthStatus.NORMAL, summary: 'Sinus rhythm steady at 78 bpm. Arterial blood pressure tightly regulated with Amlodipine.' },
    { system: OrganSystemName.RESPIRATORY, status: OrganHealthStatus.NORMAL, summary: 'Oxygen saturation 98%. Clear pulmonary fields with normal lung compliance.' },
    { system: OrganSystemName.NERVOUS, status: OrganHealthStatus.NORMAL, summary: 'Intact neurological status. Cognitive and motor responses within expected limits.' },
    { system: OrganSystemName.DIGESTIVE, status: OrganHealthStatus.NORMAL, summary: 'Normal gastrointestinal motility. Metformin regimen well tolerated.' },
    { system: OrganSystemName.RENAL, status: OrganHealthStatus.NORMAL, summary: 'eGFR 102 mL/min. Creatinine 0.9 mg/dL. Renal filtration optimal.' },
    { system: OrganSystemName.HEPATIC, status: OrganHealthStatus.NORMAL, summary: 'ALT/AST liver enzymes within normal clinical limits.' },
    { system: OrganSystemName.MUSCULOSKELETAL, status: OrganHealthStatus.NORMAL, summary: 'Good muscle tone and bone density. No articular inflammation.' },
    { system: OrganSystemName.ENDOCRINE, status: OrganHealthStatus.MONITOR, summary: 'HbA1c 5.8%. Glycemic control monitored under Metformin therapy.' },
    { system: OrganSystemName.IMMUNE, status: OrganHealthStatus.NORMAL, summary: 'WBC count normal. Immune system functioning properly.' },
    { system: OrganSystemName.REPRODUCTIVE, status: OrganHealthStatus.NORMAL, summary: 'No anatomical or functional concerns noted.' },
  ];
  await OrganSystemStatus.insertMany(systems.map((s) => ({
    patientId: new mongoose.Types.ObjectId(patientId),
    ...s,
    lastUpdated: new Date(),
  })));
  logger.info('Organ system statuses seeded.');
};

const seedConsent = async (patientId: string, doctorId: string) => {
  await AccessConsent.deleteMany({ patientId });
  const pin = '123456';
  const hashed = hashPin(pin);
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // Valid for 7 days

  const consent = await AccessConsent.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    pinHash: hashed,
    expiresAt,
    status: ConsentStatus.ACTIVE,
    permissionLevel: PermissionLevel.FULL,
    failedAttempts: 0,
    lastVerifiedAt: new Date(),
  });

  logger.info('Seeded active 6-digit Doctor Access PIN: 123456 (Consent ID: ' + consent._id.toString() + ')');
};

const seedDocuments = async (patientId: string) => {
  await MedicalDocument.deleteMany({ patientId });

  if (!fs.existsSync(DOCUMENTS_UPLOAD_DIR)) {
    fs.mkdirSync(DOCUMENTS_UPLOAD_DIR, { recursive: true });
  }

  // Create real physical PDF content with valid magic bytes
  const pdfBuffer = Buffer.from(`%PDF-1.4
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
<< /Length 80 >>
stream
BT /F1 12 Tf 100 700 Td (MedTwin Patient Clinical Record - Confidential) Tj ET
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
330
%%EOF`);

  // Create real physical PNG buffer with valid magic bytes
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89
  ]);

  const docsData = [
    {
      originalFileName: 'Lipid_Panel_Comprehensive_LabReport.pdf',
      storedFileName: `demo_lipid_panel_${crypto.randomUUID()}.pdf`,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      documentType: DocumentCategory.LAB_REPORT,
      description: 'Comprehensive Blood & Lipid Panel from Metropolis Diagnostics',
      ocrStatus: OcrStatus.COMPLETED,
      buffer: pdfBuffer,
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
        extractionStatus: 'SUCCESS' as const,
        rawSummary: 'Lipid profile parameters remain well-managed under dietary control.',
        disclaimer: 'Generated by MedTwin AI OCR pipeline.',
      },
    },
    {
      originalFileName: 'ECG_12Lead_Cardiac_Scan.png',
      storedFileName: `demo_ecg_scan_${crypto.randomUUID()}.png`,
      mimeType: 'image/png',
      fileSize: pngBuffer.length,
      documentType: DocumentCategory.SCAN_REPORT,
      description: '12-Lead Electrocardiogram Trace Analysis',
      ocrStatus: OcrStatus.COMPLETED,
      buffer: pngBuffer,
      extractedData: {
        patientName: 'Hardish Sharma',
        documentType: 'ECG Trace',
        doctorOrHospital: 'Fortis Cardiac Center',
        documentDate: '2024-04-18',
        diagnoses: ['Normal Sinus Rhythm'],
        clinicalFindings: ['PR interval 152ms', 'QRS duration 88ms', 'QTc 410ms'],
        extractionStatus: 'SUCCESS' as const,
        rawSummary: 'Normal 12-lead ECG. No ischemic ST-T changes or conduction delay.',
        disclaimer: 'Generated by MedTwin AI OCR pipeline.',
      },
    },
    {
      originalFileName: 'Fortis_Hospital_Discharge_Summary.pdf',
      storedFileName: `demo_discharge_${crypto.randomUUID()}.pdf`,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      documentType: DocumentCategory.DISCHARGE_SUMMARY,
      description: 'Hospital Discharge Summary & Wellness Assessment',
      ocrStatus: OcrStatus.COMPLETED,
      buffer: pdfBuffer,
      extractedData: {
        patientName: 'Hardish Sharma',
        documentType: 'Discharge Summary',
        doctorOrHospital: 'Fortis Healthcare',
        documentDate: '2024-01-10',
        diagnoses: ['Essential Hypertension (Controlled)'],
        medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' }
        ],
        recommendations: ['Follow up in 4 weeks', 'Low sodium diet', 'Regular blood pressure monitoring'],
        extractionStatus: 'SUCCESS' as const,
        rawSummary: 'Patient discharged in stable condition. Blood pressure well controlled.',
        disclaimer: 'Generated by MedTwin AI OCR pipeline.',
      },
    },
    {
      originalFileName: 'Prescription_Amlodipine_Metformin.pdf',
      storedFileName: `demo_prescription_${crypto.randomUUID()}.pdf`,
      mimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      documentType: DocumentCategory.PRESCRIPTION,
      description: 'Clinical Prescription issued by Dr. Priya Sharma',
      ocrStatus: OcrStatus.COMPLETED,
      buffer: pdfBuffer,
      extractedData: {
        patientName: 'Hardish Sharma',
        documentType: 'Prescription',
        doctorOrHospital: 'Dr. Priya Sharma',
        documentDate: '2024-02-15',
        medications: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' }
        ],
        extractionStatus: 'SUCCESS' as const,
        rawSummary: 'Prescribed maintenance dosage for BP and HbA1c control.',
        disclaimer: 'Generated by MedTwin AI OCR pipeline.',
      },
    },
  ];

  for (const doc of docsData) {
    const filePath = path.join(DOCUMENTS_UPLOAD_DIR, doc.storedFileName);
    fs.writeFileSync(filePath, doc.buffer);

    await MedicalDocument.create({
      patientId: new mongoose.Types.ObjectId(patientId),
      originalFileName: doc.originalFileName,
      storedFileName: doc.storedFileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      documentType: doc.documentType,
      description: doc.description,
      ocrStatus: doc.ocrStatus,
      extractedData: doc.extractedData,
      extractedText: doc.description,
    });
  }

  logger.info('Uploaded ' + docsData.length + ' physical documents to storage and database.');
};

const seedNotesAndPrescriptions = async (patientId: string, doctorId: string) => {
  await ClinicalNote.deleteMany({ patientId });
  await Prescription.deleteMany({ patientId });

  await ClinicalNote.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    noteType: ClinicalNoteType.CONSULTATION,
    title: 'Bi-Annual Cardiovascular & Metabolic Review',
    content: 'Patient Hardish Sharma presented for routine evaluation. Resting BP 120/80 mmHg. Sinus rhythm steady at 78 bpm. Amlodipine 5mg and Metformin 500mg regimens well tolerated without peripheral edema or hypoglycemia. Recommended ongoing dietary compliance and quarterly HbA1c check.',
    encounterDate: new Date('2024-05-15'),
  });

  await Prescription.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    medicationName: 'Amlodipine',
    dosage: '5',
    dosageUnit: 'mg',
    frequency: 'Once daily',
    route: 'ORAL',
    duration: '90 days',
    quantity: 90,
    instructions: 'Take 1 tablet every morning with water.',
    startDate: new Date('2024-05-15'),
    status: PrescriptionStatus.ACTIVE,
  });

  await Prescription.create({
    patientId: new mongoose.Types.ObjectId(patientId),
    doctorId: new mongoose.Types.ObjectId(doctorId),
    medicationName: 'Metformin',
    dosage: '500',
    dosageUnit: 'mg',
    frequency: 'Twice daily',
    route: 'ORAL',
    duration: '90 days',
    quantity: 180,
    instructions: 'Take 1 tablet with breakfast and 1 tablet with dinner.',
    startDate: new Date('2024-05-15'),
    status: PrescriptionStatus.ACTIVE,
  });

  logger.info('Clinical notes and prescriptions seeded.');
};

const seedAuditLogs = async (patientId: string, doctorId: string, adminId: string) => {
  await AuditLog.deleteMany({});

  await createAuditLog({
    actorUserId: patientId,
    actorRole: UserRole.PATIENT,
    action: AuditAction.AUTH_LOGIN_SUCCESS,
    resourceType: AuditResourceType.AUTH,
    outcome: AuditOutcome.SUCCESS,
    metadata: { method: 'JWT_AUTH' },
  });

  await createAuditLog({
    actorUserId: patientId,
    actorRole: UserRole.PATIENT,
    action: AuditAction.DOCUMENT_UPLOAD,
    resourceType: AuditResourceType.MEDICAL_DOCUMENT,
    outcome: AuditOutcome.SUCCESS,
    metadata: { documentType: 'LAB_REPORT', fileName: 'Lipid_Panel_Comprehensive_LabReport.pdf' },
  });

  await createAuditLog({
    actorUserId: patientId,
    actorRole: UserRole.PATIENT,
    action: AuditAction.CONSENT_CREATE,
    resourceType: AuditResourceType.ACCESS_CONSENT,
    outcome: AuditOutcome.SUCCESS,
    metadata: { permissionLevel: 'FULL', expiresInMinutes: 10080 },
  });

  await createAuditLog({
    actorUserId: doctorId,
    actorRole: UserRole.DOCTOR,
    action: AuditAction.CONSENT_VERIFY_SUCCESS,
    resourceType: AuditResourceType.ACCESS_CONSENT,
    outcome: AuditOutcome.SUCCESS,
    targetUserId: patientId,
    metadata: { permissionLevel: 'FULL' },
  });

  await createAuditLog({
    actorUserId: adminId,
    actorRole: UserRole.ADMIN,
    action: AuditAction.COMPLIANCE_REPORT_VIEW,
    resourceType: AuditResourceType.COMPLIANCE,
    outcome: AuditOutcome.SUCCESS,
    metadata: { auditScan: 'COMPLETE', complianceScore: 100 },
  });

  logger.info('Audit log trail seeded cleanly.');
};

export const seedMasterData = async (): Promise<void> => {
  logger.info('Seeding 3 master demo accounts...');
  const ids = await seedUsers();

  const patientId = ids[UserRole.PATIENT];
  const doctorId = ids[UserRole.DOCTOR];
  const adminId = ids[UserRole.ADMIN];

  if (patientId && doctorId && adminId) {
    logger.info('Populating Patient Digital Twin data for analysis & hackathon demo...');
    await seedPatientProfile(patientId);
    await seedVitals(patientId);
    await seedMedications(patientId, doctorId);
    await seedAllergies(patientId);
    await seedOrgans(patientId);
    await seedConsent(patientId, doctorId);
    await seedDocuments(patientId);
    await seedNotesAndPrescriptions(patientId, doctorId);
    await seedAuditLogs(patientId, doctorId, adminId);
  }

  logger.info('');
  logger.info('====================================================');
  logger.info('✅ MEDTWIN MASTER SEED COMPLETE! DEMO CREDENTIALS:');
  logger.info('====================================================');
  logger.info(' 1. PATIENT ACCOUNT:');
  logger.info('    Email    : patient@medtwin.test');
  logger.info('    Password : Patient123!');
  logger.info('    Name     : Hardish Sharma');
  logger.info('    PatientID: ' + patientId);
  logger.info('');
  logger.info(' 2. DOCTOR ACCOUNT:');
  logger.info('    Email    : doctor@medtwin.test');
  logger.info('    Password : Doctor123!');
  logger.info('    Name     : Dr. Priya Sharma');
  logger.info('    Access PIN: 123456');
  logger.info('');
  logger.info(' 3. ADMIN ACCOUNT:');
  logger.info('    Email    : admin@medtwin.test');
  logger.info('    Password : Admin123!');
  logger.info('    Name     : MedTwin Governance Admin');
  logger.info('====================================================');
  logger.info('');
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

// Execute if run directly from command line
if (process.argv[1]?.includes('seed')) {
  main();
}

