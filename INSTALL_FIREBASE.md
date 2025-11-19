# 🔥 How to Install Firebase Tools

## Prerequisites: Install Node.js First

Firebase Tools requires Node.js (version 16 or higher). Let's install it first.

---

## Step 1: Install Node.js

### Option A: Using Homebrew (Recommended for macOS)

1. **Install Homebrew** (if you don't have it):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js**:
   ```bash
   brew install node
   ```

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., `v20.10.0` and `10.2.3`)

### Option B: Download from Official Website

1. **Go to Node.js website**: https://nodejs.org/
2. **Download the LTS version** (Long Term Support - recommended)
3. **Run the installer** (.pkg file for macOS)
4. **Follow the installation wizard**
5. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Option C: Using nvm (Node Version Manager)

If you want to manage multiple Node.js versions:

1. **Install nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **Restart your terminal** or run:
   ```bash
   source ~/.zshrc
   ```

3. **Install Node.js**:
   ```bash
   nvm install --lts
   nvm use --lts
   ```

4. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

---

## Step 2: Install Firebase Tools

Once Node.js is installed, install Firebase Tools globally:

```bash
npm install -g firebase-tools
```

**What this does:**
- `npm` = Node Package Manager (comes with Node.js)
- `install` = install a package
- `-g` = install globally (available system-wide)
- `firebase-tools` = the Firebase CLI package

---

## Step 3: Verify Firebase Tools Installation

Check if Firebase Tools is installed correctly:

```bash
firebase --version
```

You should see something like: `13.0.0` (or similar version number)

---

## Step 4: Login to Firebase

After installation, login to your Firebase account:

```bash
firebase login
```

This will:
1. Open your browser
2. Ask you to sign in with your Google account
3. Authorize Firebase CLI to access your account
4. Return to terminal showing "Success! Logged in as your-email@gmail.com"

---

## Troubleshooting

### "command not found: node" or "command not found: npm"

**Solution**: Node.js is not installed or not in your PATH.

1. Install Node.js using one of the methods above
2. Restart your terminal
3. Verify with `node --version`

### "Permission denied" when installing globally

**Solution**: Use sudo (macOS/Linux) or run as administrator (Windows):

```bash
sudo npm install -g firebase-tools
```

**Or** (better solution): Configure npm to use a directory you own:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g firebase-tools
```

### "EACCES: permission denied" errors

**Solution**: Fix npm permissions:

```bash
sudo chown -R $(whoami) ~/.npm
```

### Firebase login fails

**Solution**: 
1. Make sure you have a Google account
2. Try: `firebase login --no-localhost` (for remote servers)
3. Check your internet connection

---

## Quick Installation Commands (Copy & Paste)

### For macOS with Homebrew:

```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify Node.js
node --version
npm --version

# Install Firebase Tools
npm install -g firebase-tools

# Verify Firebase Tools
firebase --version

# Login to Firebase
firebase login
```

### For macOS without Homebrew:

1. Download Node.js from https://nodejs.org/ (LTS version)
2. Install the .pkg file
3. Then run:
```bash
npm install -g firebase-tools
firebase --version
firebase login
```

---

## Next Steps

After successful installation:

1. ✅ Node.js installed
2. ✅ Firebase Tools installed
3. ✅ Logged into Firebase

**Continue with**: `FIREBASE_DEPLOYMENT.md` Step 2 (Initialize Firebase)

---

## Need Help?

- **Node.js Issues**: https://nodejs.org/en/download/
- **Firebase CLI Docs**: https://firebase.google.com/docs/cli
- **Firebase Support**: https://firebase.google.com/support


