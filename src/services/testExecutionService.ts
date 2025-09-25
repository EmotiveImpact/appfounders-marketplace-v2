import { TestExecution } from '@/types/testExecution';

// Mock data for test executions
const mockTestExecutions: TestExecution[] = [
  {
    id: 'exec-001',
    testCase: {
      id: 'tc-001',
      title: 'User Login Authentication'
    },
    result: 'passed',
    duration: 45,
    notes: 'All test steps completed successfully',
    executedAt: '2025-03-05T14:30:00Z',
    executedBy: 'Jane Doe',
    environment: 'Staging'
  },
  {
    id: 'exec-002',
    testCase: {
      id: 'tc-002',
      title: 'User Registration Form Validation'
    },
    result: 'failed',
    duration: 120,
    notes: 'Email validation error not displaying correctly',
    executedAt: '2025-03-05T15:45:00Z',
    executedBy: 'Jane Doe',
    environment: 'Development'
  },
  {
    id: 'exec-003',
    testCase: {
      id: 'tc-003',
      title: 'Password Reset Functionality'
    },
    result: 'skipped',
    duration: 0,
    notes: 'Dependency on email service unavailable',
    executedAt: '2025-03-05T16:15:00Z',
    executedBy: 'John Smith',
    environment: 'Development'
  },
  {
    id: 'exec-004',
    testCase: {
      id: 'tc-004',
      title: 'Product Search Functionality'
    },
    result: 'passed',
    duration: 78,
    notes: 'Search results match expected output',
    executedAt: '2025-03-06T09:30:00Z',
    executedBy: 'Jane Doe',
    environment: 'Staging'
  },
  {
    id: 'exec-005',
    testCase: {
      id: 'tc-005',
      title: 'Checkout Process'
    },
    result: 'passed',
    duration: 210,
    notes: 'All payment methods working as expected',
    executedAt: '2025-03-06T10:15:00Z',
    executedBy: 'John Smith',
    environment: 'Production'
  }
];

export const testExecutionService = {
  /**
   * Get all test executions
   */
  async getTestExecutions(): Promise<TestExecution[]> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTestExecutions), 800);
    });
  },

  /**
   * Get a specific test execution by ID
   */
  async getTestExecutionById(id: string): Promise<TestExecution | null> {
    // Simulate API call
    return new Promise((resolve) => {
      const execution = mockTestExecutions.find(exec => exec.id === id) || null;
      setTimeout(() => resolve(execution), 500);
    });
  },

  /**
   * Create a new test execution
   */
  async createTestExecution(data: Omit<TestExecution, 'id' | 'executedAt'>): Promise<TestExecution> {
    // Simulate API call
    return new Promise((resolve) => {
      const newExecution: TestExecution = {
        ...data,
        id: `exec-${Math.random().toString(36).substring(2, 7)}`,
        executedAt: new Date().toISOString()
      };
      setTimeout(() => resolve(newExecution), 1000);
    });
  },

  /**
   * Update an existing test execution
   */
  async updateTestExecution(id: string, data: Partial<TestExecution>): Promise<TestExecution> {
    // Simulate API call
    return new Promise((resolve, reject) => {
      const executionIndex = mockTestExecutions.findIndex(exec => exec.id === id);
      if (executionIndex === -1) {
        reject(new Error('Test execution not found'));
        return;
      }
      
      const updatedExecution = {
        ...mockTestExecutions[executionIndex],
        ...data
      };
      
      setTimeout(() => resolve(updatedExecution), 800);
    });
  }
};
