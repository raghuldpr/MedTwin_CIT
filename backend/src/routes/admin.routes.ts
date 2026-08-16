import { Router } from 'express';
import {
  getAuditLogsHandler,
  verifyAuditIntegrityHandler,
} from '../controllers/adminAudit.controller';
import {
  listUsersHandler,
  getUserByIdHandler,
  updateUserStatusHandler,
  updateDoctorVerificationHandler,
} from '../controllers/admin.controller';
import {
  getComplianceSummaryHandler,
  getComplianceAuditReportHandler,
  exportComplianceReportHandler,
} from '../controllers/compliance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { UserRole } from '../utils/roles';

const router = Router();

// Enforce authentication + ADMIN role authorization for all admin endpoints
router.use(authenticate, authorizeRoles(UserRole.ADMIN));

// Compliance & Regulatory Reporting
router.get('/compliance/summary', getComplianceSummaryHandler);
router.get('/compliance/audit-report', getComplianceAuditReportHandler);
router.get('/compliance/export', exportComplianceReportHandler);

// User Governance & Search
router.get('/users', listUsersHandler);
router.get('/users/:userId', getUserByIdHandler);
router.patch('/users/:userId/status', updateUserStatusHandler);

// Doctor Credential Verification
router.patch('/doctors/:doctorId/verification', updateDoctorVerificationHandler);

// Tamper-Evident Audit Log querying and integrity verification
router.get('/audit-logs', getAuditLogsHandler);
router.get('/audit-logs/integrity', verifyAuditIntegrityHandler);

export default router;
