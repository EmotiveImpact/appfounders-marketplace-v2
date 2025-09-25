import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user data
const testUsers = [
  {
    email: 'developer@example.com',
    password: 'developer123',
    user_metadata: {
      role: 'developer',
      name: 'Test Developer'
    }
  },
  {
    email: 'tester@example.com',
    password: 'tester123',
    user_metadata: {
      role: 'tester',
      name: 'Test Tester'
    }
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    user_metadata: {
      role: 'admin',
      name: 'Test Admin'
    }
  }
];

// Function to create test users
export async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();
    
    if (existingUsers) {
      console.log(`User ${user.email} already exists, skipping...`);
      continue;
    }
    
    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: user.user_metadata
    });
    
    if (error) {
      console.error(`Error creating user ${user.email}:`, error.message);
    } else {
      console.log(`Created user ${user.email} with ID ${data.user.id}`);
    }
  }
  
  console.log('Finished creating test users');
}

// Export function to run from CLI or scripts
export async function seedUsers() {
  await createTestUsers();
  process.exit(0);
}

// Allow running directly with Node
if (require.main === module) {
  seedUsers().catch(console.error);
}
