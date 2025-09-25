#!/bin/bash

# Fix the sidebar imports and components in all pages except dashboard/layout.tsx
find src/app -path "src/app/dashboard/layout.tsx" -prune -o -name "*.tsx" -type f -exec sed -i '' '/import DashboardSidebar from/d' {} \;
find src/app -path "src/app/dashboard/layout.tsx" -prune -o -name "*.tsx" -type f -exec sed -i '' '/<DashboardSidebar \/>/d' {} \;

echo "DashboardSidebar imports and components removed from all pages except dashboard/layout.tsx"
