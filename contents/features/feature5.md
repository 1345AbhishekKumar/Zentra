Read AGENTS.md first and follow it strictly.

## Task — TypeScript Types

Define all shared TypeScript interfaces and types for Zentra. Every other feature depends on these types being stable and correct.

Create the following files in `types/`:

---

**`types/document.ts`**

```ts
export type DocumentCategory = "Personal" | "Work" | "Finance" | "Health" | "Other";

export type DocumentFileType = "pdf" | "image" | "doc" | "other";

export interface ZentraDocument {
  id: string;                        // UUID generated at creation time
  name: string;                      // e.g. "Passport.pdf"
  category: DocumentCategory;
  fileType: DocumentFileType;
  expiryDate: string;                // ISO 8601 date string, e.g. "2025-05-10"
  createdAt: string;                 // ISO 8601 datetime string
  updatedAt: string;                 // ISO 8601 datetime string
  sizeLabel?: string;                // e.g. "2.4 MB" — display only, not computed
  notificationsEnabled: boolean;
  isFavorite: boolean;
  notes?: string;
  localUri?: string;                 // on-device file URI — never sent off-device
}
```

---

**`types/notification.ts`**

```ts
export interface NotificationSettings {
  globalEnabled: boolean;
  advanceNoticeDays: number[];       // e.g. [7, 30, 90] — how many days before expiry to notify
}
```

---

**`types/user.ts`**

```ts
export interface LocalUser {
  clerkId: string;                   // Clerk user ID — used only as local identifier
  displayName: string;
  email: string;
}
```

---

**`types/index.ts`**

Re-export everything from the above files.

---

Do not create any Zustand stores, screens, or components in this feature.
Do not modify any existing files from feature1.
Do not add any runtime logic — types only.
Use `string` for all dates (ISO 8601) — do not use the `Date` object in type definitions.

### Check when done
- `types/document.ts`, `types/notification.ts`, `types/user.ts`, `types/index.ts` all exist
- All types are exported correctly from `types/index.ts`
- No TypeScript errors (`npx tsc --noEmit` passes)