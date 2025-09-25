#!/bin/bash

# Fix the footer imports and components in all pages
find src/app -name "*.tsx" -type f -exec sed -i '' '/import Footer from/d' {} \;
find src/app -name "*.tsx" -type f -exec sed -i '' '/<Footer \/>/d' {} \;

echo "Footer imports and components removed from all pages"
