import { useDocumentStore } from "@/store/documentStore";
import { ZentraDocument } from "@/types";
import * as FileSystem from "expo-file-system/legacy";
import { DUMMY_PNG_BASE64, DEMO_FOLDERS, MOCK_TEMPLATES } from "./seed/mockData";

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

    const sizes = ["1.2 MB", "2.4 MB", "850 KB", "1.8 MB", "3.2 MB", "550 KB"];
    const docsToAdd: ZentraDocument[] = [];

    for (let idx = 0; idx < MOCK_TEMPLATES.length; idx++) {
      const t = MOCK_TEMPLATES[idx];
      const id = `demo-${idx + 1}`;

      const expiryOffset = t.expiryOffsetDays ?? t.baseExpiryDays ?? 365;
      const expiry = new Date(now + expiryOffset * day)
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
