Read AGENTS.md first and follow it strictly.

## Task — lib/date.ts (All Date & Expiry Logic)

Create `lib/date.ts` — the single module for all date calculations in Zentra. No screen or component may import `date-fns` directly; all date logic routes through this file.

**Steps:**

1. Install `date-fns` if not already installed.

2. Create `lib/date.ts` and export the following functions:

```ts
// Returns the number of days from today until expiryDate (negative if already expired)
daysUntilExpiry(expiryDate: string): number

// Returns true if the document has already expired
isExpired(expiryDate: string): boolean

// Returns true if the document expires within the given number of days
isExpiringSoon(expiryDate: string, withinDays: number): boolean

// Returns a human-readable label for the expiry state:
// "Expired", "Today", "Tomorrow", "In N days", "In N months", "In N years"
expiryLabel(expiryDate: string): string

// Returns a display-formatted date string, e.g. "10 May 2024"
formatDate(dateString: string): string

// Sorts an array of ZentraDocument by expiryDate ascending (soonest first)
sortByExpiry(docs: ZentraDocument[]): ZentraDocument[]

// Filters docs to those expiring within withinDays from today (excludes already expired)
filterUpcoming(docs: ZentraDocument[], withinDays: number): ZentraDocument[]

// Returns the urgency level of a document for badge coloring:
// "expired" | "critical" (≤7 days) | "warning" (≤30 days) | "safe" (>30 days)
expiryUrgency(expiryDate: string): "expired" | "critical" | "warning" | "safe"
```

3. All functions accept ISO 8601 date strings (`"2025-05-10"`) and use `date-fns` internally.

4. All calculations are relative to the current local device date — no server time, no UTC conversions.

Do not create any Zustand actions, screens, or components in this feature.
Do not import from `store/` — this is a pure utility module.
Do not use the `Date` constructor directly — use `date-fns` functions exclusively.
Do not modify any existing file from feature1 through feature5.

### Check when done
- `lib/date.ts` exists and exports all 8 functions listed above
- Each function is correctly typed with TypeScript (no `any`)
- `isExpired` returns `true` for a date in the past
- `expiryUrgency` returns `"critical"` for a date 5 days from now
- `npx tsc --noEmit` passes