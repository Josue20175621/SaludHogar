/**
 * Represents the raw data structure for a single family member
 * as received from or sent to the API.
 */
export interface FamilyMemberRaw {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string; // Stored as a string, e.g., "YYYY-MM-DD"
  gender: string;
  relation: string;
  blood_type: string;
  phone_number: string;
}

/**
 * Represents the raw data structure for a family, including its members,
 * as received from the API.
 */
export interface FamilyRaw {
  id: string;
  name: string;
  members: FamilyMemberRaw[];
}