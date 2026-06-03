import { filterUpcoming, sortByExpiry } from "@/lib/date";
import {
  cancelDocumentNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
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
  addDocument: (doc: ZentraDocument) => void;
  updateDocument: (id: string, updates: Partial<ZentraDocument>) => void;
  deleteDocument: (id: string) => void;
  deleteMultipleDocuments: (ids: string[]) => void;
  restoreDocument: (id: string) => void;
  permanentlyDeleteDocument: (id: string) => void;
  purgeExpiredTrash: () => void;
  toggleFavorite: (id: string) => void;
  toggleNotification: (id: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  recomputeUpcoming: () => void;
  clearAllData: () => void;
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

      addDocument: (doc) => {
        try {
          set((state) => {
            const updatedDocs = [...state.documents, doc];
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
            };
          });
        } catch (error) {
          console.error("[DocumentStore] Failed to add document:", error);
        }
      },

      updateDocument: (id, updates) => {
        try {
          const { documents, notificationSettings, readAlerts = [] } = get();
          const existingDoc = documents.find((doc) => doc.id === id);
          const updatedAt = new Date().toISOString();
          let updatedDoc: ZentraDocument | undefined;

          const updatedDocs = documents.map((doc) => {
            if (doc.id !== id) return doc;
            updatedDoc = { ...doc, ...updates, updatedAt };
            return updatedDoc;
          });

          const expiryDateChanged = existingDoc && updates.expiryDate && updates.expiryDate !== existingDoc.expiryDate;
          const updatedReadAlerts = expiryDateChanged
            ? readAlerts.filter((alertId) => alertId !== id)
            : readAlerts;

          set({
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
            readAlerts: updatedReadAlerts,
          });

          if (
            expiryDateChanged &&
            (updatedDoc?.notificationsEnabled ??
              existingDoc.notificationsEnabled) &&
            notificationSettings.globalEnabled
          ) {
            void (async () => {
              await cancelDocumentNotifications(existingDoc.id);
              if (updatedDoc) {
                await scheduleDocumentNotifications(
                  updatedDoc,
                  notificationSettings.advanceNoticeDays,
                  notificationSettings.reminderTime || "09:00",
                );
              }
            })();
          }
        } catch (error) {
          console.error("[DocumentStore] Failed to update document:", error);
        }
      },

      deleteDocument: (id) => {
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
        } catch (error) {
          console.error("[DocumentStore] Failed to delete document:", error);
        }
      },

      deleteMultipleDocuments: (ids) => {
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
        } catch (error) {
          console.error("[DocumentStore] Failed to delete multiple documents:", error);
        }
      },

      restoreDocument: (id) => {
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

          // Reschedule notifications if notificationsEnabled was true
          if (doc.notificationsEnabled && notificationSettings.globalEnabled) {
            void (async () => {
              try {
                const updatedDoc = get().documents.find((d) => d.id === id);
                if (updatedDoc) {
                  await scheduleDocumentNotifications(
                    updatedDoc,
                    notificationSettings.advanceNoticeDays,
                    notificationSettings.reminderTime || "09:00",
                  );
                }
              } catch (err) {
                console.error("Failed to reschedule notifications on restore:", err);
              }
            })();
          }
        } catch (error) {
          console.error("[DocumentStore] Failed to restore document:", error);
        }
      },

      permanentlyDeleteDocument: (id) => {
        try {
          const doc = get().documents.find((d) => d.id === id);
          if (doc) {
            // 1. Cancel notifications
            void cancelDocumentNotifications(id);
            // 2. Delete file
            if (doc.localUri) {
              void (async () => {
                try {
                  const FileSystem = await import("expo-file-system/legacy");
                  const permanentDirectory = FileSystem.documentDirectory;
                  if (permanentDirectory && doc.localUri && doc.localUri.startsWith(permanentDirectory)) {
                    await FileSystem.deleteAsync(doc.localUri, { idempotent: true });
                  }
                } catch (err) {
                  console.warn("Failed to delete file for permanently deleted document:", err);
                }
              })();
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
        } catch (error) {
          console.error("[DocumentStore] Failed to permanently delete document:", error);
        }
      },

      purgeExpiredTrash: () => {
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

          // Perform purge asynchronously
          void (async () => {
            for (const doc of toPurge) {
              // Cancel notifications
              try {
                await cancelDocumentNotifications(doc.id);
              } catch (e) {
                console.warn("Failed to cancel notifications for purged doc:", e);
              }

              // Delete file
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
          })();

          const purgeIds = toPurge.map((d) => d.id);
          set((state) => {
            const updatedDocs = state.documents.filter((d) => !purgeIds.includes(d.id));
            const readAlerts = state.readAlerts || [];
            return {
              documents: updatedDocs,
              upcomingExpirations: computeUpcoming(updatedDocs),
              readAlerts: readAlerts.filter((alertId) => !purgeIds.includes(alertId)),
            };
          });
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

      toggleNotification: (id) => {
        set((state) => {
          const updatedDocs = state.documents.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  notificationsEnabled: !doc.notificationsEnabled,
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

      updateNotificationSettings: (settings) => {
        set((state) => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        }));
      },

      recomputeUpcoming: () => {
        set((state) => ({
          upcomingExpirations: computeUpcoming(state.documents),
        }));
      },
      clearAllData: () => {
        set({
          documents: [],
          upcomingExpirations: [],
          folders: [...DEFAULT_FOLDERS],
          readAlerts: [],
        });
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
            }
            state.setHasHydrated(true);
          }
        };
      },
    },
  ),
);
