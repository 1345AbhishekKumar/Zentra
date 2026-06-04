import { ZentraDocument } from "@/types";
import { saveFile, deleteFile } from "@/lib/fileStorage";

interface VaultStoreInstance {
  getState: () => {
    documents: ZentraDocument[];
    addDocumentState: (doc: ZentraDocument) => void;
    updateDocumentState: (id: string, updates: Partial<ZentraDocument>) => void;
    deleteDocumentState: (id: string) => void;
    deleteMultipleDocumentsState: (ids: string[]) => void;
    restoreDocumentState: (id: string) => void;
    purgeDocumentState: (id: string) => void;
    clearAllDataState: () => void;
  };
}

let storeInstance: VaultStoreInstance | null = null;

export const initializeVaultStore = (store: VaultStoreInstance) => {
  storeInstance = store;
};

const getStore = () => {
  if (!storeInstance) {
    throw new Error("[vaultManager] Store has not been initialized. Call initializeVaultStore(useDocumentStore) first.");
  }
  return storeInstance.getState();
};

export const vaultManager = {
  /**
   * Adds a new document to the vault.
   * - Copies any localUri to the app's secure sandboxed storage.
   * - Saves the metadata inside the Zustand store.
   * - Rollback: If store/AsyncStorage persistence fails, deletes the copied file.
   */
  async addDocument(doc: ZentraDocument): Promise<void> {
    let finalUri = doc.localUri;
    let copiedNewFile = false;

    if (doc.localUri) {
      const permanentUri = await saveFile(doc.localUri, doc.name);
      if (permanentUri) {
        finalUri = permanentUri;
        copiedNewFile = true;
      }
    }

    const docToSave = {
      ...doc,
      localUri: finalUri,
    };

    try {
      getStore().addDocumentState(docToSave);
    } catch (error) {
      if (copiedNewFile && finalUri) {
        await deleteFile(finalUri);
      }
      throw error;
    }
  },

  /**
   * Updates an existing document's metadata or attachment.
   * - Copies the new file if localUri changes, and purges the old one.
   * - Performs atomic state persistence.
   */
  async updateDocument(id: string, updates: Partial<ZentraDocument>): Promise<void> {
    const store = getStore();
    const existingDoc = store.documents.find((doc) => doc.id === id);
    if (!existingDoc) return;

    let updatedLocalUri = existingDoc.localUri;
    let copiedNewFile = false;

    if ("localUri" in updates) {
      if (updates.localUri && updates.localUri !== existingDoc.localUri) {
        const permanentUri = await saveFile(updates.localUri, updates.name || existingDoc.name);
        if (permanentUri) {
          updatedLocalUri = permanentUri;
          copiedNewFile = true;
        }
      } else if (!updates.localUri) {
        updatedLocalUri = undefined;
      }
    }

    try {
      // 1. Update the metadata in Zustand store
      store.updateDocumentState(id, {
        ...updates,
        localUri: updatedLocalUri,
      });

      // 2. If metadata saved successfully, delete the old file
      if (existingDoc.localUri && existingDoc.localUri !== updatedLocalUri) {
        await deleteFile(existingDoc.localUri);
      }
    } catch (error) {
      // Rollback newly copied file if store save fails
      if (copiedNewFile && updatedLocalUri) {
        await deleteFile(updatedLocalUri);
      }
      throw error;
    }
  },

  /**
   * Soft-deletes a document.
   */
  async deleteDocument(id: string): Promise<void> {
    getStore().deleteDocumentState(id);
  },

  /**
   * Soft-deletes multiple documents.
   */
  async deleteMultipleDocuments(ids: string[]): Promise<void> {
    getStore().deleteMultipleDocumentsState(ids);
  },

  /**
   * Restores a soft-deleted document.
   */
  async restoreDocument(id: string): Promise<void> {
    getStore().restoreDocumentState(id);
  },

  /**
   * Permanently deletes a document metadata and deletes its physical file from the device.
   */
  async permanentlyDeleteDocument(id: string): Promise<void> {
    const store = getStore();
    const doc = store.documents.find((d) => d.id === id);

    // 1. Remove metadata first
    store.purgeDocumentState(id);

    // 2. If it has a localUri, delete the physical file
    if (doc?.localUri) {
      await deleteFile(doc.localUri);
    }
  },

  /**
   * Scans the database and permanently deletes all soft-deleted documents
   * that were trashed more than 30 days ago.
   */
  async purgeExpiredTrash(): Promise<void> {
    const store = getStore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const toPurge = store.documents.filter(
      (doc) =>
        doc.isDeleted &&
        doc.deletedAt &&
        new Date(doc.deletedAt).getTime() < thirtyDaysAgo.getTime()
    );

    for (const doc of toPurge) {
      await this.permanentlyDeleteDocument(doc.id);
    }
  },

  /**
   * Clears all document data and permanently deletes all files from disk.
   */
  async clearAllData(): Promise<void> {
    const store = getStore();

    // Delete all document files on disk
    for (const doc of store.documents) {
      if (doc.localUri) {
        await deleteFile(doc.localUri);
      }
    }

    await store.clearAllDataState();
  }
};
