Read AGENTS.md first and follow it strictly.

## Task — Error Boundary + Crash Handling

Wrap Zentra in a global error boundary so unexpected crashes show a friendly recovery screen instead of a blank white app.

**Steps:**

1. Create `components/ErrorBoundary.tsx` — a React class component (error boundaries require class components in React):

   ```tsx
   interface State { hasError: boolean; error: Error | null; }

   class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
     state: State = { hasError: false, error: null };

     static getDerivedStateFromError(error: Error): State {
       return { hasError: true, error };
     }

     componentDidCatch(error: Error, info: React.ErrorInfo) {
       // Log to console only — no external error reporting service (privacy-first)
       console.error("[Zentra Error Boundary]", error, info.componentStack);
     }

     render() {
       if (this.state.hasError) {
         return <ErrorScreen error={this.state.error} onReset={() => this.setState({ hasError: false, error: null })} />;
       }
       return this.props.children;
     }
   }
   ```

2. Create `components/ErrorScreen.tsx` — the fallback UI shown when a crash occurs:
   - Props: `error: Error | null`, `onReset: () => void`
   - Layout (centered, full screen):
     - Large warning icon (64px, `Colors.warning`)
     - Title: "Something went wrong" (bold, large)
     - Sub-text: "Zentra ran into an unexpected error. Your data is safe." (secondary)
     - Error message in a small gray code block (only in dev mode — `__DEV__`):
       ```ts
       {__DEV__ && error?.message}
       ```
     - "Try Again" button (accent, full-width) → calls `onReset()`
     - "Restart App" button (white background, border) → calls `Updates.reloadAsync()` from `expo-updates`

3. Wrap the root layout in `app/_layout.tsx`:
   ```tsx
   <ErrorBoundary>
     {/* existing layout content */}
   </ErrorBoundary>
   ```

4. Add per-screen `try/catch` guards in the three highest-risk operations:
   - `store/documentStore.ts` — wrap `addDocument` and `deleteDocument` actions in try/catch; log errors, never throw to the UI
   - `lib/notifications.ts` — `scheduleDocumentNotifications` already needs this; ensure all async Expo Notifications calls are wrapped
   - `app/_layout.tsx` — wrap `SplashScreen.hideAsync()` in try/catch (it occasionally throws on Android)

5. Add a global unhandled promise rejection handler in `app/_layout.tsx`:
   ```ts
   useEffect(() => {
     const handler = (event: PromiseRejectionEvent) => {
       console.error("[Unhandled Promise]", event.reason);
     };
     // React Native doesn't support addEventListener for unhandledrejection
     // Use the ErrorUtils global instead:
     const originalHandler = ErrorUtils.getGlobalHandler();
     ErrorUtils.setGlobalHandler((error, isFatal) => {
       console.error("[Global Error]", error, "Fatal:", isFatal);
       originalHandler(error, isFatal);
     });
   }, []);
   ```

Do not integrate any external crash reporting service (Sentry, Bugsnag, etc.) — privacy-first means no external data transmission.
Do not show the full stack trace to users in production — only in `__DEV__` mode.
Do not modify any screen beyond `app/_layout.tsx`.
Do not change store shape, lib files, or auth.

### Check when done
- Deliberately throwing an error in a component shows the ErrorScreen instead of a blank app
- "Try Again" resets the error boundary and attempts to re-render
- Error message block only visible in dev mode
- `bunx tsc --noEmit` passes