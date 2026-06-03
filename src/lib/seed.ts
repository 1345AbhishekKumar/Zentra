import { useDocumentStore } from "@/store/documentStore";
import { ZentraDocument } from "@/types";
import * as FileSystem from "expo-file-system/legacy";

// 1x1 pixel base64 PNG image as a mock file content
const DUMMY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export const DEMO_FOLDERS = [
  "Personal",
  "Work",
  "Finance",
  "Health",
  "Travel",
  "Vehicle",
  "Legal",
  "Property",
  "Utilities",
  "Education",
  "Insurance",
  "Other",
];

let isSeeding = false;

export async function seedMockData(): Promise<void> {
  if (isSeeding) return;
  isSeeding = true;
  console.log("[Zentra Debug] Starting seed process...");

  try {
    // 1. Wait for Zustand to finish hydrating from AsyncStorage
    // This prevents the seed data from being instantly overwritten by the initial storage load
    const isHydrated = useDocumentStore.getState()._hasHydrated;
    if (!isHydrated) {
      console.log("[Zentra Debug] Waiting for store hydration...");
      await new Promise<void>((resolve) => {
        const unsub = useDocumentStore.subscribe((state) => {
          if (state._hasHydrated) {
            unsub();
            resolve();
          }
        });
        // Fallback check in case hydration completed before subscribe fired
        if (useDocumentStore.getState()._hasHydrated) {
          unsub();
          resolve();
        }
      });
    }

    console.log("[Zentra Debug] Store is hydrated. Building mock data...");
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Ensure attachments folder exists in the sandboxed documents directory
    const attachmentsDir = FileSystem.documentDirectory
      ? `${FileSystem.documentDirectory}attachments/`
      : null;
    try {
      if (attachmentsDir) {
        const dirInfo = await FileSystem.getInfoAsync(attachmentsDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(attachmentsDir, {
            intermediates: true,
          });
        }
      }
    } catch (e) {
      console.warn("Failed to create attachments folder:", e);
    }

    // Define 80 realistic document templates
    const templates = [
      // --- Personal ---
      {
        name: "Passport 2026.pdf",
        category: "Personal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 3,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Driver License.jpg",
        category: "Personal",
        fileType: "image",
        expiryOffsetDays: 365 * 5,
        isFavorite: true,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Aadhaar Card.png",
        category: "Personal",
        fileType: "image",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Voter ID Card.pdf",
        category: "Personal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "PAN Card.png",
        category: "Personal",
        fileType: "image",
        expiryOffsetDays: 365 * 15,
        isFavorite: false,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Birth Certificate.pdf",
        category: "Personal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 50,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Marriage Certificate.pdf",
        category: "Personal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 50,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Passport Photo.jpg",
        category: "Personal",
        fileType: "image",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Old Gym Card.png",
        category: "Personal",
        fileType: "image",
        expiryOffsetDays: -20,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 5,
        hasFile: true,
      },
      {
        name: "Expired Bus Pass.pdf",
        category: "Personal",
        fileType: "pdf",
        expiryOffsetDays: -45,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 12,
      },

      // --- Work ---
      {
        name: "Employment Offer Letter.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 30,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Work Agreement.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "NDA Contract.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 365 * 2,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Salary Slip Jan.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 60,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Salary Slip Feb.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 90,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Salary Slip Mar.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 120,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Salary Slip Apr.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 150,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Salary Slip May.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 180,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Experience Certificate.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 365 * 5,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Relieving Letter.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: 365 * 5,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Deprecated NDA.pdf",
        category: "Work",
        fileType: "pdf",
        expiryOffsetDays: -120,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 8,
      },

      // --- Finance ---
      {
        name: "Tax Return 2024.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 150,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Tax Return 2023.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: -200,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Tax Return 2022.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: -560,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Bank Statement Q1.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 45,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Bank Statement Q2.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 135,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Credit Card Statement.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 20,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Mortgage Statement.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Mutual Fund Portfolio.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 180,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Stock Portfolio 2025.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 240,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Dividend Income Report.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: 90,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Old Invoice 2021.pdf",
        category: "Finance",
        fileType: "pdf",
        expiryOffsetDays: -1000,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 20,
      },

      // --- Health ---
      {
        name: "Medical Checkup Report.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 180,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Blood Test Summary.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 90,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Vaccination Record.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 365 * 3,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Dental Prescription.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 120,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Eye Test Prescription.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Pet Vaccination Card.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 300,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Fitness Progress Log.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: 15,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Obsolete Prescription.pdf",
        category: "Health",
        fileType: "pdf",
        expiryOffsetDays: -60,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 18,
      },

      // --- Travel ---
      {
        name: "Schengen Visa.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 90,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "US Tourist Visa.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 365 * 8,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Flight Ticket - London.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 5,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Hotel Booking Voucher.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 8,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Travel Insurance Plan.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 12,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Pet Passport.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: 365 * 2,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Expired Visa 2019.pdf",
        category: "Travel",
        fileType: "pdf",
        expiryOffsetDays: -1500,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 1,
      },

      // --- Vehicle ---
      {
        name: "Car Registration Card.pdf",
        category: "Vehicle",
        fileType: "pdf",
        expiryOffsetDays: 365 * 5,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "PUC Pollution Certificate.pdf",
        category: "Vehicle",
        fileType: "pdf",
        expiryOffsetDays: 15,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Driving School Certificate.pdf",
        category: "Vehicle",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Car Maintenance Bill.pdf",
        category: "Vehicle",
        fileType: "pdf",
        expiryOffsetDays: -10,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Vehicle Fitness Certificate.pdf",
        category: "Vehicle",
        fileType: "pdf",
        expiryOffsetDays: 120,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Legal ---
      {
        name: "Power of Attorney.pdf",
        category: "Legal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 3,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Will & Testament.pdf",
        category: "Legal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 15,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Trust Deed.pdf",
        category: "Legal",
        fileType: "pdf",
        expiryOffsetDays: 365 * 20,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Partnership Agreement.pdf",
        category: "Legal",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Legal Notice.pdf",
        category: "Legal",
        fileType: "pdf",
        expiryOffsetDays: -25,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Property ---
      {
        name: "House Lease Deed.pdf",
        category: "Property",
        fileType: "pdf",
        expiryOffsetDays: 240,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Rent Agreement.pdf",
        category: "Property",
        fileType: "pdf",
        expiryOffsetDays: 180,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Property Tax Receipt.pdf",
        category: "Property",
        fileType: "pdf",
        expiryOffsetDays: 300,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Home Loan Statement.pdf",
        category: "Property",
        fileType: "pdf",
        expiryOffsetDays: 60,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Sale Deed Copy.pdf",
        category: "Property",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Utilities ---
      {
        name: "Electricity Bill Jan.pdf",
        category: "Utilities",
        fileType: "pdf",
        expiryOffsetDays: 12,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Water Connection Bill.pdf",
        category: "Utilities",
        fileType: "pdf",
        expiryOffsetDays: 25,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Internet Subscription.pdf",
        category: "Utilities",
        fileType: "pdf",
        expiryOffsetDays: 150,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Gas Pipeline Agreement.pdf",
        category: "Utilities",
        fileType: "pdf",
        baseExpiryDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Broadband Bill.pdf",
        category: "Utilities",
        fileType: "pdf",
        expiryOffsetDays: 22,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Education ---
      {
        name: "Degree Transcript.pdf",
        category: "Education",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Diploma Certificate.pdf",
        category: "Education",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "React Course Certificate.pdf",
        category: "Education",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "College ID Card.png",
        category: "Education",
        fileType: "image",
        expiryOffsetDays: 180,
        isFavorite: false,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Recommendation Letter.pdf",
        category: "Education",
        fileType: "pdf",
        expiryOffsetDays: 365 * 2,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Insurance ---
      {
        name: "Health Insurance Policy.pdf",
        category: "Insurance",
        fileType: "pdf",
        expiryOffsetDays: 250,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Life Insurance Policy.pdf",
        category: "Insurance",
        fileType: "pdf",
        expiryOffsetDays: 365 * 4,
        isFavorite: true,
        isDeleted: false,
      },
      {
        name: "Term Insurance Policy.pdf",
        category: "Insurance",
        fileType: "pdf",
        expiryOffsetDays: 365 * 10,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Vehicle Insurance Certificate.pdf",
        category: "Insurance",
        fileType: "pdf",
        expiryOffsetDays: 180,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Home Insurance Policy.pdf",
        category: "Insurance",
        fileType: "pdf",
        expiryOffsetDays: 300,
        isFavorite: false,
        isDeleted: false,
      },

      // --- Other ---
      {
        name: "Gym Membership Card.png",
        category: "Other",
        fileType: "image",
        expiryOffsetDays: 30,
        isFavorite: false,
        isDeleted: false,
        hasFile: true,
      },
      {
        name: "Library Membership.pdf",
        category: "Other",
        fileType: "pdf",
        expiryOffsetDays: 120,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Phone Warranty PDF.pdf",
        category: "Other",
        fileType: "pdf",
        expiryOffsetDays: 300,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Laptop Invoice.pdf",
        category: "Other",
        fileType: "pdf",
        expiryOffsetDays: 365,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "AC Maintenance Receipt.pdf",
        category: "Other",
        fileType: "pdf",
        expiryOffsetDays: -5,
        isFavorite: false,
        isDeleted: false,
      },
      {
        name: "Broken Charger Warranty.pdf",
        category: "Other",
        fileType: "pdf",
        expiryOffsetDays: -30,
        isFavorite: false,
        isDeleted: true,
        deletedOffsetDays: 25,
      },
    ];

    const sizes = ["1.2 MB", "2.4 MB", "850 KB", "1.8 MB", "3.2 MB", "550 KB"];
    const docsToAdd: ZentraDocument[] = [];

    for (let idx = 0; idx < templates.length; idx++) {
      const t = templates[idx];
      const id = `demo-${idx + 1}`;

      const expiry = new Date(now + (t.expiryOffsetDays ?? 365) * day)
        .toISOString()
        .split("T")[0];
      const created = new Date(now - (idx % 20) * day).toISOString();

      let localUri: string | undefined = undefined;

      // Generate physical mock file for all seeded documents
      if (attachmentsDir) {
        const extension = t.fileType === "image" ? "png" : "pdf";
        const fileName = `${id}_attachment.${extension}`;
        const destUri = `${attachmentsDir}${fileName}`;
        try {
          if (t.fileType === "image") {
            // Write base64 image data
            await FileSystem.writeAsStringAsync(destUri, DUMMY_PNG_BASE64, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } else {
            // Write basic text file
            await FileSystem.writeAsStringAsync(
              destUri,
              `Mock Zentra File: ${t.name}`,
            );
          }
          localUri = destUri;
        } catch (err) {
          console.warn(`Failed to seed file for ${t.name}:`, err);
        }
      }

      const doc: ZentraDocument = {
        id,
        name: t.name,
        category: t.category,
        fileType: t.fileType as ZentraDocument["fileType"],
        sizeLabel: sizes[idx % sizes.length],
        expiryDate: expiry,
        createdAt: created,
        updatedAt: created,
        notificationsEnabled: true,
        isFavorite: t.isFavorite,
        isDeleted: t.isDeleted,
        deletedAt:
          t.isDeleted && t.deletedOffsetDays
            ? new Date(now - t.deletedOffsetDays * day).toISOString()
            : undefined,
        localUri,
      };

      docsToAdd.push(doc);
    }

    console.log(
      `[Zentra Debug] Attempting to seed ${docsToAdd.length} documents into the store...`,
    );
    // Atomic seed action in the store
    useDocumentStore.getState().seedStore(docsToAdd, DEMO_FOLDERS);
    console.log("[Zentra Debug] Seeding successful!");
  } catch (error) {
    console.error("[Zentra Debug] Fatal error during seeding:", error);
  } finally {
    isSeeding = false;
  }
}
