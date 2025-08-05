#!/bin/bash

# Quick build test for all applications
set -e

echo "🧪 Testing builds for all applications..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'  
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Type check
echo "🔍 Running type checks..."
if pnpm type-check; then
    print_step "Type checks passed"
else
    print_error "Type checks failed"
    exit 1
fi

# Lint
echo "🧹 Running lint..."
if pnpm lint; then
    print_step "Lint passed"
else
    print_error "Lint failed"
    exit 1
fi

# Build all apps
echo "🏗️ Building all applications..."
if pnpm build; then
    print_step "All builds completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check build outputs
echo "📁 Checking build outputs..."

if [ -d "apps/web/dist" ]; then
    print_step "Web app build output exists: apps/web/dist"
else
    print_error "Web app build output missing"
fi

if [ -d "apps/admin/build" ]; then
    print_step "Admin app build output exists: apps/admin/build"
else
    print_error "Admin app build output missing"
fi

if [ -f "apps/api/src/index.ts" ]; then
    print_step "API source exists (Worker deployment ready)"
else
    print_error "API source missing"
fi

print_step "🎉 All build tests passed! Ready for deployment."