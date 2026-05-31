import { filterUpcoming, sortByExpiry } from "@/lib/date";
import {
  cancelDocumentNotifications,
  scheduleDocumentNotifications,
} from "@/lib/notifications";
import { LocalUser, NotificationSettings, ZentraDocument } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface DocumentStore {
  // State
  documents: ZentraDocument[];
  notificationSettings: NotificationSettings;
  user: LocalUser | null;
  upcomingExpirations: ZentraDocument[];
  _hasHydrated: boolean;

  // Actions
  setUser: (user: LocalUser | null) => void;
  setHasHydrated: (state: boolean) => void;
  addDocument: (doc: ZentraDocument) => void;
  updateDocument: (id: string, updates: Partial<ZentraDocument>) => void;
  deleteDocument: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleNotification: (id: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  recomputeUpcoming: () => void;
  clearAllData: () => void;
}

const computeUpcoming = (documents: ZentraDocument[]): ZentraDocument[] => {
  return sortByExpiry(filterUpcoming(documents, 90));
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      // State
      documents: [],
      notificationSettings: {
        globalEnabled: true,
        advanceNoticeDays: [7, 30, 90],
      },
      user: null,
      upcomingExpirations: [],
      _hasHydrated: false,

      // Actions
      setUser: (user) => set({ user }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addDocument: (doc) => {
        set((state) => {
          const updatedDocs = [...state.documents, doc];
          return {
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          };
        });
      },

      updateDocument: (id, updates) => {
        const { documents, notificationSettings } = get();
        const existingDoc = documents.find((doc) => doc.id === id);
        const updatedAt = new Date().toISOString();
        let updatedDoc: ZentraDocument | undefined;

        const updatedDocs = documents.map((doc) => {
          if (doc.id !== id) return doc;
          updatedDoc = { ...doc, ...updates, updatedAt };
          return updatedDoc;
        });

        set({
          documents: updatedDocs,
          upcomingExpirations: computeUpcoming(updatedDocs),
        });

        if (
          existingDoc &&
          updates.expiryDate &&
          updates.expiryDate !== existingDoc.expiryDate &&
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
              );
            }
          })();
        }
      },

      deleteDocument: (id) => {
        set((state) => {
          const updatedDocs = state.documents.filter((doc) => doc.id !== id);
          return {
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          };
        });
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
        set({ documents: [], upcomingExpirations: [] });
      },
    }),
    {
      name: "zentra-document-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        documents: state.documents,
        notificationSettings: state.notificationSettings,
        user: state.user,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
            if (!error) {
              state.recomputeUpcoming();
            }
            state.setHasHydrated(true);
          }
        };
      },
    },
  ),
);
