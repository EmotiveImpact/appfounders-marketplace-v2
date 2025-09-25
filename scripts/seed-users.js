// This script is used to create test users in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

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
async function createTestUsers() {
  console.log('Creating test users...');
  
  for (const user of testUsers) {
    try {
      // Create user with sign up
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: user.user_metadata
        }
      });
      
      if (error) {
        console.error(`Error creating user ${user.email}:`, error.message);
      } else {
        console.log(`Created user ${user.email} with ID ${data.user?.id || 'unknown'}`);
        
        // Auto-confirm the email if needed
        if (data.user && !data.user.email_confirmed_at) {
          console.log(`Auto-confirming email for ${user.email}...`);
          // Note: This requires admin privileges which might not be available
          // In a real scenario, you'd need to use the admin API or manually confirm in Supabase dashboard
        }
      }
    } catch (err) {
      console.error(`Unexpected error creating user ${user.email}:`, err);
    }
  }
  
  console.log('Finished creating test users');
}

// Run the script
createTestUsers()
  .catch(console.error)
  .finally(() => {
    console.log('Script completed');
    process.exit(0);
  });
