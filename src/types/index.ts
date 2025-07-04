
import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email?: string; // Changed from string | null
  displayName?: string; // Changed from string | null
  role?: 'user' | 'admin';
  // Add other profile fields if needed
}

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface BloodRequest {
  id?: string; // Firestore document ID
  userId: string; // UID of the user who posted the request
  requesterName?: string; // Optional: name of person posting
  patientName?: string; // Optional: name of patient
  bloodGroup: BloodGroup;
  location: string; // Hospital/Location
  contactInformation: string;
  additionalNotes?: string;
  createdAt: Timestamp;
  status: 'active' | 'fulfilled' | 'pending'; 
}

export interface Donor {
  id?: string; // Firestore document ID
  userId: string; // UID of the registered donor
  fullName: string;
  bloodGroup: BloodGroup;
  location: string; // City/Area
  contactNumber: string;
  fcmToken?: string; // Already string | undefined, which is correct
  available?: boolean; // To mark availability status
  lastDonated?: Timestamp;
  createdAt: Timestamp;
}

export interface Hospital {
  id: string;
  name: string;
  address: string; // Changed from location to address for clarity
  contact?: string;
  imageUrl: string;
  dataAiHint?: string;
}

export interface MatchedPair {
  donorId: string;
  requestId: string;
  reason: string;
  // Optionally enriched with full donor/request details for display
  donor?: Donor;
  request?: BloodRequest;
}

export const bloodGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
