import { neon } from '@neondatabase/serverless';

// Create Neon client
const sql = neon(process.env.DATABASE_URL!);

// Database client wrapper
export class DatabaseClient {
  private sql = sql;

  // User operations
  async createUser(userData: {
    email: string;
    name: string;
    role: string;
    passwordHash: string;
  }) {
    const { email, name, role, passwordHash } = userData;
    
    const result = await this.sql`
      INSERT INTO users (email, name, role, password_hash)
      VALUES (${email}, ${name}, ${role}, ${passwordHash})
      RETURNING id, email, name, role, created_at
    `;
    
    return result[0];
  }

  async getUserByEmail(email: string) {
    const result = await this.sql`
      SELECT id, email, name, role, password_hash, created_at, updated_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `;
    
    return result[0] || null;
  }

  async getUserById(id: string) {
    const result = await this.sql`
      SELECT id, email, name, role, avatar_url, created_at, updated_at
      FROM users 
      WHERE id = ${id}
      LIMIT 1
    `;
    
    return result[0] || null;
  }

  async updateUser(id: string, updates: Partial<{
    name: string;
    avatar_url: string;
    role: string;
  }>) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await this.sql`
      UPDATE users 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, name, role, avatar_url, updated_at
    `;
    
    return result[0];
  }

  // App operations
  async createApp(appData: {
    name: string;
    description: string;
    price: number;
    developer_id: string;
    image_url?: string;
    download_url?: string;
  }) {
    const { name, description, price, developer_id, image_url, download_url } = appData;
    
    const result = await this.sql`
      INSERT INTO apps (name, description, price, developer_id, image_url, download_url)
      VALUES (${name}, ${description}, ${price}, ${developer_id}, ${image_url || null}, ${download_url || null})
      RETURNING *
    `;
    
    return result[0];
  }

  async getAppById(id: string) {
    const result = await this.sql`
      SELECT a.*, u.name as developer_name, u.email as developer_email
      FROM apps a
      LEFT JOIN users u ON a.developer_id = u.id
      WHERE a.id = ${id}
      LIMIT 1
    `;
    
    return result[0] || null;
  }

  async getApps(filters: {
    status?: string;
    developer_id?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status = 'approved', developer_id, limit = 20, offset = 0 } = filters;
    
    let query = `
      SELECT a.*, u.name as developer_name, u.email as developer_email
      FROM apps a
      LEFT JOIN users u ON a.developer_id = u.id
      WHERE a.status = ${status}
    `;
    
    if (developer_id) {
      query += ` AND a.developer_id = ${developer_id}`;
    }
    
    query += ` ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    return await this.sql.unsafe(query);
  }

  async updateApp(id: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    image_url: string;
    download_url: string;
    status: string;
    purchase_count: number;
    total_revenue: number;
  }>) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
      .join(', ');
    
    const values = [id, ...Object.values(updates)];
    
    const result = await this.sql`
      UPDATE apps 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return result[0];
  }

  // Purchase operations
  async createPurchase(purchaseData: {
    user_id: string;
    app_id: string;
    developer_id: string;
    amount: number;
    platform_fee: number;
    developer_payout: number;
    stripe_session_id?: string;
    stripe_payment_intent_id?: string;
  }) {
    const result = await this.sql`
      INSERT INTO purchases (
        user_id, app_id, developer_id, amount, platform_fee, 
        developer_payout, stripe_session_id, stripe_payment_intent_id, status
      )
      VALUES (
        ${purchaseData.user_id}, ${purchaseData.app_id}, ${purchaseData.developer_id},
        ${purchaseData.amount}, ${purchaseData.platform_fee}, ${purchaseData.developer_payout},
        ${purchaseData.stripe_session_id || null}, ${purchaseData.stripe_payment_intent_id || null},
        'completed'
      )
      RETURNING *
    `;
    
    return result[0];
  }

  async getUserPurchases(userId: string) {
    const result = await this.sql`
      SELECT p.*, a.name as app_name, a.image_url as app_image
      FROM purchases p
      LEFT JOIN apps a ON p.app_id = a.id
      WHERE p.user_id = ${userId} AND p.status = 'completed'
      ORDER BY p.purchased_at DESC
    `;
    
    return result;
  }

  async hasUserPurchasedApp(userId: string, appId: string): Promise<boolean> {
    const result = await this.sql`
      SELECT id FROM purchases 
      WHERE user_id = ${userId} AND app_id = ${appId} AND status = 'completed'
      LIMIT 1
    `;
    
    return result.length > 0;
  }

  // Review operations
  async createReview(reviewData: {
    user_id: string;
    app_id: string;
    rating: number;
    comment: string;
  }) {
    const result = await this.sql`
      INSERT INTO reviews (user_id, app_id, rating, comment)
      VALUES (${reviewData.user_id}, ${reviewData.app_id}, ${reviewData.rating}, ${reviewData.comment})
      RETURNING *
    `;
    
    return result[0];
  }

  async getAppReviews(appId: string) {
    const result = await this.sql`
      SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.app_id = ${appId}
      ORDER BY r.created_at DESC
    `;
    
    return result;
  }
}

// Export singleton instance
export const db = new DatabaseClient();
