import { filterUpcoming, sortByExpiry } from "@/lib/date";
import { syncAllNotifications } from "@/lib/notifications";
import { saveFilePermanently } from "@/lib/share";
import { LocalUser, NotificationSettings, ZentraDocument } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_FOLDERS: string[] = ["Personal", "Work", "Finance", "Health", "Other"];

interface DocumentStore {
  // State
  documents: ZentraDocument[];
  folders: string[];
  notificationSettings: NotificationSettings;
  user: LocalUser | null;
  upcomingExpirations: ZentraDocument[];
  _hasHydrated: boolean;
  readAlerts: string[];

  // Actions
  setUser: (user: LocalUser | null) => void;
  setHasHydrated: (state: boolean) => void;
  addDocument: (doc: ZentraDocument) => Promise<void>;
  updateDocument: (id: string, updates: Partial<ZentraDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  deleteMultipleDocuments: (ids: string[]) => Promise<void>;
  restoreDocument: (id: string) => Promise<void>;
  permanentlyDeleteDocument: (id: string) => Promise<void>;
  purgeExpiredTrash: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  toggleNotification: (id: string) => Promise<void>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  recomputeUpcoming: () => void;
  clearAllData: () => Promise<void>;
  seedStore: (documents: ZentraDocument[], folders: string[]) => Promise<void>;
  addFolder: (name: string) => boolean;
  renameFolder: (oldName: string, newName: string) => boolean;
  deleteFolder: (name: string) => void;
  deleteMultipleFolders: (names: string[]) => void;
  markAlertAsRead: (id: string) => void;
  markAllAlertsAsRead: (ids: string[]) => void;
}

const computeUpcoming = (documents: ZentraDocument[]): ZentraDocument[] => {
  const activeDocs = documents.filter((doc) => !doc.isDeleted);
  return sortByExpiry(filterUpcoming(activeDocs, 90));
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      // State
      documents: [],
      folders: [...DEFAULT_FOLDERS],
      notificationSettings: {
        globalEnabled: true,
        advanceNoticeDays: [7, 30, 90],
        customNoticeDays: [],
        reminderTime: "09:00",
      },
      user: null,
      upcomingExpirations: [],
      _hasHydrated: false,
      readAlerts: [],

      // Actions
      setUser: (user) => set({ user }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      markAlertAsRead: (id) => {
        set((state) => {
          const readAlerts = state.readAlerts || [];
          if (readAlerts.includes(id)) return {};
          return { readAlerts: [...readAlerts, id] };
        });
      },

      markAllAlertsAsRead: (ids) => {
        set((state) => {
          const readAlerts = state.readAlerts || [];
          const newReadAlerts = Array.from(new Set([...readAlerts, ...ids]));
          return { readAlerts: newReadAlerts };
        });
      },

      addDocument: async (doc) => {
        try {
          // 1. Save file permanently if there is an attachment
          if (doc.localUri) {
            const permanentUri = await saveFilePermanently(doc.localUri, doc.name);
            if (permanentUri) {
              doc.localUri = permanentUri;
            }
          }

          set((state) => {
            const updatedDocs = [...state.documents, doc];
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
            };
          });

          // 2. Sync all notifications
          const { documents, notificationSettings } = get();
          await syncAllNotifications(documents, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to add document:", error);
        }
      },

      updateDocument: async (id, updates) => {
        try {
          const { documents, notificationSettings, readAlerts = [] } = get();
          const existingDoc = documents.find((doc) => doc.id === id);
          if (!existingDoc) return;

          // 1. Manage file attachments if they changed
          let updatedLocalUri = existingDoc.localUri;
          if ("localUri" in updates) {
            if (updates.localUri && updates.localUri !== existingDoc.localUri) {
              const permanentUri = await saveFilePermanently(updates.localUri, updates.name || existingDoc.name);
              if (permanentUri) {
                updatedLocalUri = permanentUri;
              }
            } else if (!updates.localUri) {
              updatedLocalUri = undefined;
            }
          }

          // Clean up old file if it was replaced or removed
          if (existingDoc.localUri && existingDoc.localUri !== updatedLocalUri) {
            try {
              const FileSystem = await import("expo-file-system/legacy");
              const permanentDirectory = FileSystem.documentDirectory;
              if (permanentDirectory && existingDoc.localUri.startsWith(permanentDirectory)) {
                await FileSystem.deleteAsync(existingDoc.localUri, { idempotent: true });
                console.log("[DocumentStore] Deleted old permanent file:", existingDoc.localUri);
              }
            } catch (e) {
              console.warn("Failed to delete old local file:", e);
            }
          }

          const updatedAt = new Date().toISOString();
          let updatedDoc: ZentraDocument | undefined;

          const updatedDocs = documents.map((doc) => {
            if (doc.id !== id) return doc;
            updatedDoc = { ...doc, ...updates, localUri: updatedLocalUri, updatedAt };
            return updatedDoc;
          });

          const expiryDateChanged = updates.expiryDate && updates.expiryDate !== existingDoc.expiryDate;
          const updatedReadAlerts = expiryDateChanged
            ? readAlerts.filter((alertId) => alertId !== id)
            : readAlerts;

          set({
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
            readAlerts: updatedReadAlerts,
          });

          // 2. Sync all notifications
          await syncAllNotifications(updatedDocs, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to update document:", error);
        }
      },

      deleteDocument: async (id) => {
        try {
          set((state) => {
            const updatedDocs = state.documents.map((doc) =>
              doc.id === id
                ? {
                    ...doc,
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : doc
            );
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
            };
          });

          // Sync all notifications
          const { documents, notificationSettings } = get();
          await syncAllNotifications(documents, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to delete document:", error);
        }
      },

      deleteMultipleDocuments: async (ids) => {
        try {
          set((state) => {
            const updatedDocs = state.documents.map((doc) =>
              ids.includes(doc.id)
                ? {
                    ...doc,
                    isDeleted: true,
                    deletedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                : doc
            );
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
            };
          });

          // Sync all notifications
          const { documents, notificationSettings } = get();
          await syncAllNotifications(documents, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to delete multiple documents:", error);
        }
      },

      restoreDocument: async (id) => {
        try {
          const { documents, notificationSettings } = get();
          const doc = documents.find((d) => d.id === id);
          if (!doc) return;

          const updatedDocs = documents.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isDeleted: false,
                  deletedAt: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : d
          );

          set({
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          });

          // Sync all notifications
          await syncAllNotifications(updatedDocs, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to restore document:", error);
        }
      },

      permanentlyDeleteDocument: async (id) => {
        try {
          const doc = get().documents.find((d) => d.id === id);
          if (doc) {
            // Delete file
            if (doc.localUri) {
              try {
                const FileSystem = await import("expo-file-system/legacy");
                const permanentDirectory = FileSystem.documentDirectory;
                if (permanentDirectory && doc.localUri && doc.localUri.startsWith(permanentDirectory)) {
                  await FileSystem.deleteAsync(doc.localUri, { idempotent: true });
                }
              } catch (err) {
                console.warn("Failed to delete file for permanently deleted document:", err);
              }
            }
          }
          set((state) => {
            const updatedDocs = state.documents.filter((d) => d.id !== id);
            const readAlerts = state.readAlerts || [];
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
              readAlerts: readAlerts.filter((alertId) => alertId !== id),
            };
          });

          // Sync all notifications
          const { documents, notificationSettings } = get();
          await syncAllNotifications(documents, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to permanently delete document:", error);
        }
      },

      purgeExpiredTrash: async () => {
        try {
          const { documents } = get();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const toPurge = documents.filter(
            (doc) =>
              doc.isDeleted &&
              doc.deletedAt &&
              new Date(doc.deletedAt).getTime() < thirtyDaysAgo.getTime()
          );

          if (toPurge.length === 0) return;

          // Perform file deletions
          for (const doc of toPurge) {
            if (doc.localUri) {
              try {
                const FileSystem = await import("expo-file-system/legacy");
                const permanentDirectory = FileSystem.documentDirectory;
                if (permanentDirectory && doc.localUri.startsWith(permanentDirectory)) {
                  await FileSystem.deleteAsync(doc.localUri, { idempotent: true });
                }
              } catch (e) {
                console.warn("Failed to delete file for purged doc:", e);
              }
            }
          }

          const purgeIds = toPurge.map((d) => d.id);
          let updatedDocs: ZentraDocument[] = [];
          set((state) => {
            updatedDocs = state.documents.filter((d) => !purgeIds.includes(d.id));
            const readAlerts = state.readAlerts || [];
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
              readAlerts: readAlerts.filter((alertId) => !purgeIds.includes(alertId)),
            };
          });

          // Sync all notifications
          const { notificationSettings } = get();
          await syncAllNotifications(updatedDocs, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to purge expired trash:", error);
        }
      },

      toggleFavorite: (id) => {
        set((state) => {
          const updatedDocs = state.documents.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  isFavorite: !doc.isFavorite,
                  updatedAt: new Date().toISOString(),
                }
              : doc,
          );
          return {
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          };
        });
      },

      toggleNotification: async (id) => {
        try {
          const { documents, notificationSettings } = get();
          const doc = documents.find((d) => d.id === id);
          if (!doc) return;

          const updatedNotificationsEnabled = !doc.notificationsEnabled;
          const updatedAt = new Date().toISOString();

          const updatedDocs = documents.map((d) =>
            d.id === id
              ? {
                  ...d,
                  notificationsEnabled: updatedNotificationsEnabled,
                  updatedAt,
                }
              : d,
          );

          set({
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          });

          // Sync all notifications
          await syncAllNotifications(updatedDocs, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to toggle notification:", error);
        }
      },

      updateNotificationSettings: async (settings) => {
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        }));

        // Sync all notifications
        const { documents, notificationSettings } = get();
        await syncAllNotifications(documents, notificationSettings);
      },

      recomputeUpcoming: () => {
        set((state) => ({
          upcomingExpirations: computeUpcoming(state.documents),
        }));
      },
      clearAllData: async () => {
        set({
          documents: [],
          upcomingExpirations: [],
          folders: [...DEFAULT_FOLDERS],
          readAlerts: [],
        });
        const { cancelAllNotifications } = await import("@/lib/notifications");
        await cancelAllNotifications();
      },

      seedStore: async (seededDocs, seededFolders) => {
        try {
          console.log(`[Zentra Debug] seedStore action called with ${seededDocs.length} docs`);
          set((state) => {
            // 1. Merge folders
            const updatedFolders = [...state.folders];
            seededFolders.forEach((f) => {
              const trimmed = f.trim();
              if (trimmed && !updatedFolders.some((folder) => folder.toLowerCase() === trimmed.toLowerCase())) {
                updatedFolders.push(trimmed);
              }
            });

            // 2. Filter out any existing demo documents to avoid duplicates or stale soft-deleted states
            const nonDemoDocs = state.documents.filter((d) => !d.id.startsWith("demo-"));

            // 3. Combine non-demo documents with new seeded documents
            const updatedDocs = [...nonDemoDocs, ...seededDocs];

            // 4. Clean up any read alert history for demo documents to reset alert triggers
            const updatedReadAlerts = (state.readAlerts || []).filter((id) => !id.startsWith("demo-"));

            console.log(`[Zentra Debug] Merged docs. Previous total: ${state.documents.length}, Non-demo: ${nonDemoDocs.length}, New total: ${updatedDocs.length}`);

            return {
              folders: updatedFolders,
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
              readAlerts: updatedReadAlerts,
            };
          });

          // Sync all notifications
          const { documents, notificationSettings } = get();
          await syncAllNotifications(documents, notificationSettings);
        } catch (error) {
          console.error("[DocumentStore] Failed to seed store:", error);
        }
      },

      addFolder: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const { folders } = get();
        if (folders.some((f) => f.toLowerCase() === trimmed.toLowerCase())) {
          return false;
        }
        set({ folders: [...folders, trimmed] });
        return true;
      },

      renameFolder: (oldName, newName) => {
        const trimmedNew = newName.trim();
        if (!trimmedNew || oldName === trimmedNew) return false;
        const { folders, documents } = get();
        if (
          folders.some(
            (f) =>
              f.toLowerCase() === trimmedNew.toLowerCase() &&
              f.toLowerCase() !== oldName.toLowerCase(),
          )
        ) {
          return false;
        }
        const updatedFolders = folders.map((f) =>
          f.toLowerCase() === oldName.toLowerCase() ? trimmedNew : f,
        );
        const updatedDocs = documents.map((doc) =>
          doc.category.toLowerCase() === oldName.toLowerCase()
            ? { ...doc, category: trimmedNew, updatedAt: new Date().toISOString() }
            : doc,
        );
        set({
          folders: updatedFolders,
          documents: updatedDocs,
        });
        return true;
      },

      deleteFolder: (name) => {
        const { folders, documents } = get();
        const updatedFolders = folders.filter(
          (f) => f.toLowerCase() !== name.toLowerCase(),
        );
        // Ensure "Other" exists
        const otherExists = updatedFolders.some(
          (f) => f.toLowerCase() === "other",
        );
        if (!otherExists) {
          updatedFolders.push("Other");
        }
        const updatedDocs = documents.map((doc) =>
          doc.category.toLowerCase() === name.toLowerCase()
            ? { ...doc, category: "Other", updatedAt: new Date().toISOString() }
            : doc,
        );
        set({
          folders: updatedFolders,
          documents: updatedDocs,
        });
      },

      deleteMultipleFolders: (names) => {
        const lowercaseNames = names.map((n) => n.toLowerCase());
        const { folders, documents } = get();
        const updatedFolders = folders.filter(
          (f) => !lowercaseNames.includes(f.toLowerCase()),
        );
        // Ensure "Other" exists
        const otherExists = updatedFolders.some(
          (f) => f.toLowerCase() === "other",
        );
        if (!otherExists) {
          updatedFolders.push("Other");
        }
        const updatedDocs = documents.map((doc) =>
          lowercaseNames.includes(doc.category.toLowerCase())
            ? { ...doc, category: "Other", updatedAt: new Date().toISOString() }
            : doc,
        );
        set({
          folders: updatedFolders,
          documents: updatedDocs,
        });
      },
    }),
    {
      name: "zentra-document-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        documents: state.documents,
        folders: state.folders,
        notificationSettings: state.notificationSettings,
        user: state.user,
        readAlerts: state.readAlerts,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
            if (!error) {
              state.recomputeUpcoming();
              // Ensure folders is initialized
              if (!state.folders || state.folders.length === 0) {
                useDocumentStore.setState({ folders: [...DEFAULT_FOLDERS] });
              }
              // Ensure readAlerts is initialized
              if (!state.readAlerts) {
                useDocumentStore.setState({ readAlerts: [] });
              }
              // Ensure notificationSettings has customNoticeDays and reminderTime initialized
              if (state.notificationSettings) {
                const ns = state.notificationSettings;
                if (!ns.customNoticeDays || !ns.reminderTime) {
                  useDocumentStore.setState({
                    notificationSettings: {
                      globalEnabled: ns.globalEnabled ?? true,
                      advanceNoticeDays: ns.advanceNoticeDays ?? [7, 30, 90],
                      customNoticeDays: ns.customNoticeDays ?? [],
                      reminderTime: ns.reminderTime ?? "09:00",
                    },
                  });
                }
              }

              // Sync all notifications on hydration
              void syncAllNotifications(
                useDocumentStore.getState().documents,
                useDocumentStore.getState().notificationSettings
              );
            }
            state.setHasHydrated(true);
          }
        };
      },
    },
  ),
);
