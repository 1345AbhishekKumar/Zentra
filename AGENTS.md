You are an expert Senior React Native & Expo engineer helping me build Zentra.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction.
Think like a senior mobile developer.

## Application Building Context
        Read the following files in order before implementing or making any architectural decision:
        DESIGN.md — theme, colors, typography, canvas design, and component conventions
        Read the SYSTEM_DESIGN.md for context overview.
        context/progress-tracker.md — current phase, completed work, open questions, and next steps
Update context/progress-tracker.md after each meaningful implementation change.

If implementation changes the architecture, scope, or standards documented in the contents files, update the relevant file before continuing.
--

Always use bun for installing packages

Read the CLAUDE.md file

if i provide you solve any problems , after solving the problem update the report.md file 

## Project Overview

We are building Zentra, a privacy-first mobile app that helps individuals and businesses track their important documents and receive timely alerts before they expire.

The app includes:
- Document upload & entry (stored locally only)
- Expiry date tracking
- Push notifications for upcoming expirations
- Dashboard showing upcoming expirations at a glance

Keep the implementation simple and readable.
Build brick by brick — one feature at a time.

--

## Tech Stack

- Expo (managed workflow)
- React Native
- TypeScript (strict mode)
- Expo Router (file-based routing)
- NativeWind (Tailwind-for-RN styling)
- Zustand (global state)
- AsyncStorage (local persistence — single source of truth for all data)
- Clerk (authentication only)
- Expo Notifications (push & local notification scheduling)
- date-fns (date calculations)

Do not introduce new major libraries unless there is a strong reason.
Ask before installing anything new.

--

## Privacy-First Rule — NON-NEGOTIABLE

Zentra is 100% local and privacy-first. This is the most important rule in this file.

- All document data lives exclusively in AsyncStorage on the user's device.
- Never send document data, file contents, expiry dates, or any user info to any external API, server, AI service, or third-party service.
- Never introduce cloud storage (Firebase, Supabase, S3, etc.) for document data.
- Never use any AI/LLM service for processing document content.
- Clerk is used for authentication only — no document data ever touches Clerk or any external service.
- All date logic, expiry calculations, and notification scheduling happen entirely on-device.

If a feature would require sending document data off-device, do not implement it. Flag it and ask.

--

## Development Philosophy

Build feature by feature — brick by brick.
For every feature:
1. Read this file first.
2. Keep the implementation simple.
3. Avoid overengineering.
4. Prefer readable code over clever code.
5. Build the smallest useful version first.
6. Refactor only when repetition appears.

--

## Decision Making

If something is unclear or could be improved, suggest a better approach.
If a new library would significantly help, recommend it, explain why, and ask before adding it.
Do not install new libraries without approval.

--

## Architecture

Use this folder structure:

```
app/              → routes & screens (Expo Router)
components/       → reusable UI components
store/            → Zustand stores
hooks/            → custom hooks
lib/              → helpers (notifications.ts, date.ts)
types/            → TypeScript interfaces & types
constants/        → colors, strings, images
assets/           → fonts, icons, images
```

**app/** is for routes and screens only. Screens compose components and call hooks or stores.
They should not contain large reusable UI blocks or business logic.

**components/** is for reusable UI. Create a component when it is reused in multiple places,
when it makes a screen easier to read, or when it represents a clear UI concept.
Examples for this app: `DocumentCard`, `ExpiryBadge`, `NotificationToggle`, `DashboardHeader`, `AddDocumentForm`.
Do not create components too early.

**store/** holds Zustand stores. Examples of state to keep here:
- `documents[]` — all user documents
- `notificationSettings` — per-document or global notification preferences
- `upcomingExpirations[]` — derived list of documents expiring soon
- `user` — local user profile (no cloud sync)

Persist store slices with AsyncStorage.

**lib/** holds helper modules only:
- `lib/date.ts` — all date calculations and expiry logic
- `lib/notifications.ts` — all Expo Notifications scheduling and management

Never expose secret keys in lib/. Never put document data handling logic in screens.

**types/** holds all shared TypeScript interfaces. Keep them simple and co-located by domain.

--

## UI Rules

For any UI task:
- Replicate the provided design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius, shadows, alignment, and proportions.
- Do not approximate. Do not simplify unless explicitly asked.

--

## Styling Rules

Use NativeWind classes for all styling. Do not use StyleSheet unless it is impossible to achieve with className.
Check package.json for the installed NativeWind version. Do not upgrade without approval.

### Style Exception List

Use StyleSheet or inline styles only for:
- `SafeAreaView` (className not supported)
- `KeyboardAvoidingView` (behavior props)
- `Modal` (visible, transparent props)
- `Animated.View` (animated style values)
- Dynamic styles calculated at runtime
- Platform-specific styles
- `Pressable` or `TouchableOpacity` pressed states
- Shadows (different per platform)

Everywhere else, use NativeWind.

--

## Image Rule

Use centralized image imports.
1. Check if `constants/images.ts` exists.
2. If not, create it.
3. Import all app images there.
4. Use them through the centralized object.

```ts
import logo from "@/assets/images/logo.png";
export const images = { logo };
```

Do not import image assets directly inside screens or components.

--

## State Management

- Zustand for all global client state.
- Local `useState` for temporary UI state only (modals, input fields).
- AsyncStorage for persistence — all document data must be persisted here.
- Never derive expiry state on the fly in components — use the store.

--

## Date & Notification Rules

- All date calculations (days until expiry, overdue checks, sorting) must go through `lib/date.ts`.
- All notification scheduling, cancellation, and permission checks must go through `lib/notifications.ts`.
- Never call `Expo Notifications` directly from screens or components.
- Notification triggers are always calculated locally from document expiry dates — no server involvement.

--

## TypeScript

- Strict mode enabled.
- No `any`.
- Keep types simple and readable.
- Define a clear `Document` type in `types/` with at minimum: `id`, `name`, `category`, `expiryDate`, `createdAt`, `notificationsEnabled`.

--

## Authentication

- Clerk handles authentication only.
- After sign-in, all app data is loaded from AsyncStorage on the local device.
- Never associate document data with Clerk user IDs in any external system.
- Clerk session = gate to open the app. Nothing more.

--

## Feature Implementation

When building a feature:
1. Read this file first.
2. Identify the files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Make sure the feature works end to end.
7. Fix lint and type errors before finishing.

--

## Secrets

- Never expose secret keys in client code.
- Clerk publishable key goes in `.env` only — never hardcoded.
- No other external API keys should exist in this project.
- Do not read the `.env` file directly under any circumstances as it may expose security credentials or configurations to log/context outputs. Rely strictly on system/process environments managed at the client runtime.

--

## Communication

Be concise. Explain what changed and how to test it.
If you make an assumption, state it clearly.

--

## Final Reminder

Before every feature:
- Read this file.
- Follow it strictly.
- Build clean, simple, brick-by-brick code.
- Never send document data outside the device.
- Replicate UI exactly when designs are provided.