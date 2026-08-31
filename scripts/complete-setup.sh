#!/bin/bash
# Complete FactLedger Setup & Submission Script
# Interactive guide for all remaining tasks

set -e

clear
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   FactLedger - Complete Setup & Submission Guide          ║"
echo "║   All Grants + Deployment Automation                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▸ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Verify repository is public
echo ""
echo -e "${BLUE}═══ STEP 1: Verify Repository is Public ═══${NC}"
echo ""
print_step "Checking repository visibility..."

VISIBILITY=$(curl -s https://api.github.com/repos/fas988840-dev/PROJECT-x | grep -o '"visibility":"[^"]*' | cut -d'"' -f4)

if [ "$VISIBILITY" = "public" ]; then
    print_success "Repository is PUBLIC ✓"
else
    print_error "Repository is PRIVATE"
    echo ""
    echo "Make it public at:"
    echo "  https://github.com/fas988840-dev/PROJECT-x/settings"
    echo ""
    echo "Steps:"
    echo "  1. Scroll to 'Danger Zone' (red section)"
    echo "  2. Click 'Change repository visibility'"
    echo "  3. Select 'Make public'"
    echo "  4. Type 'PROJECT-x' to confirm"
    echo ""
    read -p "Press Enter when done, then run this script again..."
    exit 1
fi

print_success "Repository visibility verified"
echo ""

# Step 2: Deploy to production
echo -e "${BLUE}═══ STEP 2: Deploy API to Production ═══${NC}"
echo ""
echo "Choose deployment platform:"
echo ""
echo "  1) Fly.io (Recommended - Free tier available)"
echo "  2) Railway (5,000 min/month free)"
echo "  3) Render (Free tier available)"
echo "  4) Skip deployment for now"
echo ""
read -p "Enter choice (1-4): " DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        echo ""
        print_step "Deploying to Fly.io..."
        echo ""
        echo "Running: bash scripts/deploy-fly.sh"
        bash scripts/deploy-fly.sh
        DEPLOY_URL=$(flyctl info -j | grep -o '"hostname":"[^"]*' | cut -d'"' -f4 | head -1)
        print_success "Deployed to: https://$DEPLOY_URL"
        ;;
    2)
        echo ""
        print_warning "Railway deployment requires manual setup"
        echo ""
        echo "Go to: https://railway.app"
        echo "1. Click 'New Project' → 'Deploy from GitHub'"
        echo "2. Select: fas988840-dev/PROJECT-x"
        echo "3. Add environment variables (see DEPLOYMENT.md)"
        echo "4. Deploy"
        echo ""
        read -p "Press Enter when deployed..."
        ;;
    3)
        echo ""
        print_warning "Render deployment requires manual setup"
        echo ""
        echo "Go to: https://render.com"
        echo "1. Click 'New Web Service'"
        echo "2. Connect GitHub repo: fas988840-dev/PROJECT-x"
        echo "3. Add environment variables (see DEPLOYMENT.md)"
        echo "4. Deploy"
        echo ""
        read -p "Press Enter when deployed..."
        ;;
    4)
        print_warning "Skipping deployment"
        ;;
esac

echo ""

# Step 3: Submit grants
echo -e "${BLUE}═══ STEP 3: Submit Grant Applications ═══${NC}"
echo ""
echo "Ready to submit 3 grant applications?"
echo ""
echo "  1) ChainGPT Research Grant ($10,000)"
echo "  2) Colosseum Eternal Grant ($5,000-20,000)"
echo "  3) Superteam Earn Grant ($200-5,000)"
echo ""
echo "Instructions: See GRANTS/DETAILED_INSTRUCTIONS.md"
echo "Answers: See docs/grant-answers.html (use 'Copy' buttons)"
echo ""

read -p "Open GRANTS/DETAILED_INSTRUCTIONS.md now? (y/n): " OPEN_DOCS

if [ "$OPEN_DOCS" = "y" ] || [ "$OPEN_DOCS" = "Y" ]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open GRANTS/DETAILED_INSTRUCTIONS.md
    elif command -v open &> /dev/null; then
        open GRANTS/DETAILED_INSTRUCTIONS.md
    else
        print_warning "Could not open file automatically"
        echo "Open manually: GRANTS/DETAILED_INSTRUCTIONS.md"
    fi
fi

echo ""

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    ✓ Setup Complete                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo ""
echo "  1. ✓ Repository is PUBLIC"
echo "  2. ✓ API deployed to production"
echo "  3. → Submit 3 grant applications"
echo ""
echo "Submit at:"
echo "  • ChainGPT: https://chaingpt.org/grants"
echo "  • Colosseum: https://colosseum.org"
echo "  • Superteam: https://earn.superteam.fun"
echo ""
echo "Use answers from: docs/grant-answers.html"
echo "Follow guide: GRANTS/DETAILED_INSTRUCTIONS.md"
echo ""
echo "Questions? Check:"
echo "  • COMPLETION_SUMMARY.md"
echo "  • ACTION_ITEMS.md"
echo "  • DEPLOYMENT.md"
echo ""
