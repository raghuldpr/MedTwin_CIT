export interface PatientProfile {
  id: string;
  name: string;
  patientId: string;
  age: number;
  gender: string;
  bloodGroup: string;
  avatarUrl: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
}

export type OrganId = 'heart' | 'brain' | 'lungs' | 'kidneys' | 'liver' | 'stomach' | 'bladder' | 'muscles' | 'bones' | 'skin';

export interface OrganStatus {
  id: OrganId;
  name: string;
  status: 'Stable' | 'Healthy' | 'Good' | 'Normal' | 'Strong' | 'Attention' | 'Critical';
  statusColor: string; // Tailwind text color class
  badgeColor: string;
  icon: string;
  iconBg: string;
  side: 'left' | 'right';
  summary: string;
  primaryMetric: {
    label: string;
    value: string;
    unit?: string;
  };
  metrics: {
    label: string;
    value: string;
    status?: string;
    statusColor?: string;
  }[];
  indicators: {
    label: string;
    value: string;
    icon: string;
    iconColor: string;
    valueColor?: string;
  }[];
  waveformType: 'ecg' | 'eeg' | 'respiratory' | 'renal' | 'flow';
}

export interface VitalRecord {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: 'normal' | 'optimal' | 'attention';
  statusText: string;
  updated: string;
  icon: string;
  iconColor: string;
  bgGradient: string;
  strokeColor: string;
  chartData: number[];
  normalRange: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  statusText: string;
  statusType: 'upcoming' | 'taken' | 'scheduled';
  instructions: string;
  refillLeft: number;
  doctor: string;
  category: string;
}

export interface MedicalDocument {
  id: string;
  name: string;
  date: string;
  fileType: 'PDF' | 'Image' | 'DICOM';
  fileSize: string;
  category: 'Reports' | 'Prescriptions' | 'Scans';
  doctor: string;
  isNew?: boolean;
  status: 'Available' | 'Processing';
  summary?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'Video Consultation' | 'In-Person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  avatar: string;
  meetingLink?: string;
}

export interface ConsentRecord {
  id: string;
  entityName: string;
  role: string;
  organization: string;
  permissions: string[];
  grantedDate: string;
  expiresDate: string;
  status: 'Active' | 'Revoked' | 'Expired';
}
