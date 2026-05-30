Read AGENTS.md first and follow it strictly.

## Task — Zustand Store + AsyncStorage Persistence

Create the global Zustand store for Zentra. This is the single source of truth for all document data. Everything persists to AsyncStorage — nothing leaves the device.

**Steps:**

1. Install `zustand` and `@react-native-async-storage/async-storage` if not already installed.

2. Create `store/documentStore.ts` with the following state shape and actions:

```ts
interface DocumentStore {
  // State
  documents: ZentraDocument[];
  notificationSettings: NotificationSettings;
  user: LocalUser | null;

  // Derived (computed from documents)
  upcomingExpirations: ZentraDocument[]; // docs expiring within 90 days, sorted by soonest

  // Actions
  setUser: (user: LocalUser | null) => void;
  addDocument: (doc: ZentraDocument) => void;
  updateDocument: (id: string, updates: Partial<ZentraDocument>) => void;
  deleteDocument: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleNotification: (id: string) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  recomputeUpcoming: () => void; // recomputes upcomingExpirations from documents[]
}
```

3. Use Zustand's `persist` middleware with `AsyncStorage` as the storage adapter. Persist the full store.

4. `upcomingExpirations` must always be sorted by expiry date ascending (soonest first). Call `recomputeUpcoming()` inside `addDocument`, `updateDocument`, and `deleteDocument` to keep it in sync.

5. Default `notificationSettings`:
   - `globalEnabled: true`
   - `advanceNoticeDays: [7, 30, 90]`

6. The `user` field stores only `clerkId`, `displayName`, and `email` — no document data is ever stored in the user object.

7. Export the store as `useDocumentStore`.

Import types only from `types/`. Do not import from `lib/` — those files do not exist yet.
Do not create any screens or components.
Do not touch `app/`, `constants/`, or auth files from feature3.
Do not add any cloud sync, API calls, or external services.
The store must compile with strict TypeScript — no `any`.

### Check when done
- `store/documentStore.ts` exists and exports `useDocumentStore`
- Calling `addDocument` and restarting the app preserves the document (AsyncStorage persistence works)
- `upcomingExpirations` is always a subset of `documents[]` sorted by expiry date
- `npx tsc --noEmit` passes with no errors