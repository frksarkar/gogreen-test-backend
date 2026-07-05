

export type DocumentType =
  | "passport"
  | "nid"
  | "driving_license"
  | "voter_id"
  | "birth_certificate"
  | "other";

export interface ExtractedDocumentData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string; 
  gender?: "Male" | "Female" | "Other";
  nationality?: string;

  // Document Information
  documentType?: DocumentType;
  documentNumber?: string;
  issueDate?: string; 
  expiryDate?: string; 
  issuingAuthority?: string;

  // Address Information
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;

  // Contact Information (if available)
  phone?: string;
  email?: string;

  // Additional Fields (for NID/other documents)
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  bloodGroup?: string;

  // Passport Specific
  passportNumber?: string;
  placeOfBirth?: string;
  placeOfIssue?: string;

  // NID Specific
  nidNumber?: string;

  // Metadata
  extractedText?: string;
  detectedLanguage?: string;
}

export interface DocumentOCRResult {
  success: boolean;
  documentType?: DocumentType;
  extractedData: ExtractedDocumentData;
  confidence: number; // 0-1
  readableFields: string[];
  unreadableFields: string[];
  warnings: string[];
  message?: string;
}

export interface FieldMapping {
  // Map extracted data to form fields
  [key: string]: any;
}
