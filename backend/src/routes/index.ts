import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import testRoutes from './test.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import adminRoutes from './admin.routes';
import voiceRoutes from './voice.routes';

const router = Router();

// Base API Routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/patient', patientRoutes);
router.use('/doctor', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/voice', voiceRoutes);
router.use('/test', testRoutes); // RBAC verification routes (development)

// Placeholder mount points for upcoming modules:
// router.use('/records', recordRoutes);
// router.use('/ai', aiRoutes);
// router.use('/audit', auditRoutes);

export default router;
