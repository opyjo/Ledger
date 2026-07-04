# Ledger

A calendar kept your way. Built with Next.js, Firebase, and Tailwind CSS.

## Features

- Google sign-in via Firebase Authentication
- Cloud-synced events, categories, and settings with Cloud Firestore
- Monthly calendar grid with recurring event support
- Agenda panel for the selected day
- In-browser reminder alerts
- JSON import/export backups
- One-time migration from the original localStorage `index.html` version
- PWA support (installable)

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Firebase Auth + Firestore
- date-fns

## Getting started

```bash
npm install
npm run dev
```

Create a `.env.local` file with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Deployment

Build with:

```bash
npm run build
```

Deploy to Vercel and add the environment variables in the Vercel dashboard.

## Firebase setup

1. Enable **Authentication** with Google provider.
2. Enable **Cloud Firestore** and publish these security rules:
   ```
   match /users/{userId}/{document=**} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
3. Add your Vercel domain to **Authentication → Settings → Authorized domains**.
