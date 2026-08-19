/** Admin API Service */
import { get, patch } from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  doctorVerification?: {
    verificationStatus: string;
    verificationTimestamp?: string;
    rejectionReason?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  outcome: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ComplianceSummary {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  totalAuditLogs: number;
  auditLogsByAction?: Record<string, number>;
  generatedAt: string;
}

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.role) qs.set('role', params.role);
    if (params?.search) qs.set('search', params.search);
    return get<{ users: AdminUser[]; total: number; page: number; limit: number }>(`/api/admin/users?${qs}`);
  },

  getUserById: (userId: string) =>
    get<{ user: AdminUser }>(`/api/admin/users/${userId}`),

  updateUserStatus: (userId: string, status: string) =>
    patch<{ user: AdminUser }>(`/api/admin/users/${userId}/status`, { status }),

  updateDoctorVerification: (doctorId: string, verificationStatus: string, rejectionReason?: string) =>
    patch<{ user: AdminUser }>(`/api/admin/doctors/${doctorId}/verification`, { verificationStatus, rejectionReason }),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string; outcome?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.action) qs.set('action', params.action);
    if (params?.outcome) qs.set('outcome', params.outcome);
    return get<{ logs: AuditLogEntry[]; total: number; page: number }>(`/api/admin/audit-logs?${qs}`);
  },

  getComplianceSummary: () =>
    get<{ summary: ComplianceSummary }>('/api/admin/compliance/summary'),
};
