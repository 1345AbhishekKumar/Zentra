import { DocumentCategory } from "@/types";
import { parse, parseISO, isValid, isAfter, startOfToday, format } from "date-fns";

// Try to safely import the native text-recognition module.
// If it is not available (e.g., in Sandbox/Expo Go/Web), we fallback gracefully.
let TextRecognition: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mlkit = require("@react-native-ml-kit/text-recognition");
  if (mlkit) {
    TextRecognition = mlkit.default || mlkit;
  }
} catch {
  // Native module is not linked or package is not installed (expected in Sandbox/Web/Expo Go)
}

/**
 * Extracts raw text from an image. Uses local ML Kit on-device recognition if available,
 * otherwise falls back to simulating OCR for Sandbox Mode.
 */
export async function extractTextFromImage(imageUri: string, filename: string): Promise<string> {
  if (TextRecognition && TextRecognition.recognize) {
    try {
      console.log(`Running on-device OCR on URI: ${imageUri}`);
      const result = await TextRecognition.recognize(imageUri);
      return result.text || "";
    } catch (error: any) {
      const errMsg = error?.message || "";
      if (errMsg.includes("linked") || errMsg.includes("linking") || errMsg.includes("managed workflow")) {
        console.log("Native ML Kit text recognition is not linked in this build. Using simulated sandbox parser.");
      } else {
        console.warn("Local OCR text recognition failed, falling back to simulated parser:", error);
      }
    }
  }

  // Fallback / Sandbox Mode: Generate simulated OCR text based on the filename
  return getSimulatedOCRText(filename);
}

interface DocTypeKeyword {
  keywords: string[];
  suggestedName: string;
}

const DOCUMENT_KEYWORDS: DocTypeKeyword[] = [
  {
    keywords: ["income tax department", "permanent account number", "pan card", "pancard"],
    suggestedName: "PAN Card"
  },
  {
    keywords: ["aadhaar", "uidai", "government of india", "unique identification"],
    suggestedName: "Aadhaar Card"
  },
  {
    keywords: ["passport", "passeport"],
    suggestedName: "Passport"
  },
  {
    keywords: ["driver license", "driving license", "drivers license", "permis de conduire"],
    suggestedName: "Driver License"
  },
  {
    keywords: ["health insurance", "medical card", "insurance card", "blue shield", "blue cross", "medicare", "medicaid"],
    suggestedName: "Health Insurance"
  },
  {
    keywords: ["national id", "identity card", "citizenship card", "voter id", "electoral card"],
    suggestedName: "Identity Card"
  },
  {
    keywords: ["visa", "residence permit", "residency card", "green card"],
    suggestedName: "Visa / Residence Permit"
  },
  {
    keywords: ["rental agreement", "lease agreement", "tenancy agreement"],
    suggestedName: "Rental Agreement"
  },
  {
    keywords: ["employment contract", "employment agreement", "offer letter"],
    suggestedName: "Employment Contract"
  },
  {
    keywords: ["electric bill", "water bill", "utility bill", "internet bill", "telephone bill", "gas bill"],
    suggestedName: "Utility Bill"
  },
  {
    keywords: ["invoice", "receipt", "purchase order"],
    suggestedName: "Invoice / Receipt"
  },
  {
    keywords: ["tax return", "w2", "form 1040", "tax statement"],
    suggestedName: "Tax Document"
  }
];

/**
 * Parses raw text extracted from a document to find expiry date, name, and category.
 */
export function parseDocumentDetails(
  text: string,
  filename: string
): { name?: string; expiryDate?: string; category?: DocumentCategory } {
  const normalizedText = text.toLowerCase();
  const result: { name?: string; expiryDate?: string; category?: DocumentCategory } = {};

  // 1. Identify Category
  if (normalizedText.includes("passport") || normalizedText.includes("visa") || normalizedText.includes("national id") || normalizedText.includes("identity card") || normalizedText.includes("aadhaar") || normalizedText.includes("pan")) {
    result.category = "Personal";
  } else if (normalizedText.includes("license") || normalizedText.includes("driving") || normalizedText.includes("permit")) {
    result.category = "Personal";
  } else if (normalizedText.includes("insurance") || normalizedText.includes("medical") || normalizedText.includes("health") || normalizedText.includes("prescription")) {
    result.category = "Health";
  } else if (normalizedText.includes("invoice") || normalizedText.includes("tax") || normalizedText.includes("bank") || normalizedText.includes("finance") || normalizedText.includes("salary") || normalizedText.includes("receipt")) {
    result.category = "Finance";
  } else if (normalizedText.includes("contract") || normalizedText.includes("employment") || normalizedText.includes("agreement") || normalizedText.includes("employee")) {
    result.category = "Work";
  } else {
    result.category = "Other";
  }

  // 2. Identify Document Name
  result.name = extractDocumentName(text, filename);

  // 3. Find Expiry Date
  result.expiryDate = extractExpiryDate(text);

  return result;
}

/**
 * Extracts a candidate document name from the text or falls back to cleaning the filename.
 */
function extractDocumentName(text: string, filename: string): string {
  const normalizedText = text.toLowerCase();

  // 1. First, search the raw text for specific document type keyword combinations
  for (const item of DOCUMENT_KEYWORDS) {
    if (item.keywords.some(keyword => normalizedText.includes(keyword))) {
      return item.suggestedName;
    }
  }

  // 2. If no matching keywords are found in the text, check the top lines of the document
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  for (let i = 0; i < Math.min(lines.length, 3); i++) {
    const line = lines[i];
    // Ignore lines that look like dates or numbers or are too long/short
    if (line.length >= 3 && line.length <= 40 && !/^\d+$/.test(line) && !/[-/.]/.test(line)) {
      return line.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
  }

  // 3. Fallback: Clean up filename, but check if it's a generic camera/random string
  const cleanName = filename.substring(0, filename.lastIndexOf(".")) || filename;
  const isGeneric = /^(image|photo|camera|capture|img|dsc|whatsapp_image|afhdakjsfash|doc|document|file|[a-f0-9]{8,})$/i.test(cleanName.replace(/[_-]/g, "").trim());
  
  if (isGeneric) {
    return "Scanned Document";
  }

  return cleanName
    .replace(/[_-]/g, " ")
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

/**
 * Extracts a future date from the text, prioritizing dates near "expiry" keywords.
 */
function extractExpiryDate(text: string): string | undefined {
  const lines = text.split("\n");
  const today = startOfToday();
  const dateCandidates: { dateStr: string; dateObj: Date; hasExpiryKeyword: boolean }[] = [];

  // Expiry context keywords
  const expiryKeywords = ["expiry", "expires", "exp", "valido", "until", "valid to", "expiration", "exp. date"];

  // Regular expressions to match common date formats
  // Matches YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const datePattern1 = /\b(\d{4})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/;
  // Matches DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
  const datePattern2 = /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](\d{4})\b/;
  // Matches MM-DD-YYYY, MM/DD/YYYY, MM.DD.YYYY
  const datePattern3 = /\b(0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])[-/.](\d{4})\b/;
  // Matches written format e.g. "12 May 2028", "12-May-2028", "May 12, 2028"
  const datePattern4 = /\b(0?[1-9]|[12]\d|3[01])[-/\s]?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s,:]?(\d{4})\b/i;
  const datePattern5 = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]?(0?[1-9]|[12]\d|3[01])[-/\s,:]?(\d{4})\b/i;

  const tryParseDate = (dateStr: string, formatStr?: string): Date | undefined => {
    try {
      if (formatStr) {
        const parsed = parse(dateStr, formatStr, new Date());
        if (isValid(parsed)) return parsed;
      } else {
        const parsed = parseISO(dateStr);
        if (isValid(parsed)) return parsed;
      }
    } catch {
      // Ignore parse failure
    }
    return undefined;
  };

  // Helper to check if a line or its neighbors contain expiry keywords
  const checkExpiryKeywordNearby = (lineIdx: number): boolean => {
    const start = Math.max(0, lineIdx - 1);
    const end = Math.min(lines.length - 1, lineIdx + 1);
    for (let i = start; i <= end; i++) {
      const lineLower = lines[i].toLowerCase();
      if (expiryKeywords.some(keyword => lineLower.includes(keyword))) {
        return true;
      }
    }
    return false;
  };

  // Scan each line for dates
  lines.forEach((line, lineIdx) => {
    let match;
    const isExpiryKeywordNearby = checkExpiryKeywordNearby(lineIdx);

    // Try Pattern 1 (YYYY-MM-DD)
    if ((match = line.match(datePattern1))) {
      const dateStr = `${match[1]}-${match[2]}-${match[3]}`;
      const dateObj = tryParseDate(dateStr);
      if (dateObj && isAfter(dateObj, today)) {
        dateCandidates.push({ dateStr, dateObj, hasExpiryKeyword: isExpiryKeywordNearby });
      }
    }

    // Try Pattern 2 (DD-MM-YYYY)
    if ((match = line.match(datePattern2))) {
      const dateStr = `${match[3]}-${match[2]}-${match[1]}`;
      const dateObj = tryParseDate(dateStr);
      if (dateObj && isAfter(dateObj, today)) {
        dateCandidates.push({ dateStr, dateObj, hasExpiryKeyword: isExpiryKeywordNearby });
      }
    }

    // Try Pattern 3 (MM-DD-YYYY)
    if ((match = line.match(datePattern3))) {
      const dateStr = `${match[3]}-${match[1]}-${match[2]}`;
      const dateObj = tryParseDate(dateStr);
      if (dateObj && isAfter(dateObj, today)) {
        // Only push if not already detected
        if (!dateCandidates.some(c => c.dateStr === dateStr)) {
          dateCandidates.push({ dateStr, dateObj, hasExpiryKeyword: isExpiryKeywordNearby });
        }
      }
    }

    // Try Pattern 4 (12 May 2028)
    if ((match = line.match(datePattern4))) {
      const day = match[1].padStart(2, "0");
      const monthAbbr = match[2].substring(0, 3);
      const year = match[3];
      // Format to DD-MMM-YYYY for parse
      const dateRaw = `${day}-${monthAbbr}-${year}`;
      const dateObj = tryParseDate(dateRaw, "dd-MMM-yyyy");
      if (dateObj && isAfter(dateObj, today)) {
        const dateStr = format(dateObj, "yyyy-MM-dd");
        dateCandidates.push({ dateStr, dateObj, hasExpiryKeyword: isExpiryKeywordNearby });
      }
    }

    // Try Pattern 5 (May 12, 2028)
    if ((match = line.match(datePattern5))) {
      const monthAbbr = match[1].substring(0, 3);
      const day = match[2].padStart(2, "0");
      const year = match[3];
      const dateRaw = `${monthAbbr}-${day}-${year}`;
      const dateObj = tryParseDate(dateRaw, "MMM-dd-yyyy");
      if (dateObj && isAfter(dateObj, today)) {
        const dateStr = format(dateObj, "yyyy-MM-dd");
        dateCandidates.push({ dateStr, dateObj, hasExpiryKeyword: isExpiryKeywordNearby });
      }
    }
  });

  if (dateCandidates.length === 0) return undefined;

  // Prioritize dates with expiry keywords nearby, otherwise take the first candidate
  const prioritized = dateCandidates.sort((a, b) => {
    if (a.hasExpiryKeyword && !b.hasExpiryKeyword) return -1;
    if (!a.hasExpiryKeyword && b.hasExpiryKeyword) return 1;
    // Fallback: sort by date ascending (soonest expiry first)
    return a.dateObj.getTime() - b.dateObj.getTime();
  });

  return prioritized[0].dateStr;
}

/**
 * Returns a simulated OCR text based on the file name for Sandbox Mode.
 */
function getSimulatedOCRText(filename: string): string {
  const nameLower = filename.toLowerCase();
  const currentYear = new Date().getFullYear();

  if (nameLower.includes("passport")) {
    return `
      PASSPORT / PASSEPORT
      UNITED STATES OF AMERICA
      Document No: 987654321
      Surname: SMITH
      Given Names: JOHN
      Nationality: USA
      Date of Birth: 12 JAN 1990
      Sex: M
      Date of Issue: 15 AUG ${currentYear - 2}
      Date of Expiry: 15 AUG ${currentYear + 8}
      Authority: Department of State
    `;
  }

  if (nameLower.includes("pan") || nameLower.includes("tax")) {
    return `
      INCOME TAX DEPARTMENT
      GOVERNMENT OF INDIA
      PERMANENT ACCOUNT NUMBER CARD
      PAN Card No: ABCDE1234F
      Name: ABHISHEK KUMAR
      Father's Name: RAJESH KUMAR
      DOB: 05/20/1995
      Expiry Date / Valid Until: 04/01/${currentYear + 15}
    `;
  }

  if (nameLower.includes("aadhaar") || nameLower.includes("uidai") || nameLower.includes("government")) {
    return `
      GOVERNMENT OF INDIA
      UNIQUE IDENTIFICATION AUTHORITY OF INDIA
      Aadhaar Card / Mera Aadhaar, Meri Pehchan
      To: Abhishek Kumar
      Address: 123 Silicon Street
      DOB: 20/05/1995
      Aadhaar No: 1234 5678 9012
      Valid until / Expiry Date: 15/06/${currentYear + 20}
    `;
  }

  if (nameLower.includes("license") || nameLower.includes("driving") || nameLower.includes("permit")) {
    return `
      DRIVER LICENSE
      STATE OF CALIFORNIA
      DL No: CA1234567
      Class: C
      Name: ABHISHEK KUMAR
      Address: 123 Silicon Valley Road, San Jose, CA
      DOB: 05/20/1995
      SEX: M
      Issued: 11/22/${currentYear - 1}
      Expires / Expiry Date: 11/22/${currentYear + 4}
    `;
  }

  if (nameLower.includes("insurance") || nameLower.includes("medical") || nameLower.includes("health")) {
    return `
      BLUE SHIELD HEALTH INSURANCE
      Member ID: H123456789
      Group No: GR78910
      Subscriber: ABHISHEK KUMAR
      Plan: Gold PPO
      Effective Date: 04/01/${currentYear - 3}
      Expiry Date / Valid Until: 04/01/${currentYear + 2}
    `;
  }

  if (nameLower.includes("contract") || nameLower.includes("employment")) {
    return `
      EMPLOYMENT AGREEMENT
      This agreement is made between Zentra Corp and Employee.
      Job Title: Senior React Native Developer
      Start Date: 01 MAR ${currentYear}
      Term Expiry: 28 FEB ${currentYear + 3}
      Compensation: Details confidential.
      Signature of Employee
    `;
  }

  // Fallback generic document text (expires in 1 year)
  return `
    OFFICIAL DOCUMENT
    Ref: DOC-${Date.now()}
    Category: General File
    Issued on: 10 May ${currentYear}
    Valid Until / Exp. Date: 10 May ${currentYear + 1}
    Zentra Privacy Protection Verified.
  `;
}
