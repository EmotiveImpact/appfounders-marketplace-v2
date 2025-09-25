# Migration Guide: Supabase → Neon

## Step 1: Create Neon Account & Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string

## Step 2: Install Dependencies

```bash
npm install @neondatabase/serverless
npm install drizzle-orm drizzle-kit
npm install @types/bcryptjs bcryptjs
```

## Step 3: Update Environment Variables

Replace in `.env.local`:
```env
# Remove Supabase variables
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Add Neon variables
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Step 4: Database Schema Migration

Create the same tables in Neon:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'tester',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps table
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

-- Purchases table
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

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  app_id UUID REFERENCES apps(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 5: Benefits of This Migration

✅ **Cost**: Completely free for development and small production
✅ **Performance**: Serverless with instant scaling
✅ **Developer Experience**: Database branching for safe migrations
✅ **Compatibility**: Same PostgreSQL, minimal code changes
✅ **Reliability**: Built on AWS with 99.95% uptime SLA

## Step 6: Authentication Strategy

Since we're moving away from Supabase Auth, use:
- **NextAuth.js** (already implemented)
- **Custom user management** with Neon
- **Email verification** with SendGrid/Resend
