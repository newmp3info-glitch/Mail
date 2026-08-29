# Rimpa Mail — Android / GitHub Actions

This repository contains the Rimpa Mail web app configured for Android packaging with Capacitor.

## Build APK on GitHub

1. Upload all files in this repository to the **root of a GitHub repository**.
2. Open **Actions** → **Build Android APK**.
3. Click **Run workflow** (or push to `main`/`master`).
4. When the workflow finishes, open the workflow run → **Artifacts** → download `rimpa-mail-debug-apk`.
5. The downloaded ZIP contains `app-debug.apk`.

## Backend/API

The Android app calls:
`VITE_API_BASE_URL + /api/...`

Set the GitHub repository secret:

- Name: `VITE_API_BASE_URL`
- Value: your HTTPS backend URL, for example `https://your-backend.example.com`

Do not put private API keys in frontend code. Server secrets such as `STRIPE_SECRET_KEY` must stay on the backend server.

## Important

This repository builds the Android APK. The existing `server.ts` is a Node/Express backend and must be deployed separately if the app needs its `/api/*` endpoints. The APK itself does not run `server.ts`.

## Local Android setup (optional)

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

Then open the generated `android` project in Android Studio.
