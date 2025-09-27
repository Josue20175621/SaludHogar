// family.ts terrible name
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  families: Family[];
}

export interface FamilyMember {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  relation: string;
  blood_type: string;
  phone_number: string;
  tobacco_use: string;
  alcohol_use: string;
  occupation: string;
}

export interface Family {
  id: number;
  name: string;
  role: string;
}

export interface Appointment {
  id: number;
  member_id: number;
  doctor_name: string;
  specialty: string;
  location: string;
  notes: string;
  appointment_date: string;
}

export interface Medication {
  id: number;
  member_id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  prescribed_by: string;
  notes: string;
}

export interface Vaccination {
  id: number;
  member_id: number;
  vaccine_name: string;
  date_administered: string;
  administered_by: string;
  notes: string;
}

export interface DashboardStats {
  member_count: number;
  upcoming_appointment_count: number;
  active_medication_count: number;
  vaccination_record_count: number;
}

export interface Allergy {
  id: number;
  member_id: number;
  category: string;
  name: string;
  reaction?: string;
  is_severe: boolean;
}

export interface Condition {
  id: number;
  member_id: number;
  name: string;
  date_diagnosed?: string;
  is_active: boolean;
  notes?: string;
}

export interface Surgery {
  id: number;
  member_id: number;
  name: string;
  date_of_procedure: string;
  surgeon_name?: string;
  facility_name?: string;
  notes?: string;
}

export interface Hospitalization {
  id: number;
  member_id: number;
  reason: string;
  admission_date: string;
  discharge_date?: string;
  facility_name?: string;
  notes?: string;
}

export interface FamilyHistoryCondition {
  id: number;
  condition_name: string;
  relative: string;
  notes?: string;
}