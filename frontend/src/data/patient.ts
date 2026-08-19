import { Patient } from '../types';

export const initialPatient: Patient = {
  id: 'pt-1',
  name: 'Aarav Sharma',
  age: 32,
  gender: 'Male',
  bloodGroup: 'O+',
  weight: '74 kg',
  height: '178 cm',
  patientId: 'MT-78425',
  lastSynced: 'Just now',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  twinGender: 'male',
};

export const alternatePatient: Patient = {
  id: 'pt-2',
  name: 'Ananya Verma',
  age: 29,
  gender: 'Female',
  bloodGroup: 'B+',
  weight: '62 kg',
  height: '165 cm',
  patientId: 'MT-59218',
  lastSynced: 'Synced just now',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
  twinGender: 'female',
};
