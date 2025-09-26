// Mock authentication for development and testing
export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'developer' | 'tester' | 'admin';
  avatar?: string;
}

// Mock users for development
export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'developer@example.com',
    name: 'John Developer',
    role: 'developer',
    avatar: '/avatars/developer.jpg'
  },
  {
    id: '2',
    email: 'tester@example.com',
    name: 'Jane Tester',
    role: 'tester',
    avatar: '/avatars/tester.jpg'
  },
  {
    id: '3',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    avatar: '/avatars/admin.jpg'
  }
];

// Mock authentication functions
export const mockAuth = {
  getCurrentUser: (): MockUser | null => {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('mockUser');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default to developer user for development
    return mockUsers[0];
  },

  login: (email: string, password: string): Promise<MockUser | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.email === email);
        if (user) {
          localStorage.setItem('mockUser', JSON.stringify(user));
          resolve(user);
        } else {
          resolve(null);
        }
      }, 1000);
    });
  },

  logout: (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem('mockUser');
        resolve();
      }, 500);
    });
  },

  switchUser: (userId: string): MockUser | null => {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      localStorage.setItem('mockUser', JSON.stringify(user));
      return user;
    }
    return null;
  }
};

// Hook for using mock auth
export const useMockAuth = () => {
  return {
    user: mockAuth.getCurrentUser(),
    login: mockAuth.login,
    logout: mockAuth.logout,
    switchUser: mockAuth.switchUser
  };
};

export default mockAuth;
