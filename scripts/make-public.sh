#!/bin/bash
# Make repository public using GitHub CLI
# Requires: gh CLI installed and authenticated
# Usage: bash scripts/make-public.sh

set -e

echo "🔓 Making repository public..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo ""
    echo "Install it from: https://cli.github.com"
    echo ""
    echo "Or go to GitHub Settings manually:"
    echo "https://github.com/fas988840-dev/PROJECT-x/settings"
    echo "  → Danger Zone → Change repository visibility → Make public"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is authenticated"
echo ""

# Make repository public
echo "📝 Changing repository visibility..."
gh repo edit fas988840-dev/PROJECT-x --visibility public

echo ""
echo "✅ Repository is now PUBLIC!"
echo ""
echo "Verify at: https://github.com/fas988840-dev/PROJECT-x"
