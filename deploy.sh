#!/bin/bash

# Deployment script for Aromatherapy Workshop
# This script helps you deploy to GitHub Pages

echo "=========================================="
echo "   Aromatherapy Workshop - Deployment"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository"
    echo "   Please initialize git first: git init"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"
echo ""

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="Deploy updates"
        fi
        git add .
        git commit -m "$COMMIT_MSG"
        echo "✅ Changes committed"
    else
        echo "❌ Deployment cancelled. Please commit or stash your changes first."
        exit 1
    fi
fi

# Check remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: No remote repository configured"
    echo "   Please add a remote: git remote add origin <your-repo-url>"
    exit 1
fi

echo "📍 Remote repository: $REMOTE_URL"
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
if git push origin $CURRENT_BRANCH; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Go to: https://github.com/ireneh27/Aroma-Workshop/settings/pages"
    echo "   2. Under 'Source', select 'Deploy from a branch'"
    echo "   3. Choose branch: $CURRENT_BRANCH"
    echo "   4. Choose folder: / (root)"
    echo "   5. Click 'Save'"
    echo ""
    echo "🌐 Your site will be available at:"
    echo "   https://ireneh27.github.io/Aroma-Workshop/"
    echo ""
    echo "⏱️  It may take 1-2 minutes for the site to be live"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "   Please check your git configuration and try again"
    exit 1
fi

echo "=========================================="

