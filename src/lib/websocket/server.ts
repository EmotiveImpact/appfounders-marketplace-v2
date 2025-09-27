import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import jwt from 'jsonwebtoken';
import { neonClient } from '@/lib/database/neon-client';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  authenticated?: boolean;
}

// Event types for real-time updates
export enum EventTypes {
  // User events
  USER_REGISTERED = 'user:registered',
  USER_VERIFIED = 'user:verified',
  USER_ACTIVITY = 'user:activity',
  
  // App events
  APP_SUBMITTED = 'app:submitted',
  APP_APPROVED = 'app:approved',
  APP_REJECTED = 'app:rejected',
  APP_UPDATED = 'app:updated',
  
  // Purchase events
  PURCHASE_COMPLETED = 'purchase:completed',
  PURCHASE_REFUNDED = 'purchase:refunded',
  
  // Review events
  REVIEW_SUBMITTED = 'review:submitted',
  REVIEW_MODERATED = 'review:moderated',
  
  // Analytics events
  ANALYTICS_UPDATE = 'analytics:update',
  METRICS_UPDATE = 'metrics:update',
  
  // System events
  SYSTEM_ALERT = 'system:alert',
  MAINTENANCE_MODE = 'system:maintenance',
}

class WebSocketServer {
  private io: SocketIOServer | null = null;
  private server: any = null;

  async initialize() {
    try {
      await app.prepare();

      this.server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
      });

      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        path: '/api/socket',
      });

      this.setupEventHandlers();
      this.setupPeriodicUpdates();

      this.server.listen(port, () => {
        console.log(`> WebSocket server ready on http://${hostname}:${port}`);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
        
        if (!decoded.sub) {
          return next(new Error('Invalid token'));
        }

        // Get user details from database
        const userQuery = // await neonClient.sql(
          'SELECT id, email, role, name FROM users WHERE id = $1',
          [decoded.sub]
        );

        if (userQuery.length === 0) {
          return next(new Error('User not found'));
        }

        const user = userQuery[0];
        socket.userId = user.id;
        socket.userRole = user.role;
        socket.authenticated = true;

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with role ${socket.userRole}`);

      // Join role-based rooms
      if (socket.userRole === 'admin') {
        socket.join('admins');
        socket.join('analytics');
      } else if (socket.userRole === 'developer') {
        socket.join('developers');
        socket.join(`developer:${socket.userId}`);
      } else {
        socket.join('users');
        socket.join(`user:${socket.userId}`);
      }

      // Handle analytics subscription
      socket.on('subscribe:analytics', (data) => {
        if (socket.userRole === 'admin') {
          socket.join('analytics:platform');
        } else if (socket.userRole === 'developer') {
          socket.join(`analytics:developer:${socket.userId}`);
        }
      });

      // Handle real-time analytics requests
      socket.on('request:analytics', async (data) => {
        try {
          const analytics = await this.getAnalyticsData(socket.userId!, socket.userRole!, data);
          socket.emit('analytics:data', analytics);
        } catch (error) {
          socket.emit('analytics:error', { error: 'Failed to fetch analytics' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });
    });
  }

  private setupPeriodicUpdates() {
    if (!this.io) return;

    // Send analytics updates every 30 seconds
    setInterval(async () => {
      try {
        // Platform analytics for admins
        const platformAnalytics = await this.getPlatformAnalytics();
        this.io!.to('analytics:platform').emit(EventTypes.ANALYTICS_UPDATE, {
          type: 'platform',
          data: platformAnalytics,
          timestamp: new Date().toISOString(),
        });

        // Developer analytics
        const developers = await this.getActiveDevelopers();
        for (const developer of developers) {
          const developerAnalytics = await this.getDeveloperAnalytics(developer.id);
          this.io!.to(`analytics:developer:${developer.id}`).emit(EventTypes.ANALYTICS_UPDATE, {
            type: 'developer',
            data: developerAnalytics,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error sending periodic analytics updates:', error);
      }
    }, 30000);

    // Send metrics updates every 10 seconds
    setInterval(async () => {
      try {
        const metrics = await this.getRealtimeMetrics();
        this.io!.to('analytics').emit(EventTypes.METRICS_UPDATE, {
          data: metrics,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error sending metrics updates:', error);
      }
    }, 10000);
  }

  // Public methods for emitting events
  public emitToUser(userId: string, event: EventTypes, data: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  public emitToDeveloper(developerId: string, event: EventTypes, data: any) {
    if (!this.io) return;
    this.io.to(`developer:${developerId}`).emit(event, data);
  }

  public emitToAdmins(event: EventTypes, data: any) {
    if (!this.io) return;
    this.io.to('admins').emit(event, data);
  }

  public emitToAll(event: EventTypes, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Analytics data methods
  private async getAnalyticsData(userId: string, userRole: string, params: any) {
    const timeframe = params.timeframe || '24h';
    
    if (userRole === 'admin') {
      return await this.getPlatformAnalytics(timeframe);
    } else if (userRole === 'developer') {
      return await this.getDeveloperAnalytics(userId, timeframe);
    } else {
      return await this.getUserAnalytics(userId, timeframe);
    }
  }

  private async getPlatformAnalytics(timeframe = '24h') {
    const timeInterval = this.getTimeInterval(timeframe);
    
    const queries = await Promise.all([
      // Active users
      neonClient.sql(`
        SELECT COUNT(DISTINCT user_id) as active_users
        FROM user_activity_logs
        WHERE created_at >= ${timeInterval}
      `),
      
      // Recent purchases
      neonClient.sql(`
        SELECT 
          COUNT(*) as purchase_count,
          SUM(amount) as total_revenue
        FROM purchases
        WHERE created_at >= ${timeInterval} AND status = 'completed'
      `),
      
      // App submissions
      neonClient.sql(`
        SELECT 
          COUNT(*) as submissions,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_review
        FROM apps
        WHERE submitted_at >= ${timeInterval}
      `),
    ]);

    return {
      active_users: queries[0][0]?.active_users || 0,
      purchases: queries[1][0] || { purchase_count: 0, total_revenue: 0 },
      submissions: queries[2][0] || { submissions: 0, pending_review: 0 },
    };
  }

  private async getDeveloperAnalytics(developerId: string, timeframe = '24h') {
    const timeInterval = this.getTimeInterval(timeframe);
    
    const queries = await Promise.all([
      // Developer sales
      neonClient.sql(`
        SELECT 
          COUNT(p.id) as sales_count,
          SUM(p.developer_payout) as earnings
        FROM purchases p
        JOIN apps a ON p.app_id = a.id
        WHERE a.developer_id = $1 AND p.created_at >= ${timeInterval} AND p.status = 'completed'
      `, [developerId]),
      
      // App performance
      neonClient.sql(`
        SELECT 
          COUNT(*) as total_apps,
          AVG(rating_average) as avg_rating
        FROM apps
        WHERE developer_id = $1 AND status = 'approved'
      `, [developerId]),
    ]);

    return {
      sales: queries[0][0] || { sales_count: 0, earnings: 0 },
      apps: queries[1][0] || { total_apps: 0, avg_rating: 0 },
    };
  }

  private async getUserAnalytics(userId: string, timeframe = '24h') {
    const timeInterval = this.getTimeInterval(timeframe);
    
    const query = // await neonClient.sql(`
      SELECT 
        COUNT(DISTINCT ual.id) as activity_count,
        COUNT(DISTINCT p.id) as purchase_count
      FROM user_activity_logs ual
      LEFT JOIN purchases p ON ual.user_id = p.user_id AND p.created_at >= ${timeInterval}
      WHERE ual.user_id = $1 AND ual.created_at >= ${timeInterval}
    `, [userId]);

    return query[0] || { activity_count: 0, purchase_count: 0 };
  }

  private async getActiveDevelopers() {
    return // await neonClient.sql(`
      SELECT DISTINCT u.id
      FROM users u
      JOIN apps a ON u.id = a.developer_id
      WHERE u.role = 'developer' AND a.status = 'approved'
    `);
  }

  private async getRealtimeMetrics() {
    const queries = await Promise.all([
      // Current online users (approximate)
      neonClient.sql(`
        SELECT COUNT(DISTINCT user_id) as online_users
        FROM user_activity_logs
        WHERE created_at >= NOW() - INTERVAL '5 minutes'
      `),
      
      // Recent activity
      neonClient.sql(`
        SELECT 
          action,
          COUNT(*) as count
        FROM user_activity_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY action
        ORDER BY count DESC
        LIMIT 5
      `),
    ]);

    return {
      online_users: queries[0][0]?.online_users || 0,
      recent_activity: queries[1],
    };
  }

  private getTimeInterval(timeframe: string): string {
    switch (timeframe) {
      case '1h': return "NOW() - INTERVAL '1 hour'";
      case '24h': return "NOW() - INTERVAL '24 hours'";
      case '7d': return "NOW() - INTERVAL '7 days'";
      case '30d': return "NOW() - INTERVAL '30 days'";
      default: return "NOW() - INTERVAL '24 hours'";
    }
  }
}

// Export singleton instance
export const websocketServer = new WebSocketServer();

// Event emitter functions for use throughout the application
export const emitUserEvent = (userId: string, event: EventTypes, data: any) => {
  websocketServer.emitToUser(userId, event, data);
};

export const emitDeveloperEvent = (developerId: string, event: EventTypes, data: any) => {
  websocketServer.emitToDeveloper(developerId, event, data);
};

export const emitAdminEvent = (event: EventTypes, data: any) => {
  websocketServer.emitToAdmins(event, data);
};

export const emitSystemEvent = (event: EventTypes, data: any) => {
  websocketServer.emitToAll(event, data);
};
