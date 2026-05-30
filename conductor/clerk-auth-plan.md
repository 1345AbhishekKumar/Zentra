# Clerk Authentication Implementation Plan

## Objective
Integrate Clerk authentication into the Zentra app's sign-in and sign-up flows using Clerk's custom hooks (`useSignIn`, `useSignUp`). The existing UI/UX will be strictly preserved.

## Key Files & Context
- `src/app/index.tsx`: Root routing entry point.
- `src/app/(auth)/_layout.tsx`: Auth route protection.
- `src/app/(auth)/sign-in.tsx`: Sign-in screen.
- `src/app/(auth)/sign-up.tsx`: Sign-up screen.
- `src/components/VerificationModal.tsx`: OTP verification modal.

## Implementation Steps
1. **Root Routing (`src/app/index.tsx`)**
   - Use `useAuth()` or Clerk's `<SignedIn>` / `<SignedOut>` components to handle the initial redirect.
   - Redirect to `/(auth)/sign-in` if the user is unauthenticated.
   - Render a temporary authenticated state or redirect to a dashboard if authenticated.

2. **Auth Layout (`src/app/(auth)/_layout.tsx`)**
   - Use `useAuth()` to check if the user is already signed in.
   - If signed in, automatically redirect to `/` to prevent accessing auth screens.

3. **Sign-In Logic (`src/app/(auth)/sign-in.tsx`)**
   - Import and use `useSignIn` from `@clerk/expo`.
   - Update `handleSignIn` to call `signIn.create({ identifier: email, password })`.
   - On success (`status === 'complete'`), set the active session using `setActive({ session: signIn.createdSessionId })` and route to `/`.
   - Catch and map Clerk errors (e.g., invalid credentials) to the existing UI error states (`setEmailError`, `setPasswordError`).

4. **Sign-Up Logic (`src/app/(auth)/sign-up.tsx`)**
   - Import and use `useSignUp` from `@clerk/expo`.
   - Update `handleSignUp` to call `signUp.create({ emailAddress: email, password })`.
   - On success, initiate email verification via `signUp.prepareEmailAddressVerification()`.
   - Open the `VerificationModal`.
   - Catch and map Clerk errors (e.g., weak password, email taken) to local UI error states.

5. **Verification Modal (`src/components/VerificationModal.tsx`)**
   - Modify the modal to accept an `onVerify(code)` callback from the parent `sign-up.tsx` screen, keeping the Clerk `useSignUp` hook logic centralized in the sign-up component.
   - Update `handleCodeChange` to trigger the actual verification instead of the timeout mock.
   - On successful verification (`status === 'complete'`), set the active session (`setActive({ session: signUp.createdSessionId })`) and close the modal/redirect.
   - Implement the "Resend Code" button to trigger the resend callback.

## Verification & Testing
- **Sign-Up Flow:** Enter new credentials -> verify OTP modal opens -> enter code -> verify redirect to `/`.
- **Sign-In Flow:** Enter valid credentials -> verify redirect to `/`.
- **Error Handling:** Enter invalid email/password -> verify inline error messages appear without crashing.
- **Protection:** Navigate to `/` while logged out -> verify redirect to `/sign-in`. Navigate to `/sign-in` while logged in -> verify redirect to `/`.