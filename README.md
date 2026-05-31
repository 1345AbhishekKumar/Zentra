# Zentra

Zentra is a privacy-first mobile app that helps individuals and businesses track their important documents and receive timely alerts before they expire.

## Features

- **Document Upload & Entry:** Securely add documents and keep track of them.
- **Expiry Date Tracking:** Keep an eye on when important documents are about to expire.
- **Push Notifications:** Receive timely local alerts for upcoming expirations.
- **At-a-Glance Dashboard:** View upcoming expirations easily from the main dashboard.

## Privacy-First Architecture

Zentra is built with a **100% local and privacy-first** mindset.

- **Local Storage:** All document data lives exclusively in `AsyncStorage` on the user's device.
- **No External Sync:** Document data, file contents, expiry dates, and user info are never sent to any external API, cloud server, or AI service.
- **On-Device Logic:** All date logic, expiry calculations, and notification scheduling happen entirely on-device.
- **Authentication:** Authentication is handled securely by Clerk, acting only as a secure gate to open the app. No document data is ever associated with external systems.

## Tech Stack

- **Framework:** React Native with Expo (Managed Workflow)
- **Language:** TypeScript (Strict Mode)
- **Routing:** Expo Router (File-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **State Management:** Zustand (Global client state)
- **Persistence:** AsyncStorage (Single source of truth for local data)
- **Authentication:** Clerk
- **Notifications:** Expo Notifications (Local scheduling)
- **Date Utilities:** date-fns

## Project Structure

```text
app/              → routes & screens (Expo Router)
components/       → reusable UI components (e.g., DocumentCard, DashboardHeader)
store/            → Zustand stores (e.g., documents, user, notificationSettings)
hooks/            → custom React hooks
lib/              → helpers (e.g., notifications.ts, date.ts)
types/            → TypeScript interfaces & types
constants/        → colors, strings, centralized image imports
assets/           → fonts, icons, images
```

## Setup & Development

1. **Clone the repository**
   ```bash
   git clone (https://github.com/1345AbhishekKumar/Zentra.git)
   cd Zentra
   ```

2. **Install dependencies**
   Make sure you have [Bun](https://bun.sh/) installed, then run:
   ```bash
   bun install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root of your project and add your Clerk publishable key:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   ```

4. **Start the development server**
   ```bash
   bun start
   ```

   For iOS/Android native builds:
   ```bash
   bun run ios
   bun run android
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
