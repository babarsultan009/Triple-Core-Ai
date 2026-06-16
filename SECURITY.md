# Security Guidelines

## Firebase Configuration

### ⚠️ IMPORTANT: Never commit Firebase credentials to version control!

Firebase configuration files containing API keys should **never** be committed to your repository, even if it's private. Anyone with access to your git history can recover these credentials.

### Setup Instructions

1. **Create a local .env.local file** (automatically ignored by git):
   ```bash
   cp .env.local.example .env.local
   ```

2. **Fill in your Firebase credentials** in `.env.local`:
   - Get your credentials from [Firebase Console](https://console.firebase.google.com/)
   - Project Settings → Service Accounts or Web SDK configuration

3. **Load credentials in your application**:
   ```javascript
   // Example for Next.js/React
   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
     authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
     measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
   };
   ```

### If credentials were exposed:

1. **Rotate your Firebase API keys immediately**:
   - Firebase Console → Project Settings → Service Accounts
   - Delete the exposed key and generate a new one

2. **Remove exposed files from git history**:
   ```bash
   # Using BFG Repo-Cleaner (recommended)
   bfg --delete-files firebase-applet-config.json
   git reflog expire --expire=now --all && git gc --prune=now
   git push origin --force-with-lease
   ```

3. **Or use git filter-branch**:
   ```bash
   git filter-branch --tree-filter 'rm -f firebase-applet-config.json' HEAD
   git push origin --force-with-lease
   ```

## Additional Security Tips

- Use `.env.local` for development credentials
- Use Firebase security rules to restrict database access
- Enable firewall rules in Firebase
- Regularly rotate API keys
- Use different credentials for development, staging, and production
