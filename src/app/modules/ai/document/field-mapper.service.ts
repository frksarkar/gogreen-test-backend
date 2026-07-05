
import { ExtractedDocumentData } from "./document.types";

export class FieldMapperService {
  // Map extracted document data to User profile fields
  static mapToUserFields(
    extractedData: ExtractedDocumentData
  ): any {
    const mappedFields: any = {};

    // Name
    if (extractedData.fullName) {
      mappedFields.name = extractedData.fullName;
    } else if (extractedData.firstName || extractedData.lastName) {
      mappedFields.name = `${extractedData.firstName || ""} ${extractedData.lastName || ""}`.trim();
    }

    // Birthday
    if (extractedData.dateOfBirth) {
      mappedFields.birthday = extractedData.dateOfBirth;
    }

    // Gender
    if (extractedData.gender) {
      mappedFields.gender = extractedData.gender.toUpperCase(); // Assuming Enum like MALE/FEMALE
    }

    // Contact
    if (extractedData.phone) {
      mappedFields.phone = extractedData.phone;
    }
    if (extractedData.email) {
      mappedFields.email = extractedData.email;
    }

    return mappedFields;
  }

  // Map extracted document data to Vendor verification fields
  static mapToVendorFields(
    extractedData: ExtractedDocumentData
  ): any {
    const mappedFields: any = {};

    // ID Numbers
    if (extractedData.nidNumber || (extractedData.documentType === 'nid' && extractedData.documentNumber)) {
      mappedFields.nidNumber = extractedData.nidNumber || extractedData.documentNumber;
    }
    
    if (extractedData.passportNumber || (extractedData.documentType === 'passport' && extractedData.documentNumber)) {
      mappedFields.passportNumber = extractedData.passportNumber || extractedData.documentNumber;
    }

    // Business info (if applicable/extracted)
    if (extractedData.documentType === 'other') {
      // Could be a trade license
      mappedFields.tradeLicense = extractedData.documentNumber;
    }

    return mappedFields;
  }

  // Map extracted document data to Address fields
  static mapToAddressFields(
    extractedData: ExtractedDocumentData
  ): any {
    const mappedFields: any = {};

    if (extractedData.address) {
      mappedFields.street_address = extractedData.address;
    }
    if (extractedData.city) {
      mappedFields.district = extractedData.city;
      mappedFields.division = extractedData.state || extractedData.city;
    }
    if (extractedData.postalCode) {
      mappedFields.zipcode = extractedData.postalCode;
    }
    
    // Default values if missing but required by schema
    mappedFields.area = extractedData.city || "Unknown";
    mappedFields.division = mappedFields.division || "Unknown";
    mappedFields.district = mappedFields.district || "Unknown";
    mappedFields.street_address = mappedFields.street_address || "See document";

    return mappedFields;
  }

  // Get all mapped fields for the multi-vendor platform
  static async getCompleteMappedData(
    extractedData: ExtractedDocumentData
  ): Promise<{
    userFields: any;
    vendorFields: any;
    addressFields: any;
    rawData: ExtractedDocumentData;
  }> {
    const userFields = this.mapToUserFields(extractedData);
    const vendorFields = this.mapToVendorFields(extractedData);
    const addressFields = this.mapToAddressFields(extractedData);

    return {
      userFields,
      vendorFields,
      addressFields,
      rawData: extractedData,
    };
  }
}
