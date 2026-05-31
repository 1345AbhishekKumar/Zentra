import { addDays, addMonths, addYears, format, subDays } from "date-fns";
import {
    daysUntilExpiry,
    expiryLabel,
    expiryUrgency,
    filterUpcoming,
    formatDate,
    isExpired,
    isExpiringSoon,
    sortByExpiry,
} from "../src/lib/date";
import { ZentraDocument } from "../src/types";

// Helper to format ISO date string
const toISOStr = (date: Date) => format(date, "yyyy-MM-dd");

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// Setup test dates relative to today
const today = new Date();
const pastDate = toISOStr(subDays(today, 5));
const todayStr = toISOStr(today);
const tomorrowStr = toISOStr(addDays(today, 1));
const criticalDate = toISOStr(addDays(today, 5));
const warningDate = toISOStr(addDays(today, 25));
const safeDate = toISOStr(addDays(today, 45));

console.log("=== Running Zentra Date Utilities Test ===");

// 1. daysUntilExpiry
assert(
  daysUntilExpiry(pastDate) === -5,
  `daysUntilExpiry(pastDate) should be -5, got ${daysUntilExpiry(pastDate)}`,
);
assert(
  daysUntilExpiry(todayStr) === 0,
  `daysUntilExpiry(todayStr) should be 0, got ${daysUntilExpiry(todayStr)}`,
);
assert(
  daysUntilExpiry(tomorrowStr) === 1,
  `daysUntilExpiry(tomorrowStr) should be 1, got ${daysUntilExpiry(tomorrowStr)}`,
);
assert(
  daysUntilExpiry(criticalDate) === 5,
  `daysUntilExpiry(criticalDate) should be 5, got ${daysUntilExpiry(criticalDate)}`,
);
console.log("✓ daysUntilExpiry tests passed.");

// 2. isExpired
assert(isExpired(pastDate) === true, "isExpired(pastDate) should be true");
assert(isExpired(todayStr) === false, "isExpired(todayStr) should be false");
assert(
  isExpired(criticalDate) === false,
  "isExpired(criticalDate) should be false",
);
console.log("✓ isExpired tests passed.");

// 3. isExpiringSoon
assert(
  isExpiringSoon(pastDate, 30) === false,
  "isExpiringSoon(pastDate, 30) should be false",
);
assert(
  isExpiringSoon(todayStr, 30) === true,
  "isExpiringSoon(todayStr, 30) should be true",
);
assert(
  isExpiringSoon(criticalDate, 30) === true,
  "isExpiringSoon(criticalDate, 30) should be true",
);
assert(
  isExpiringSoon(safeDate, 30) === false,
  "isExpiringSoon(safeDate, 30) should be false",
);
console.log("✓ isExpiringSoon tests passed.");

// 4. expiryLabel
assert(
  expiryLabel(pastDate) === "Expired",
  `expiryLabel(pastDate) should be 'Expired', got '${expiryLabel(pastDate)}'`,
);
assert(
  expiryLabel(todayStr) === "Today",
  `expiryLabel(todayStr) should be 'Today', got '${expiryLabel(todayStr)}'`,
);
assert(
  expiryLabel(tomorrowStr) === "Tomorrow",
  `expiryLabel(tomorrowStr) should be 'Tomorrow', got '${expiryLabel(tomorrowStr)}'`,
);
assert(
  expiryLabel(criticalDate) === "In 5 days",
  `expiryLabel(criticalDate) should be 'In 5 days', got '${expiryLabel(criticalDate)}'`,
);

const in2Months = toISOStr(addMonths(today, 2));
assert(
  expiryLabel(in2Months) === "In 2 months",
  `expiryLabel(in2Months) should be 'In 2 months', got '${expiryLabel(in2Months)}'`,
);

const in1Year = toISOStr(addYears(today, 1));
assert(
  expiryLabel(in1Year) === "In 1 year",
  `expiryLabel(in1Year) should be 'In 1 year', got '${expiryLabel(in1Year)}'`,
);
console.log("✓ expiryLabel tests passed.");

// 5. formatDate
const formatted = formatDate("2024-05-10");
assert(
  formatted === "10 May 2024",
  `formatDate("2024-05-10") should be '10 May 2024', got '${formatted}'`,
);
console.log("✓ formatDate tests passed.");

// Test mock documents
const doc1: ZentraDocument = {
  id: "1",
  name: "Doc 1 (expired)",
  category: "Personal",
  fileType: "pdf",
  expiryDate: pastDate,
  createdAt: todayStr,
  updatedAt: todayStr,
  notificationsEnabled: true,
  isFavorite: false,
};

const doc2: ZentraDocument = {
  id: "2",
  name: "Doc 2 (critical)",
  category: "Work",
  fileType: "pdf",
  expiryDate: criticalDate,
  createdAt: todayStr,
  updatedAt: todayStr,
  notificationsEnabled: true,
  isFavorite: false,
};

const doc3: ZentraDocument = {
  id: "3",
  name: "Doc 3 (warning)",
  category: "Finance",
  fileType: "pdf",
  expiryDate: warningDate,
  createdAt: todayStr,
  updatedAt: todayStr,
  notificationsEnabled: true,
  isFavorite: false,
};

const doc4: ZentraDocument = {
  id: "4",
  name: "Doc 4 (safe)",
  category: "Other",
  fileType: "pdf",
  expiryDate: safeDate,
  createdAt: todayStr,
  updatedAt: todayStr,
  notificationsEnabled: true,
  isFavorite: false,
};

const docsList = [doc4, doc2, doc1, doc3];

// 6. sortByExpiry
const sorted = sortByExpiry(docsList);
assert(
  sorted[0].id === "1",
  "sortByExpiry: first element should be doc1 (expired)",
);
assert(
  sorted[1].id === "2",
  "sortByExpiry: second element should be doc2 (critical)",
);
assert(
  sorted[2].id === "3",
  "sortByExpiry: third element should be doc3 (warning)",
);
assert(
  sorted[3].id === "4",
  "sortByExpiry: fourth element should be doc4 (safe)",
);
console.log("✓ sortByExpiry tests passed.");

// 7. filterUpcoming
const upcoming = filterUpcoming(docsList, 30);
assert(
  upcoming.length === 2,
  `filterUpcoming(30) should return 2 documents, got ${upcoming.length}`,
);
assert(
  upcoming.some((d) => d.id === "2"),
  "filterUpcoming should contain doc2",
);
assert(
  upcoming.some((d) => d.id === "3"),
  "filterUpcoming should contain doc3",
);
assert(
  !upcoming.some((d) => d.id === "1"),
  "filterUpcoming should NOT contain doc1 (expired)",
);
assert(
  !upcoming.some((d) => d.id === "4"),
  "filterUpcoming should NOT contain doc4 (safe)",
);
console.log("✓ filterUpcoming tests passed.");

// 8. expiryUrgency
assert(
  expiryUrgency(pastDate) === "expired",
  `expiryUrgency(pastDate) should be 'expired', got '${expiryUrgency(pastDate)}'`,
);
assert(
  expiryUrgency(criticalDate) === "critical",
  `expiryUrgency(criticalDate) should be 'critical', got '${expiryUrgency(criticalDate)}'`,
);
assert(
  expiryUrgency(warningDate) === "warning",
  `expiryUrgency(warningDate) should be 'warning', got '${expiryUrgency(warningDate)}'`,
);
assert(
  expiryUrgency(safeDate) === "safe",
  `expiryUrgency(safeDate) should be 'safe', got '${expiryUrgency(safeDate)}'`,
);
console.log("✓ expiryUrgency tests passed.");

console.log("=== All Tests Completed Successfully! ===");
