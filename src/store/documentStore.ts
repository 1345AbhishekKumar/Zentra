import { filterUpcoming, sortByExpiry } from "@/lib/date";
import { syncAllNotifications } from "@/lib/notifications";
import { initializeVaultStore } from "@/lib/vaultManager";
import { LocalUser, NotificationSettings, ZentraDocument } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_FOLDERS: string[] = ["Personal", "Work", "Finance", "Health", "Other"];

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

  // State mutations (used by vaultManager)
  addDocumentState: (doc: ZentraDocument) => void;
  updateDocumentState: (id: string, updates: Partial<ZentraDocument>) => void;
  deleteDocumentState: (id: string) => void;
  deleteMultipleDocumentsState: (ids: string[]) => void;
  restoreDocumentState: (id: string) => void;
  purgeDocumentState: (id: string) => void;
  clearAllDataState: () => void;
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
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.addDocument(doc);
      },

      updateDocument: async (id, updates) => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.updateDocument(id, updates);
      },

      deleteDocument: async (id) => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.deleteDocument(id);
      },

      deleteMultipleDocuments: async (ids) => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.deleteMultipleDocuments(ids);
      },

      restoreDocument: async (id) => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.restoreDocument(id);
      },

      permanentlyDeleteDocument: async (id) => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.permanentlyDeleteDocument(id);
      },

      purgeExpiredTrash: async () => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.purgeExpiredTrash();
      },

      toggleFavorite: (id) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  isFavorite: !doc.isFavorite,
                  updatedAt: new Date().toISOString(),
                }
              : doc
          ),
        }));
      },

      toggleNotification: async (id) => {
        try {
          const { documents } = get();
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
              : d
          );

          set({
            documents: updatedDocs,
          });
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
      },

      recomputeUpcoming: () => {
        set((state) => ({
          upcomingExpirations: computeUpcoming(state.documents),
        }));
      },

      clearAllData: async () => {
        const { vaultManager } = await import("@/lib/vaultManager");
        await vaultManager.clearAllData();
      },

      // State mutations (used by vaultManager to modify the store state purely in-memory)
      addDocumentState: (doc) => {
        set((state) => ({
          documents: [...state.documents, doc],
        }));
      },

      updateDocumentState: (id, updates) => {
        const { documents, readAlerts = [] } = get();
        const existingDoc = documents.find((doc) => doc.id === id);
        if (!existingDoc) return;

        const updatedAt = new Date().toISOString();
        const updatedDocs = documents.map((doc) => {
          if (doc.id !== id) return doc;
          return { ...doc, ...updates, updatedAt };
        });

        const expiryDateChanged = updates.expiryDate && updates.expiryDate !== existingDoc.expiryDate;
        const updatedReadAlerts = expiryDateChanged
          ? readAlerts.filter((alertId) => alertId !== id)
          : readAlerts;

        set({
          documents: updatedDocs,
          readAlerts: updatedReadAlerts,
        });
      },

      deleteDocumentState: (id) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            doc.id === id
              ? {
                  ...doc,
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : doc
          ),
        }));
      },

      deleteMultipleDocumentsState: (ids) => {
        set((state) => ({
          documents: state.documents.map((doc) =>
            ids.includes(doc.id)
              ? {
                  ...doc,
                  isDeleted: true,
                  deletedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : doc
          ),
        }));
      },

      restoreDocumentState: (id) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isDeleted: false,
                  deletedAt: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : d
          ),
        }));
      },

      purgeDocumentState: (id) => {
        set((state) => {
          const updatedDocs = state.documents.filter((d) => d.id !== id);
          const readAlerts = state.readAlerts || [];
          return {
            documents: updatedDocs,
            readAlerts: readAlerts.filter((alertId) => alertId !== id),
          };
        });
      },

      clearAllDataState: () => {
        set({
          documents: [],
          folders: [...DEFAULT_FOLDERS],
          readAlerts: [],
        });
      },


      seedStore: async (seededDocs, seededFolders) => {
        try {
          console.log(`[Zentra Debug] seedStore action called with ${seededDocs.length} docs`);
          set((state) => {
            const updatedFolders = [...state.folders];
            seededFolders.forEach((f) => {
              const trimmed = f.trim();
              if (trimmed && !updatedFolders.some((folder) => folder.toLowerCase() === trimmed.toLowerCase())) {
                updatedFolders.push(trimmed);
              }
            });

            const nonDemoDocs = state.documents.filter((d) => !d.id.startsWith("demo-"));
            const updatedDocs = [...nonDemoDocs, ...seededDocs];
            const updatedReadAlerts = (state.readAlerts || []).filter((id) => !id.startsWith("demo-"));

            console.log(`[Zentra Debug] Merged docs. Previous total: ${state.documents.length}, Non-demo: ${nonDemoDocs.length}, New total: ${updatedDocs.length}`);

            return {
              folders: updatedFolders,
              documents: updatedDocs,
              readAlerts: updatedReadAlerts,
            };
          });
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
              f.toLowerCase() !== oldName.toLowerCase()
          )
        ) {
          return false;
        }
        const updatedFolders = folders.map((f) =>
          f.toLowerCase() === oldName.toLowerCase() ? trimmedNew : f
        );
        const updatedDocs = documents.map((doc) =>
          doc.category.toLowerCase() === oldName.toLowerCase()
            ? { ...doc, category: trimmedNew, updatedAt: new Date().toISOString() }
            : doc
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
          (f) => f.toLowerCase() !== name.toLowerCase()
        );
        const otherExists = updatedFolders.some(
          (f) => f.toLowerCase() === "other"
        );
        if (!otherExists) {
          updatedFolders.push("Other");
        }
        const updatedDocs = documents.map((doc) =>
          doc.category.toLowerCase() === name.toLowerCase()
            ? { ...doc, category: "Other", updatedAt: new Date().toISOString() }
            : doc
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
          (f) => !lowercaseNames.includes(f.toLowerCase())
        );
        const otherExists = updatedFolders.some(
          (f) => f.toLowerCase() === "other"
        );
        if (!otherExists) {
          updatedFolders.push("Other");
        }
        const updatedDocs = documents.map((doc) =>
          lowercaseNames.includes(doc.category.toLowerCase())
            ? { ...doc, category: "Other", updatedAt: new Date().toISOString() }
            : doc
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
              if (!state.folders || state.folders.length === 0) {
                useDocumentStore.setState({ folders: [...DEFAULT_FOLDERS] });
              }
              if (!state.readAlerts) {
                useDocumentStore.setState({ readAlerts: [] });
              }
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
    }
  )
);

// Auto-compute upcoming expirations and auto-sync notifications on store changes
useDocumentStore.subscribe((state, prevState) => {
  // If documents changed, recompute upcoming
  if (state.documents !== prevState.documents) {
    const nextUpcoming = computeUpcoming(state.documents);
    if (JSON.stringify(state.upcomingExpirations) !== JSON.stringify(nextUpcoming)) {
      useDocumentStore.setState({
        upcomingExpirations: nextUpcoming,
      });
    }
  }

    // If documents, settings, or hydration state changed, sync notifications
    if (
      state._hasHydrated &&
      (state.documents !== prevState.documents ||
        state.notificationSettings !== prevState.notificationSettings ||
        !prevState._hasHydrated)
    ) {
      void syncAllNotifications(state.documents, state.notificationSettings);
    }
});

// Statically initialize the vault manager store reference to completely bypass circular dependencies
initializeVaultStore(useDocumentStore);
