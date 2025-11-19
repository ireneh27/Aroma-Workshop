# 🚀 Firebase Quick Start Guide

## Quick Setup (5 Minutes)

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase

```bash
cd /Users/ireneh/Documents/GitHub/Aroma-Workshop
firebase init
```

**Select:**
- ✅ Hosting
- ✅ Firestore
- ✅ Functions

### Step 4: Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### Step 5: Set Up Firebase Console

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Create **Firestore Database**
5. Copy your Firebase config

### Step 6: Create Firebase Config File

Create `firebase-config.js` with your Firebase config (see FIREBASE_DEPLOYMENT.md)

### Step 7: Deploy

```bash
firebase deploy
```

---

## Two Deployment Options

### Option A: Firebase Hosting (Recommended)

**Pros:**
- All-in-one solution
- Automatic HTTPS
- CDN included
- Easy deployment

**Steps:**
1. Follow FIREBASE_DEPLOYMENT.md
2. Deploy: `firebase deploy`

**URL:** `https://your-project.web.app`

---

### Option B: GitHub Pages + Firebase Backend

**Pros:**
- Keep using GitHub Pages
- Only backend on Firebase
- Familiar workflow

**Steps:**
1. Keep frontend on GitHub Pages
2. Set up Firebase for backend only
3. Update frontend to use Firebase services
4. Deploy frontend: `git push`
5. Deploy functions: `firebase deploy --only functions`

**URL:** `https://ireneh27.github.io/Aroma-Workshop/`

---

## Which Should You Choose?

### Choose Firebase Hosting if:
- ✅ You want everything in one place
- ✅ You want automatic deployments
- ✅ You don't mind learning Firebase Hosting

### Choose GitHub Pages + Firebase if:
- ✅ You want to keep current GitHub Pages setup
- ✅ You prefer GitHub's deployment workflow
- ✅ You only need Firebase for backend

---

## Next Steps

1. Read `FIREBASE_DEPLOYMENT.md` for detailed instructions
2. Choose your deployment option
3. Follow the step-by-step guide
4. Test locally before deploying

---

## Need Help?

- Check `FIREBASE_DEPLOYMENT.md` for detailed guide
- Firebase Docs: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support


