# 🚀 **AppFounders Deployment Checklist**

## ✅ **Pre-Deployment Checklist**

### **1. Environment Variables Setup**
Create `.env.example` for team reference:
```env
# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-app.vercel.app

# Neon Database
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_webhook_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=appfounders-uploads
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=appfounders-uploads
NEXT_PUBLIC_AWS_REGION=us-east-1

# MongoDB (for Payload CMS)
MONGODB_URI=your_mongodb_connection_string

# Payload CMS
PAYLOAD_SECRET=your_payload_secret
PAYLOAD_PUBLIC_SERVER_URL=https://your-app.vercel.app
PAYLOAD_PUBLIC_SITE_URL=https://your-app.vercel.app
PAYLOAD_CONFIG_PATH=src/lib/payload/payload.config.ts
```

### **2. Build Configuration**
Ensure `package.json` has correct scripts:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev",
    "lint": "next lint"
  }
}
```

### **3. Vercel Configuration**
Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## 🔄 **Deployment Workflow**

### **Step 1: Git Setup & Push**
```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: AppFounders marketplace platform"

# Push to GitHub
git remote add origin https://github.com/yourusername/appfounders.git
git branch -M main
git push -u origin main
```

### **Step 2: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Click "Deploy"

### **Step 3: Add Neon Database via Vercel**
1. In Vercel dashboard → Project → Integrations
2. Search for "Neon" and click "Add"
3. Authorize Neon integration
4. Create new database or connect existing
5. Vercel automatically adds `DATABASE_URL` to environment variables

### **Step 4: Configure Environment Variables**
In Vercel dashboard → Project → Settings → Environment Variables:
```
NEXTAUTH_SECRET=generate_new_secret
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# ... add all other variables
```

### **Step 5: Run Database Migrations**
After Neon is connected, run migrations:
```sql
-- Connect to your Neon database and run:
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'tester',
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  developer_id UUID REFERENCES users(id),
  image_url TEXT,
  download_url TEXT,
  purchase_count INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  app_id UUID REFERENCES apps(id),
  developer_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  developer_payout INTEGER NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  app_id UUID REFERENCES apps(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE download_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 **Post-Deployment Steps**

### **1. Test Core Functionality**
- [ ] User registration works
- [ ] User login works
- [ ] Marketplace loads
- [ ] Payment flow works (test mode)
- [ ] File uploads work

### **2. Configure Production Services**
- [ ] Set up production Stripe account
- [ ] Configure AWS S3 bucket
- [ ] Set up email service (SendGrid/Resend)
- [ ] Configure domain (optional)

### **3. Monitor & Scale**
- [ ] Set up Vercel Analytics
- [ ] Monitor Neon database usage
- [ ] Set up error tracking (Sentry)
- [ ] Configure alerts

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Build fails**: Check `npm install --legacy-peer-deps`
2. **Database connection**: Verify `DATABASE_URL` format
3. **Environment variables**: Ensure all required vars are set
4. **API routes timeout**: Increase function timeout in `vercel.json`

### **Quick Fixes:**
```bash
# If build fails, try:
npm install --legacy-peer-deps
npm run build

# If database connection fails:
# Check DATABASE_URL format in Vercel dashboard
```

## 🎉 **Success Metrics**

Your deployment is successful when:
- ✅ App loads at your Vercel URL
- ✅ Users can register and login
- ✅ Marketplace displays apps
- ✅ Payment flow works (test mode)
- ✅ No console errors in production

**Estimated deployment time: 30-45 minutes**
