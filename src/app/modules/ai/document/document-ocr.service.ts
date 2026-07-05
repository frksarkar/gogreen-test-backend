const pdfParse = require("pdf-parse-fork");

import {
  DocumentOCRResult,
  DocumentType,
  ExtractedDocumentData,
} from "./document.types";
import { GeminiService } from "../gemini.service";
import ApiError from "../../../errors/ApiError";
import httpStatus from "http-status";

export class DocumentOCRService {
  static async extractFromDocument(
    fileBuffer: Buffer,
    mimeType: string = "image/jpeg",
  ): Promise<DocumentOCRResult> {
    try {
      if (mimeType === "application/pdf") {
        return await this.extractFromPDF(fileBuffer);
      }

      return await this.extractFromImage(fileBuffer, mimeType);
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Document extraction failed: ${error.message}`);
    }
  }

  private static async extractFromPDF(
    pdfBuffer: Buffer,
  ): Promise<DocumentOCRResult> {
    try {
      let extractedText = "";

      try {
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text || "";
      } catch (innerError: any) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Failed to parse PDF content. Please ensure it's a valid PDF.");
      }

      extractedText = (extractedText || "").trim();

      if (!extractedText || extractedText.length < 10) {
        return {
          success: false,
          extractedData: { extractedText: "No text found in PDF" },
          confidence: 0,
          readableFields: [],
          unreadableFields: [],
          warnings: [
            "PDF appears to be image-based (scanned document)",
            "No readable text found",
            "Solution: Upload as image (JPG/PNG) instead of PDF",
          ],
          message: "No text found in PDF. Please upload as image format.",
        };
      }

      return await this.parseTextWithAI(extractedText);
    } catch (error: any) {
       if (error instanceof ApiError) throw error;
       throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `PDF processing failed: ${error.message}`);
    }
  }

  private static async extractFromImage(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<DocumentOCRResult> {
    try {
    const prompt = this.buildDocumentExtractionPrompt();
    const result = await GeminiService.generateJSON<DocumentOCRResult>(
      prompt, 
      { data: imageBuffer.toString("base64"), mimeType }
    );
    
    result.extractedData = this.postProcessData(result.extractedData);
    return result;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Image extraction failed: ${error.message}`);
    }
  }

  private static async parseTextWithAI(
    text: string,
  ): Promise<DocumentOCRResult> {
    try {
      const prompt = `You are a document data extraction expert. Extract structured data from this text.

**TEXT FROM DOCUMENT:**
${text.substring(0, 3000)} ${text.length > 3000 ? "... (truncated)" : ""}

${this.buildDocumentExtractionPrompt()}`;

      const result = await GeminiService.generateJSON<DocumentOCRResult>(prompt);

      result.extractedData = this.postProcessData(result.extractedData);
      result.extractedData.extractedText = text;

      return result;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Text parsing failed: ${error.message}`);
    }
  }

  private static buildDocumentExtractionPrompt(): string {
    return `Extract ALL data from this document (Passport/NID/License/Any ID).

**CRITICAL INSTRUCTIONS:**
1. If the document contains Bangla (Bengali) text, TRANSLATE everything to English
2. Convert Bangla names to English transliteration (e.g., "মোহাম্মদ" → "Mohammad")
3. Convert Bangla addresses to English (e.g., "ঢাকা" → "Dhaka")
4. ALL extracted data MUST be in English only
5. Detect the language but return all values in English

Return ONLY this JSON (no extra text):
{
  "success": true,
  "documentType": "passport|nid|driving_license|voter_id|other",
  "extractedData": {
    "firstName": "... (in English)",
    "lastName": "... (in English)",
    "fullName": "... (in English)",
    "dateOfBirth": "YYYY-MM-DD",
    "gender": "Male|Female|Other",
    "nationality": "... (in English)",
    "documentNumber": "...",
    "passportNumber": "...",
    "nidNumber": "...",
    "issueDate": "YYYY-MM-DD",
    "expiryDate": "YYYY-MM-DD",
    "placeOfBirth": "... (in English)",
    "placeOfIssue": "... (in English)",
    "address": "... (in English)",
    "city": "... (in English)",
    "country": "... (in English)",
    "phone": "...",
    "email": "...",
    "fatherName": "... (in English)",
    "motherName": "... (in English)",
    "bloodGroup": "...",
    "extractedText": "all visible text",
    "detectedLanguage": "en|bn"
  },
  "confidence": 0.0-1.0,
  "readableFields": ["field1", "field2"],
  "unreadableFields": [],
  "warnings": []
}

Translate Bangla to English. Return ALL data in English format.`;
  }

  private static postProcessData(
    data: ExtractedDocumentData,
  ): ExtractedDocumentData {
    const formatDate = (dateStr: string | undefined): string | undefined => {
      if (!dateStr) return undefined;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime())
          ? dateStr
          : date.toISOString().split("T")[0];
      } catch {
        return dateStr;
      }
    };

    data.dateOfBirth = formatDate(data.dateOfBirth);
    data.issueDate = formatDate(data.issueDate);
    data.expiryDate = formatDate(data.expiryDate);

    if (data.firstName) data.firstName = data.firstName.trim();
    if (data.lastName) data.lastName = data.lastName.trim();
    if (data.fullName) data.fullName = data.fullName.trim();
    if (data.address) data.address = data.address.trim();

    if (!data.documentNumber) {
      data.documentNumber = data.passportNumber || data.nidNumber;
    }

    return data;
  }

  static validateQuality(result: DocumentOCRResult): {
    isAcceptable: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (result.confidence < 0.5) {
      issues.push("Low confidence (< 50%)");
    }

    const criticalFields = ["firstName", "fullName", "documentNumber"];
    const hasCriticalField = criticalFields.some((field) =>
      result.readableFields.includes(field),
    );

    if (!hasCriticalField) {
      issues.push("No critical fields detected");
    }

    if (result.warnings.length > 2) {
      issues.push("Multiple warnings");
    }

    return {
      isAcceptable: issues.length === 0 && result.confidence >= 0.5,
      issues,
    };
  }
}
