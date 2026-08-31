#!/bin/bash
# Deploy to Fly.io - Automated Script
# Usage: bash scripts/deploy-fly.sh

set -e

echo "🚀 FactLedger Fly.io Deployment Script"
echo "======================================"
echo ""

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed"
    echo "Install it from: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

echo "✅ flyctl is installed"
echo ""

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io"
    echo "Run: flyctl auth login"
    exit 1
fi

echo "✅ Logged in to Fly.io"
echo ""

# Check if app exists
APP_NAME="factledger-$(date +%s | tail -c 4)"

echo "📝 Creating new Fly.io app..."
echo "App name: $APP_NAME"
echo ""

# Create fly.toml if it doesn't exist
if [ ! -f "fly.toml" ]; then
    echo "[build]
  builder = \"heroku\"

[env]
  SOLANA_RPC_URL = \"https://api.mainnet-beta.solana.com\"
  PORT = \"3000\"
  CORS_ORIGIN = \"*\"
  NODE_ENV = \"production\"

[[services]]
  internal_port = 3000
  protocol = \"tcp\"

[[services.ports]]
  port = 80
  handlers = [\"http\"]

[[services.ports]]
  port = 443
  handlers = [\"tls\", \"http\"]" > fly.toml
fi

echo "✅ fly.toml configured"
echo ""

# Set secrets
echo "🔐 Setting environment variables..."
flyctl secrets set \
  SOLANA_RPC_URL="https://api.mainnet-beta.solana.com" \
  CORS_ORIGIN="*" \
  PORT="3000" \
  NODE_ENV="production"

echo "✅ Environment variables set"
echo ""

# Deploy
echo "🚀 Deploying to Fly.io..."
flyctl deploy --app "$APP_NAME"

echo ""
echo "✅ Deployment complete!"
echo ""

# Get the URL
URL=$(flyctl info -a "$APP_NAME" --json | grep -o '"hostname":"[^"]*' | cut -d'"' -f4)

echo "📍 Your API is live at: https://$URL"
echo ""
echo "Test it:"
echo "  curl https://$URL/api/v1/health"
echo ""
echo "View logs:"
echo "  flyctl logs -a $APP_NAME"
