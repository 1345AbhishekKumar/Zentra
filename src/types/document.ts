export type DocumentCategory = 'Personal' | 'Work' | 'Finance' | 'Health' | 'Other' | (string & {});

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
  isDeleted?: boolean;               // true when in the recently deleted bin/trash
  deletedAt?: string;                // ISO 8601 datetime string when soft-deleted
}
