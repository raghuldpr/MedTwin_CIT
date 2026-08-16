import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { UserRole } from '../utils/roles';
import { sendResponse } from '../utils/response.util';

const router = Router();

/**
 * RBAC Verification Test Routes:
 * Protected development routes designed to test and confirm role-based access rules.
 */

// Route accessible only by PATIENT role
router.get(
  '/patient',
  authenticate,
  authorizeRoles(UserRole.PATIENT),
  (_req: Request, res: Response): void => {
    sendResponse(res, 200, {
      success: true,
      message: 'Patient route accessible',
    });
  }
);

// Route accessible only by DOCTOR role
router.get(
  '/doctor',
  authenticate,
  authorizeRoles(UserRole.DOCTOR),
  (_req: Request, res: Response): void => {
    sendResponse(res, 200, {
      success: true,
      message: 'Doctor route accessible',
    });
  }
);

// Route accessible only by ADMIN role
router.get(
  '/admin',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  (_req: Request, res: Response): void => {
    sendResponse(res, 200, {
      success: true,
      message: 'Admin route accessible',
    });
  }
);

// Route accessible by DOCTOR role (clinical workflow verification)
router.get(
  '/clinical',
  authenticate,
  authorizeRoles(UserRole.DOCTOR),
  (_req: Request, res: Response): void => {
    sendResponse(res, 200, {
      success: true,
      message: 'Doctor route accessible',
    });
  }
);

// Route accessible by ADMIN role (governance workflow verification)
router.get(
  '/governance',
  authenticate,
  authorizeRoles(UserRole.ADMIN),
  (_req: Request, res: Response): void => {
    sendResponse(res, 200, {
      success: true,
      message: 'Admin route accessible',
    });
  }
);

export default router;
