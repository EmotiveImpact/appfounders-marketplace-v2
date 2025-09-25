#!/bin/bash

# Fix the tester page
sed -i '' '/import Navbar from/d' src/app/dashboard/tester/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/tester/page.tsx

# Fix the tester feedback id page
sed -i '' '/import Navbar from/d' src/app/dashboard/tester/feedback/\[id\]/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/tester/feedback/\[id\]/page.tsx

# Fix the tester apps id page
sed -i '' '/import Navbar from/d' src/app/dashboard/tester/apps/\[id\]/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/tester/apps/\[id\]/page.tsx

# Fix the developer apps page
sed -i '' '/import Navbar from/d' src/app/dashboard/developer/apps/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/developer/apps/page.tsx

# Fix the developer apps create page
sed -i '' '/import Navbar from/d' src/app/dashboard/developer/apps/create/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/developer/apps/create/page.tsx

# Fix the marketplace id page
sed -i '' '/import Navbar from/d' src/app/marketplace/\[id\]/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/marketplace/\[id\]/page.tsx

# Fix the developer page
sed -i '' '/import Navbar from/d' src/app/dashboard/developer/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/dashboard/developer/page.tsx

# Fix the marketplace page
sed -i '' '/import Navbar from/d' src/app/marketplace/page.tsx
sed -i '' '/<Navbar \/>/d' src/app/marketplace/page.tsx

echo "Navbar imports and components removed from all pages"
