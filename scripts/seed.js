const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123!', 12);
    await sql`
      INSERT INTO users (id, email, name, role, password_hash, email_verified)
      VALUES (
        'admin-user-id',
        'admin@appfounders.com',
        'Admin User',
        'admin',
        ${adminPassword},
        true
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Admin user created');
    
    // Create sample developer
    const devPassword = await bcrypt.hash('dev123!', 12);
    await sql`
      INSERT INTO users (id, email, name, role, password_hash, email_verified)
      VALUES (
        'dev-user-id',
        'developer@appfounders.com',
        'Sample Developer',
        'developer',
        ${devPassword},
        true
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Sample developer created');
    
    // Create sample tester
    const testerPassword = await bcrypt.hash('tester123!', 12);
    await sql`
      INSERT INTO users (id, email, name, role, password_hash, email_verified)
      VALUES (
        'tester-user-id',
        'tester@appfounders.com',
        'Sample Tester',
        'tester',
        ${testerPassword},
        true
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Sample tester created');
    
    // Create sample apps
    await sql`
      INSERT INTO apps (
        id, name, description, short_description, price, developer_id,
        category, platforms, status, version
      )
      VALUES (
        'app-1-id',
        'Task Manager Pro',
        'A comprehensive task management application with advanced features for productivity.',
        'Professional task management with reminders and collaboration.',
        2999,
        'dev-user-id',
        'Productivity',
        ARRAY['iOS', 'Android', 'Web'],
        'approved',
        '1.0.0'
      ),
      (
        'app-2-id',
        'Photo Editor Plus',
        'Advanced photo editing software with professional-grade tools and filters.',
        'Professional photo editing with AI-powered features.',
        4999,
        'dev-user-id',
        'Graphics',
        ARRAY['iOS', 'Android'],
        'approved',
        '2.1.0'
      ),
      (
        'app-3-id',
        'Budget Tracker',
        'Personal finance management app with expense tracking and budget planning.',
        'Simple and effective personal finance management.',
        1999,
        'dev-user-id',
        'Finance',
        ARRAY['iOS', 'Android', 'Web'],
        'approved',
        '1.5.2'
      )
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('✅ Sample apps created');
    
    // Create sample categories
    await sql`
      INSERT INTO categories (name, description, icon, color)
      VALUES 
        ('Productivity', 'Apps to boost your productivity', 'briefcase', 'blue'),
        ('Graphics', 'Photo and video editing tools', 'image', 'purple'),
        ('Finance', 'Personal and business finance apps', 'dollar-sign', 'green'),
        ('Education', 'Learning and educational tools', 'book', 'orange'),
        ('Health', 'Health and fitness applications', 'heart', 'red'),
        ('Games', 'Entertainment and gaming apps', 'gamepad-2', 'pink'),
        ('Utilities', 'System and utility applications', 'settings', 'gray'),
        ('Social', 'Social networking and communication', 'users', 'indigo')
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Categories created');
    
    // Create sample badges
    await sql`
      INSERT INTO badges (name, description, icon, color, rarity, criteria, bonus_points)
      VALUES 
        ('Early Adopter', 'One of the first 100 users', 'star', 'gold', 'rare', '{"type": "user_count", "threshold": 100}', 50),
        ('App Reviewer', 'Left 10 helpful reviews', 'message-square', 'blue', 'common', '{"type": "review_count", "threshold": 10}', 25),
        ('Developer Friend', 'Purchased from 5 different developers', 'users', 'green', 'common', '{"type": "developer_count", "threshold": 5}', 30),
        ('Big Spender', 'Spent over $100 on apps', 'credit-card', 'purple', 'epic', '{"type": "total_spent", "threshold": 10000}', 100),
        ('Community Helper', 'Active in forums for 30 days', 'help-circle', 'orange', 'rare', '{"type": "forum_activity", "threshold": 30}', 75)
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Badges created');
    
    // Create sample forum categories
    await sql`
      INSERT INTO forum_categories (name, description, icon, color)
      VALUES 
        ('General Discussion', 'General topics and discussions', 'message-circle', 'blue'),
        ('Feature Requests', 'Suggest new features for apps', 'lightbulb', 'yellow'),
        ('Bug Reports', 'Report issues and bugs', 'bug', 'red'),
        ('App Showcase', 'Developers showcase their apps', 'star', 'purple'),
        ('Developer Help', 'Get help with development', 'code', 'green'),
        ('Tester Feedback', 'Feedback from beta testers', 'clipboard', 'orange'),
        ('Announcements', 'Official platform announcements', 'megaphone', 'indigo'),
        ('Marketplace', 'Discuss marketplace features', 'shopping-cart', 'pink')
      ON CONFLICT (name) DO NOTHING
    `;
    console.log('✅ Forum categories created');
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('📋 Test Accounts Created:');
    console.log('  Admin: admin@appfounders.com / admin123!');
    console.log('  Developer: developer@appfounders.com / dev123!');
    console.log('  Tester: tester@appfounders.com / tester123!');
    console.log('');
    console.log('🚀 You can now start the development server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
