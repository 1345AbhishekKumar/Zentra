import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ZentraDocument, NotificationSettings, LocalUser } from "@/types";

interface DocumentStore {
  // State
  documents: ZentraDocument[];
  notificationSettings: NotificationSettings;
  user: LocalUser | null;
  upcomingExpirations: ZentraDocument[];

  // Actions
  setUser: (user: LocalUser | null) => void;
  addDocument: (doc: ZentraDocument) => void;
  updateDocument: (id: string, updates: Partial<ZentraDocument>) => void;
  deleteDocument: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleNotification: (id: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  recomputeUpcoming: () => void;
}

const getTodayMidnight = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day, 0, 0, 0, 0);
};

const getDaysUntilExpiry = (expiryDateStr: string): number => {
  const expiryDate = parseLocalDate(expiryDateStr);
  if (!expiryDate) return -9999;
  const today = getTodayMidnight();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const computeUpcoming = (documents: ZentraDocument[]): ZentraDocument[] => {
  return documents
    .filter((doc) => {
      const days = getDaysUntilExpiry(doc.expiryDate);
      return days >= 0 && days <= 90;
    })
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
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

      // Actions
      setUser: (user) => set({ user }),

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
        set((state) => {
          const updatedDocs = state.documents.map((doc) =>
            doc.id === id
              ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
              : doc
          );
          return {
            documents: updatedDocs,
            upcomingExpirations: computeUpcoming(updatedDocs),
          };
        });
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
              : doc
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
              : doc
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
    }),
    {
      name: "zentra-document-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state && !error) {
            state.recomputeUpcoming();
          }
        };
      },
    }
  )
);
