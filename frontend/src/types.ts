export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  bloodGroup: string;
  weight: string;
  height: string;
  patientId: string;
  lastSynced: string;
  avatar: string;
  twinGender: 'male' | 'female';
}

export interface VitalMetric {
  id: string;
  name: string;
  value: string | number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'good' | 'stable';
  normalRange: string;
  iconName: string;
  color: string;
  trend?: number[];
}

export interface OrganDetail {
  id: string;
  name: string;
  slug: string;
  status: 'Stable' | 'Healthy' | 'Good' | 'Normal' | 'Monitor';
  statusColor: 'emerald' | 'blue' | 'amber' | 'rose';
  imagePath: string;
  description: string;
  icon: string;
  primaryMetric: {
    label: string;
    value: string;
    unit?: string;
    statusText: string;
  };
  metrics: {
    label: string;
    value: string;
    range?: string;
  }[];
  waveformType: 'ecg' | 'eeg' | 'spiro' | 'nephron' | 'hepatic' | 'gastric';
  keyIndicators: {
    label: string;
    value: string;
    level: 'Good' | 'Normal' | 'Low' | 'Moderate' | 'High' | 'None';
  }[];
  recentReadings?: {
    time: string;
    value: string;
  }[];
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  frequency: string;
  time: string;
  status: 'Taken' | 'Upcoming' | 'Reminder';
  dueText?: string;
  category: 'cardiac' | 'metabolic' | 'supplement' | 'other';
  startDate: string;
  prescribedBy: string;
}

export interface MedicalDocument {
  id: string;
  title: string;
  type: 'PDF' | 'Image' | 'DICOM';
  category: 'Reports' | 'Prescriptions' | 'Scans';
  date: string;
  doctor?: string;
  facility?: string;
  isNew?: boolean;
  size: string;
  summary?: string;
  details?: {
    findings: string[];
    impression: string;
    recommendation: string;
  };
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'In-Person' | 'Teleconsultation';
  status: 'Confirmed' | 'Pending' | 'Completed';
  avatar: string;
}
