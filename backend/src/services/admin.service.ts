import mongoose from 'mongoose';
import {
  User,
  IUserDocument,
  SafeUser,
  AccountStatus,
  DoctorVerificationStatus,
} from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { UserRole } from '../utils/roles';

export interface IListUsersQuery {
  search?: string;
  role?: string;
  status?: string;
  page?: number | string;
  limit?: number | string;
}

export interface IListUsersResult {
  users: SafeUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * List and search users with pagination and filtering.
 */
export const listUsers = async (
  query: IListUsersQuery
): Promise<IListUsersResult> => {
  const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20), 10) || 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  // Search by name or email
  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  // Filter by role
  if (query.role && typeof query.role === 'string' && query.role.trim()) {
    const roleUpper = query.role.trim().toUpperCase();
    if (Object.values(UserRole).includes(roleUpper as UserRole)) {
      filter.role = roleUpper as UserRole;
    }
  }

  // Filter by status (ACTIVE / SUSPENDED)
  if (query.status && typeof query.status === 'string' && query.status.trim()) {
    const statusUpper = query.status.trim().toUpperCase();
    if (statusUpper === AccountStatus.ACTIVE) {
      filter.$or = [{ status: AccountStatus.ACTIVE }, { isActive: true, status: { $exists: false } }];
    } else if (statusUpper === AccountStatus.SUSPENDED) {
      filter.$or = [{ status: AccountStatus.SUSPENDED }, { isActive: false }];
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  const safeUsers: SafeUser[] = users.map((u) => u.toSafeUser());
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    users: safeUsers,
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Get user by ID (sanitized, safe representation).
 */
export const getUserById = async (userId: string): Promise<SafeUser> => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Invalid user identifier format', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user.toSafeUser();
};

/**
 * Update user account status (ACTIVE | SUSPENDED).
 * Security: Admin cannot suspend or change status of their own account.
 */
export const updateUserStatus = async (
  adminUserId: string,
  targetUserId: string,
  newStatus: string
): Promise<SafeUser> => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid user identifier format', 400);
  }

  if (adminUserId === targetUserId) {
    throw new AppError('Administrators cannot modify their own account status.', 400);
  }

  const normalizedStatus = (newStatus || '').trim().toUpperCase();
  if (
    normalizedStatus !== AccountStatus.ACTIVE &&
    normalizedStatus !== AccountStatus.SUSPENDED
  ) {
    throw new AppError(
      `Invalid account status. Supported values: ${Object.values(AccountStatus).join(', ')}`,
      400
    );
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found', 404);
  }

  const isActive = normalizedStatus === AccountStatus.ACTIVE;
  targetUser.status = normalizedStatus as AccountStatus;
  targetUser.isActive = isActive;

  await targetUser.save();

  return targetUser.toSafeUser();
};

/**
 * Verify or Reject Doctor credentials.
 */
export const updateDoctorVerification = async (
  adminUserId: string,
  doctorId: string,
  payload: {
    verificationStatus: string;
    rejectionReason?: string;
  }
): Promise<SafeUser> => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor identifier format', 400);
  }

  const normalizedStatus = (payload.verificationStatus || '').trim().toUpperCase();
  if (
    !Object.values(DoctorVerificationStatus).includes(
      normalizedStatus as DoctorVerificationStatus
    )
  ) {
    throw new AppError(
      `Invalid doctor verification status. Supported values: ${Object.values(
        DoctorVerificationStatus
      ).join(', ')}`,
      400
    );
  }

  const doctorUser = await User.findById(doctorId);
  if (!doctorUser) {
    throw new AppError('Doctor record not found', 404);
  }

  if (doctorUser.role !== UserRole.DOCTOR) {
    throw new AppError(
      'Target user is not a doctor. Doctor verification applies only to doctor accounts.',
      400
    );
  }

  doctorUser.doctorVerification = {
    verificationStatus: normalizedStatus as DoctorVerificationStatus,
    verificationTimestamp: new Date(),
    verifiedBy: new mongoose.Types.ObjectId(adminUserId),
    rejectionReason:
      normalizedStatus === DoctorVerificationStatus.REJECTED
        ? (payload.rejectionReason || '').trim() || 'Credentials rejected by administrator.'
        : undefined,
  };

  await doctorUser.save();

  return doctorUser.toSafeUser();
};
