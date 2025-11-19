# 🔥 Firebase + GitHub Deployment Guide

## Overview

This guide will help you deploy your aromatherapy website using:
- **Firebase Hosting** (or GitHub Pages) for frontend
- **Firebase Authentication** for user management
- **Firestore Database** for data storage
- **Cloud Functions** for API key protection

## 🎯 Architecture

```
GitHub Repository
    ↓
Firebase Hosting (or GitHub Pages)
    ↓
Firebase Services
    ├── Authentication (users, passwords)
    ├── Firestore (user data, recipes, questionnaires)
    └── Cloud Functions (AI API proxy)
```

## 📋 Prerequisites

- Node.js installed (v16 or higher)
- npm or yarn
- Git
- GitHub account
- Firebase account (free)

---

## Step 1: Set Up Firebase Project

### 1.1 Create Firebase Account

1. Go to https://console.firebase.google.com
2. Sign in with your Google account
3. Click **"Add project"** or **"Create a project"**

### 1.2 Create New Project

1. **Project name**: `aroma-workshop` (or your preferred name)
2. **Google Analytics**: Enable (optional, recommended)
3. Click **"Create project"**
4. Wait for project creation (30-60 seconds)
5. Click **"Continue"**

### 1.3 Get Project Configuration

1. Click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>`
5. **App nickname**: `Aroma Workshop Web`
6. **Firebase Hosting**: Check "Also set up Firebase Hosting"
7. Click **"Register app"**
8. **Copy the Firebase configuration** (you'll need this later):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Step 2: Install Firebase CLI

### 2.1 Install Firebase Tools

```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase

```bash
firebase login
```

This will open a browser window for authentication.

### 2.3 Initialize Firebase in Your Project

```bash
cd /Users/ireneh/Documents/GitHub/Aroma-Workshop
firebase init
```

**Follow the prompts:**

1. **Which Firebase features do you want to set up?**
   - ✅ **Hosting** (space to select, Enter to confirm)
   - ✅ **Firestore** (space to select, Enter to confirm)
   - ✅ **Functions** (space to select, Enter to confirm)
   - ✅ **Authentication** (will be configured in console)

2. **Select a default Firebase project**
   - Select your project: `aroma-workshop`

3. **What do you want to use as your public directory?**
   - Type: `.` (current directory - for Firebase Hosting)
   - Or: `dist` if you want a build folder

4. **Configure as a single-page app?**
   - Type: `N` (No, unless you're using a SPA framework)

5. **Set up automatic builds and deploys with GitHub?**
   - Type: `N` (we'll set this up manually)

6. **File public/index.html already exists. Overwrite?**
   - Type: `N` (keep your existing files)

7. **What language would you like to use to write Cloud Functions?**
   - Select: **JavaScript** (or TypeScript if you prefer)

8. **Do you want to use ESLint to catch probable bugs?**
   - Type: `Y` (recommended)

9. **Do you want to install dependencies with npm now?**
   - Type: `Y`

---

## Step 3: Configure Firebase Services

### 3.1 Enable Authentication

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click **"Authentication"** in left sidebar
4. Click **"Get started"**
5. Click **"Sign-in method"** tab
6. Enable **"Email/Password"**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
7. (Optional) Enable **"Google"** or other providers

### 3.2 Set Up Firestore Database

1. Click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. **Start in production mode** (we'll add security rules later)
4. Select a **location** (choose closest to your users)
5. Click **"Enable"**

### 3.3 Set Up Firestore Security Rules

1. In Firestore, click **"Rules"** tab
2. Replace with these rules (basic security):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User questionnaires
    match /questionnaires/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User profiles
    match /profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User recipes
    match /recipes/{recipeId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.data.userId == request.auth.uid;
    }
    
    // User scenario history
    match /scenarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User history
    match /history/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 4: Install Firebase SDK in Your Project

### 4.1 Install Firebase JavaScript SDK

```bash
npm install firebase
```

### 4.2 Create Firebase Configuration File

Create a new file: `firebase-config.js`

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration (from Step 1.3)
const firebaseConfig = {
  apiKey: "AIza...", // Replace with your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
```

**⚠️ Important**: For now, it's okay to have the config in frontend code. Firebase API keys are meant to be public, but security is enforced through Firestore rules and Authentication.

---

## Step 5: Create Cloud Function for AI API Proxy

### 5.1 Navigate to Functions Directory

```bash
cd functions
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Create AI Proxy Function

Edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// AI API Proxy Function
exports.proxyAI = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to use AI features'
    );
  }

  const userId = context.auth.uid;
  const { messages, provider = 'deepseek', model, maxTokens = 1000 } = data;

  // Check user's AI inquiry limit
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (!userData) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const aiInquiriesUsed = userData.aiInquiriesUsed || 0;
  const aiInquiriesLimit = userData.aiInquiriesLimit || 3;

  if (aiInquiriesUsed >= aiInquiriesLimit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'AI inquiry limit exceeded'
    );
  }

  // Get API key from environment (set via Firebase Console)
  const apiKeys = {
    deepseek: functions.config().deepseek?.api_key || '',
    openai: functions.config().openai?.api_key || '',
    anthropic: functions.config().anthropic?.api_key || ''
  };

  const apiKey = apiKeys[provider];
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `API key not configured for ${provider}`
    );
  }

  // Determine API endpoint
  const endpoints = {
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    anthropic: 'https://api.anthropic.com/v1/messages'
  };

  const endpoint = endpoints[provider];
  if (!endpoint) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Unknown provider: ${provider}`
    );
  }

  try {
    // Make API call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider === 'anthropic' && {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        })
      },
      body: JSON.stringify({
        model: model || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini'),
        messages: messages,
        max_tokens: maxTokens,
        ...(provider === 'anthropic' && {
          system: 'You are a helpful aromatherapy assistant.'
        })
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    // Update user's AI inquiry count
    await admin.firestore().collection('users').doc(userId).update({
      aiInquiriesUsed: admin.firestore.FieldValue.increment(1),
      lastAIInquiry: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      data: result,
      remaining: aiInquiriesLimit - aiInquiriesUsed - 1
    };
  } catch (error) {
    console.error('AI API error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `AI API call failed: ${error.message}`
    );
  }
});

// Get user AI inquiry status
exports.getAIStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return {
      canUse: false,
      remaining: 0,
      limit: 3
    };
  }

  const userData = userDoc.data();
  const used = userData.aiInquiriesUsed || 0;
  const limit = userData.aiInquiriesLimit || 3;

  return {
    canUse: used < limit,
    remaining: Math.max(0, limit - used),
    limit: limit
  };
});
```

### 5.4 Install Additional Dependencies

```bash
npm install node-fetch@2
```

### 5.5 Set Environment Variables (API Keys)

```bash
firebase functions:config:set deepseek.api_key="your-deepseek-api-key"
firebase functions:config:set openai.api_key="your-openai-api-key"
firebase functions:config:set anthropic.api_key="your-anthropic-api-key"
```

**⚠️ Security**: These keys are stored securely in Firebase and never exposed to the frontend.

---

## Step 6: Update Frontend Code

### 6.1 Create Firebase Auth Wrapper

Create `firebase-auth.js`:

```javascript
// firebase-auth.js
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

// Register new user
export async function registerUser(email, password, name = '') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      name: name || email.split('@')[0],
      registeredAt: new Date().toISOString(),
      membershipType: 'free',
      aiInquiriesUsed: 0,
      aiInquiriesLimit: 3,
      lastLogin: new Date().toISOString()
    });

    return {
      success: true,
      message: '注册成功！您已获得3次免费AI查询机会',
      user: {
        id: user.uid,
        email: user.email,
        ...(await getDoc(doc(db, 'users', user.uid))).data()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message === 'auth/email-already-in-use' 
        ? '该邮箱已被注册，请直接登录'
        : '注册失败：' + error.message
    };
  }
}

// Login user
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    });

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    return {
      success: true,
      message: '登录成功',
      user: {
        id: user.uid,
        email: user.email,
        ...userDoc.data()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message === 'auth/user-not-found'
        ? '邮箱未注册，请先注册'
        : error.message === 'auth/wrong-password'
        ? '密码错误'
        : '登录失败：' + error.message
    };
  }
}

// Logout user
export async function logoutUser() {
  try {
    await signOut(auth);
    return {
      success: true,
      message: '已登出'
    };
  } catch (error) {
    return {
      success: false,
      message: '登出失败：' + error.message
    };
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Check if user is logged in
export function isUserLoggedIn() {
  return auth.currentUser !== null;
}

// Listen to auth state changes
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Get user data from Firestore
export async function getUserData(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  }
  return null;
}
```

### 6.2 Update AI Service to Use Cloud Functions

Update `ai-service.js` to use Firebase Functions instead of direct API calls:

```javascript
// In ai-service.js, replace callAI function:

import { functions } from './firebase-config.js';
import { httpsCallable } from 'firebase/functions';

const proxyAI = httpsCallable(functions, 'proxyAI');
const getAIStatus = httpsCallable(functions, 'getAIStatus');

async function callAI(messages, options = {}) {
  // Check if user is authenticated
  if (typeof window === 'undefined' || !window.firebaseAuth || !window.firebaseAuth.isUserLoggedIn()) {
    throw new Error('AI_QUERY_REQUIRES_LOGIN');
  }

  // Check AI status
  try {
    const status = await getAIStatus();
    if (!status.data.canUse) {
      throw new Error('AI_QUERY_LIMIT_EXCEEDED');
    }
  } catch (error) {
    if (error.message === 'AI_QUERY_LIMIT_EXCEEDED') {
      throw error;
    }
  }

  // Call Cloud Function
  try {
    const result = await proxyAI({
      messages: messages,
      provider: AI_CONFIG.provider,
      model: options.model || AI_CONFIG[AI_CONFIG.provider].model,
      maxTokens: options.maxTokens || AI_CONFIG[AI_CONFIG.provider].maxTokens
    });

    return result.data.data;
  } catch (error) {
    console.error('AI API error:', error);
    throw error;
  }
}
```

### 6.3 Update HTML Files to Use Firebase

Add Firebase scripts to your HTML files (e.g., `index.html`):

```html
<!-- Before closing </body> tag -->
<script type="module">
  import { auth, db } from './firebase-config.js';
  import * as firebaseAuth from './firebase-auth.js';
  
  // Make available globally
  window.firebaseAuth = firebaseAuth;
  
  // Listen to auth state changes
  firebaseAuth.onAuthChange((user) => {
    if (user) {
      console.log('User logged in:', user.email);
      // Update UI
    } else {
      console.log('User logged out');
      // Update UI
    }
  });
</script>
```

---

## Step 7: Deploy to Firebase

### 7.1 Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 7.2 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### 7.3 Deploy Everything

```bash
firebase deploy
```

Your site will be available at: `https://your-project-id.web.app`

---

## Step 8: Set Up GitHub Integration (Optional)

### Option A: Use Firebase Hosting (Recommended)

1. Firebase automatically deploys on git push if configured
2. Or manually deploy: `firebase deploy`

### Option B: Use GitHub Pages + Firebase Backend

1. Keep frontend on GitHub Pages
2. Use Firebase only for backend services
3. Update `firebase-config.js` with your Firebase project config
4. Deploy frontend to GitHub Pages as usual

---

## Step 9: Migrate Existing Data (Optional)

Create a migration script to move localStorage data to Firestore:

```javascript
// migrate-data.js (run once in browser console)
import { auth, db } from './firebase-config.js';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

async function migrateData() {
  const user = auth.currentUser;
  if (!user) {
    console.error('User not logged in');
    return;
  }

  // Migrate questionnaires
  const questionnaireData = localStorage.getItem('healthQuestionnaireData');
  if (questionnaireData) {
    await setDoc(doc(db, 'questionnaires', user.uid), JSON.parse(questionnaireData));
    console.log('Migrated questionnaire data');
  }

  // Migrate recipes
  const recipes = localStorage.getItem('eo_recipes_v1');
  if (recipes) {
    const recipesData = JSON.parse(recipes);
    for (const recipe of recipesData) {
      await addDoc(collection(db, 'recipes'), {
        ...recipe,
        userId: user.uid
      });
    }
    console.log('Migrated recipes');
  }

  console.log('Migration complete!');
}
```

---

## 📝 Firebase Configuration Files

### `.firebaserc`
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### `firebase.json`
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions"
  }
}
```

---

## 🔒 Security Checklist

- [x] Firestore security rules configured
- [x] API keys stored in Firebase Functions config (not frontend)
- [x] Authentication required for sensitive operations
- [x] User data isolated by userId
- [x] HTTPS enforced (automatic with Firebase)

---

## 🚀 Next Steps

1. Test authentication flow
2. Test AI API proxy
3. Migrate user data
4. Update UI to use Firebase services
5. Deploy and test

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firestore](https://firebase.google.com/docs/firestore)

---

## 💰 Cost Estimate

**Free Tier (Spark Plan)** covers:
- 1GB storage
- 10GB/month transfer
- 50K reads/day
- 20K writes/day
- 2M function invocations/month
- Unlimited authentication users

**For most small-to-medium sites, the free tier is sufficient!**

