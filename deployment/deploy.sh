#!/bin/bash

# Black Living E-commerce Deployment Script
# This script deploys the API, Web, and Admin applications

set -e

echo "🚀 Starting Black Living deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}📦 $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if environment is specified
ENVIRONMENT=${1:-production}
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment. Use: development, staging, or production"
    exit 1
fi

print_step "Deploying to $ENVIRONMENT environment"

# Install dependencies
print_step "Installing dependencies..."
pnpm install

# Run type checks and linting
print_step "Running type checks and linting..."
pnpm type-check
pnpm lint

# Build all applications
print_step "Building applications..."
pnpm build

# Deploy API first (required for web/admin auth)
print_step "Deploying API to Cloudflare Workers..."
cd apps/api
if [ "$ENVIRONMENT" = "production" ]; then
    pnpm wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
    pnpm wrangler deploy --env staging
else
    print_warning "Skipping API deployment for development environment"
fi
cd ../..

# Deploy Web application to Cloudflare Pages
print_step "Deploying Web application..."
cd apps/web
if [ "$ENVIRONMENT" = "production" ]; then
    pnpm wrangler pages deploy dist --project-name blackliving-web
elif [ "$ENVIRONMENT" = "staging" ]; then
    pnpm wrangler pages deploy dist --project-name blackliving-web-staging
else
    print_warning "Skipping Web deployment for development environment"
fi
cd ../..

# Deploy Admin application to Cloudflare Pages
print_step "Deploying Admin application..."
cd apps/admin
if [ "$ENVIRONMENT" = "production" ]; then
    pnpm wrangler pages deploy build/client --project-name blackliving-admin
elif [ "$ENVIRONMENT" = "staging" ]; then
    pnpm wrangler pages deploy build/client --project-name blackliving-admin-staging
else
    print_warning "Skipping Admin deployment for development environment"
fi
cd ../..

print_step "✅ Deployment complete!"

echo ""
echo "🌐 Application URLs:"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  Web:   https://blackliving.com"
    echo "  Admin: https://admin.blackliving.com"
    echo "  API:   https://api.blackliving.com"
elif [ "$ENVIRONMENT" = "staging" ]; then
    echo "  Web:   https://staging.blackliving.com"
    echo "  Admin: https://admin-staging.blackliving.com"
    echo "  API:   https://api-staging.blackliving.com"
fi
echo ""

print_step "Remember to set up custom domains in Cloudflare Pages if not already configured!"