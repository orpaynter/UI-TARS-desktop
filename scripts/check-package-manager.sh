#!/bin/bash

# check-package-manager.sh
# This script checks if npm commands are being used instead of pnpm in critical build scripts

echo "🔍 Checking for npm command usage in critical build scripts..."

# Find npm run commands in main build/dev scripts (excluding prepare hooks and node_modules)
# Look for scripts that start with npm run (not pnpm run)
critical_npm_usage=$(grep -r '"npm run' --include="package.json" --exclude-dir=node_modules . | \
    grep -v renderer/node_modules | \
    grep -v '"prepare":' | \
    grep -v '"prepublishOnly":' | \
    grep -E '("build":|"dev":|"start":|"test":|"typecheck":|"publish":)')

if [ -n "$critical_npm_usage" ]; then
    echo "❌ Found npm commands in critical build scripts:"
    echo "$critical_npm_usage"
    echo ""
    echo "Please replace 'npm run' with 'pnpm run' for consistency."
    echo "See PACKAGE_MANAGER.md for guidelines."
    exit 1
else
    echo "✅ No npm commands found in critical build scripts. Good job!"
fi

# Check if npm lockfile exists in root
if [ -f "package-lock.json" ]; then
    echo "❌ Found package-lock.json file in root. This suggests npm was used."
    echo "Please remove it and use pnpm-lock.yaml instead."
    exit 1
fi

# Check if yarn lockfile exists in root
if [ -f "yarn.lock" ]; then
    echo "❌ Found yarn.lock file in root. This suggests yarn was used."
    echo "Please remove it and use pnpm-lock.yaml instead."
    exit 1
fi

echo "✅ Package manager check passed!"