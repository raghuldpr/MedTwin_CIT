export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export const VALID_USER_ROLES = Object.values(UserRole);

export const isValidUserRole = (role: string): role is UserRole => {
  return VALID_USER_ROLES.includes(role as UserRole);
};

export const isPatientRole = (role?: UserRole | string): boolean => role === UserRole.PATIENT;
export const isDoctorRole = (role?: UserRole | string): boolean => role === UserRole.DOCTOR;
export const isAdminRole = (role?: UserRole | string): boolean => role === UserRole.ADMIN;
