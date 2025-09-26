import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Types
interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requiresAuth?: boolean;
  cache?: boolean;
  offline?: boolean;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.timeout = API_CONFIG.timeout;
    this.loadAuthToken();
  }

  // Load auth token from storage
  private async loadAuthToken(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.authToken = token;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  // Set auth token
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save auth token:', error);
    }
  }

  // Clear auth token
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear auth token:', error);
    }
  }

  // Check network connectivity
  private async isOnline(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  // Build request headers
  private buildHeaders(config: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AppFounders-Mobile/1.0.0',
      ...config.headers,
    };

    if (config.requiresAuth && this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Cache management
  private getCacheKey(url: string, method: string): string {
    return `api_cache_${method}_${url}`;
  }

  private async getCachedResponse<T>(cacheKey: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to get cached response:', error);
    }
    return null;
  }

  private async setCachedResponse(cacheKey: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  // Main request method
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(config);
    const cacheKey = this.getCacheKey(url, config.method);

    // Check for cached response if caching is enabled
    if (config.cache && config.method === 'GET') {
      const cached = await this.getCachedResponse<T>(cacheKey);
      if (cached) {
        return { data: cached, success: true };
      }
    }

    // Check network connectivity
    const isOnline = await this.isOnline();
    if (!isOnline && !config.offline) {
      throw new Error('No internet connection');
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (config.body && config.method !== 'GET') {
      requestOptions.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache successful GET responses
      if (config.cache && config.method === 'GET' && data.success) {
        await this.setCachedResponse(cacheKey, data.data);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Return cached data if available during offline mode
      if (!isOnline && config.cache) {
        const cached = await this.getCachedResponse<T>(cacheKey);
        if (cached) {
          return { data: cached, success: true };
        }
      }

      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, cache = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', cache });
  }

  async post<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, requiresAuth: true });
  }

  async put<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, requiresAuth: true });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', requiresAuth: true });
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, requiresAuth: true });
  }
}

// API Service Methods
export class ApiService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      await this.client.setAuthToken(response.data.token);
    }
    return response;
  }

  async register(userData: any) {
    return this.client.post('/auth/register', userData);
  }

  async logout() {
    await this.client.clearAuthToken();
    return this.client.post('/auth/logout');
  }

  async refreshToken() {
    return this.client.post('/auth/refresh');
  }

  // User Profile
  async getProfile() {
    return this.client.get('/user/profile', true);
  }

  async updateProfile(profileData: any) {
    return this.client.put('/user/profile', profileData);
  }

  // Apps
  async getApps(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.client.get(`/apps${query}`, true);
  }

  async getApp(id: string) {
    return this.client.get(`/apps/${id}`, true);
  }

  async purchaseApp(appId: string, paymentData: any) {
    return this.client.post(`/apps/${appId}/purchase`, paymentData);
  }

  // Reviews
  async getReviews(appId: string) {
    return this.client.get(`/apps/${appId}/reviews`, true);
  }

  async submitReview(appId: string, reviewData: any) {
    return this.client.post(`/apps/${appId}/reviews`, reviewData);
  }

  // Search
  async search(query: string, filters?: any) {
    const params = { q: query, ...filters };
    const queryString = new URLSearchParams(params).toString();
    return this.client.get(`/search?${queryString}`, true);
  }

  // Notifications
  async getNotifications() {
    return this.client.get('/notifications', true);
  }

  async markNotificationRead(id: string) {
    return this.client.patch(`/notifications/${id}`, { read: true });
  }

  // File Upload
  async uploadFile(file: any, type: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.client.request('/upload', {
      method: 'POST',
      body: formData,
      requiresAuth: true,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
