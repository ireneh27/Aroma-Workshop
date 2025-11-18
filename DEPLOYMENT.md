# Deployment Guide

This guide covers multiple ways to deploy your Aromatherapy Workshop website.

## 🚀 Quick Deployment Options

### Option 1: GitHub Pages (Free, Recommended for Static Sites)

Your repository is already connected to GitHub: `https://github.com/ireneh27/Aroma-Workshop.git`

#### Steps:

1. **Push your latest code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository: https://github.com/ireneh27/Aroma-Workshop
   - Click on **Settings** (top menu)
   - Scroll down to **Pages** in the left sidebar
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

3. **Access your site**:
   - Your site will be available at: `https://ireneh27.github.io/Aroma-Workshop/`
   - It may take 1-2 minutes for the site to be live after enabling Pages

#### Update Deployment:
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
   GitHub Pages will automatically rebuild your site.

---

### Option 2: Vercel (Free, Fast, Easy)

Vercel is excellent for static sites and provides automatic deployments.

#### Steps:

1. **Install Vercel CLI** (optional, can also use web interface):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   cd /Users/ireneh/Documents/GitHub/Aroma-Workshop
   vercel
   ```
   Follow the prompts. First time will ask you to login.

3. **Or deploy via Web Interface**:
   - Go to https://vercel.com
   - Sign up/Login with GitHub
   - Click **Add New Project**
   - Import your repository: `ireneh27/Aroma-Workshop`
   - Click **Deploy** (no build settings needed for static sites)

4. **Automatic deployments**:
   - Every push to `main` branch will automatically deploy
   - You'll get a custom URL like: `aroma-workshop.vercel.app`

---

### Option 3: Netlify (Free, Great for Static Sites)

Netlify offers similar features to Vercel with drag-and-drop deployment.

#### Steps:

1. **Deploy via Web Interface**:
   - Go to https://www.netlify.com
   - Sign up/Login with GitHub
   - Click **Add new site** → **Import an existing project**
   - Select your repository: `ireneh27/Aroma-Workshop`
   - Build settings:
     - Build command: (leave empty for static sites)
     - Publish directory: `/` (root)
   - Click **Deploy site**

2. **Or drag-and-drop**:
   - Go to https://app.netlify.com/drop
   - Drag your project folder
   - Your site will be live instantly

3. **Automatic deployments**:
   - Connect to GitHub for automatic deployments on every push

---

### Option 4: Cloudflare Pages (Free, Fast CDN)

Cloudflare Pages provides excellent performance with global CDN.

#### Steps:

1. **Go to Cloudflare Pages**:
   - Visit https://pages.cloudflare.com
   - Sign up/Login with GitHub

2. **Create a new project**:
   - Click **Create a project**
   - Select your repository: `ireneh27/Aroma-Workshop`
   - Build settings:
     - Framework preset: None
     - Build command: (leave empty)
     - Build output directory: `/`
   - Click **Save and Deploy**

3. **Access your site**:
   - You'll get a URL like: `aroma-workshop.pages.dev`

---

## 🔄 Recreating a Deployment

If you need to recreate a deployment from scratch:

### For GitHub Pages:
1. Go to repository Settings → Pages
2. Change source to "None" and save
3. Wait a few seconds
4. Change back to "Deploy from a branch" → main → root
5. Save again

### For Vercel/Netlify/Cloudflare:
1. Delete the existing project/site
2. Create a new project and import the same repository
3. Deploy with the same settings

---

## 📝 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All files are committed to git
- [ ] `index.html` is in the root directory
- [ ] All JavaScript files are properly linked
- [ ] CSS file (`styles.css`) is properly linked
- [ ] Test locally using `./start-server.sh` or `python3 -m http.server 8000`
- [ ] Check browser console for any errors (F12 → Console)

---

## 🔧 Custom Domain Setup

### GitHub Pages:
1. Add a `CNAME` file in root with your domain: `yourdomain.com`
2. In repository Settings → Pages, add your custom domain
3. Configure DNS records as instructed

### Vercel/Netlify/Cloudflare:
- Go to project settings → Domains
- Add your custom domain
- Follow DNS configuration instructions

---

## 🐛 Troubleshooting

### Site not loading:
- Check that `index.html` is in the root directory
- Verify all file paths are relative (not absolute)
- Check browser console for 404 errors

### Changes not appearing:
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Wait a few minutes for CDN cache to clear
- Check deployment logs in your hosting platform

### JavaScript errors:
- Ensure all JS files are properly linked in HTML
- Check for CORS issues (shouldn't happen with static hosting)
- Verify file paths are correct

---

## 📊 Comparison

| Platform | Free Tier | Auto Deploy | Custom Domain | CDN | Best For |
|----------|-----------|-------------|---------------|-----|----------|
| GitHub Pages | ✅ | ✅ | ✅ | ✅ | Simple static sites |
| Vercel | ✅ | ✅ | ✅ | ✅ | Modern web apps |
| Netlify | ✅ | ✅ | ✅ | ✅ | Static sites + forms |
| Cloudflare Pages | ✅ | ✅ | ✅ | ✅ | Fast global CDN |

---

## 🎯 Recommended: GitHub Pages

Since your repository is already on GitHub, **GitHub Pages is the simplest option**:
- No additional accounts needed
- Free and reliable
- Automatic deployments on push
- Custom domain support

Just enable it in your repository settings!

