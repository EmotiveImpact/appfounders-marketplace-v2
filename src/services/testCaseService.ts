// Test case service for handling test case-related operations
import { v4 as uuidv4 } from 'uuid';

// Test case priority types
export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';

// Test case status types
export type TestCaseStatus = 'pending' | 'in-progress' | 'passed' | 'failed' | 'blocked';

// Test execution result types
export type TestExecutionResult = 'passed' | 'failed' | 'blocked' | 'skipped';

// Test case interface
export interface TestCase {
  id: string;
  title: string;
  description: string;
  appId: string;
  appName: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  preconditions: string;
  steps: {
    stepNumber: number;
    description: string;
    expectedResult: string;
  }[];
  assignedTo: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  featureId?: string;
  tags: string[];
}

// Test execution interface
export interface TestExecution {
  id: string;
  testCaseId: string;
  result: TestExecutionResult;
  executedBy: {
    id: string;
    name: string;
  };
  executedAt: Date;
  duration: number; // in seconds
  notes: string;
  environment: {
    platform: string;
    version: string;
    deviceModel: string;
    osVersion: string;
    browser: string;
  };
  stepResults: {
    stepNumber: number;
    result: 'passed' | 'failed';
    notes: string;
  }[];
}

// Test case creation interface
export interface TestCaseCreateInput {
  title: string;
  description: string;
  appId: string;
  priority: TestCasePriority;
  preconditions: string;
  steps: {
    stepNumber: number;
    description: string;
    expectedResult: string;
  }[];
  projectId?: string;
  featureId?: string;
  tags: string[];
}

// Test execution creation interface
export interface TestExecutionCreateInput {
  testCaseId: string;
  result: TestExecutionResult;
  duration: number;
  notes: string;
  environment: {
    platform: string;
    version: string;
    deviceModel: string;
    osVersion: string;
    browser: string;
  };
  stepResults: {
    stepNumber: number;
    result: 'passed' | 'failed';
    notes: string;
  }[];
}

// Mock data for development
let mockTestCases: TestCase[] = [
  {
    id: 'tc1',
    title: 'Verify user login with valid credentials',
    description: 'Test the login functionality with valid username and password',
    appId: 'app1',
    appName: 'Finance Tracker',
    priority: 'high',
    status: 'pending',
    preconditions: 'User account exists in the system',
    steps: [
      {
        stepNumber: 1,
        description: 'Navigate to login screen',
        expectedResult: 'Login form is displayed'
      },
      {
        stepNumber: 2,
        description: 'Enter valid username and password',
        expectedResult: 'Credentials are accepted'
      },
      {
        stepNumber: 3,
        description: 'Click login button',
        expectedResult: 'User is logged in and redirected to dashboard'
      }
    ],
    assignedTo: {
      id: '1',
      name: 'John Doe'
    },
    createdBy: {
      id: '3',
      name: 'Bob Johnson'
    },
    createdAt: new Date('2023-05-01T09:00:00Z'),
    updatedAt: new Date('2023-05-01T09:00:00Z'),
    projectId: 'proj1',
    featureId: 'feat1',
    tags: ['login', 'authentication', 'smoke-test']
  },
  {
    id: 'tc2',
    title: 'Verify data synchronization between devices',
    description: 'Test that data changes are synchronized across multiple devices',
    appId: 'app2',
    appName: 'Task Manager',
    priority: 'medium',
    status: 'in-progress',
    preconditions: 'User has multiple devices with the app installed and is logged in on all devices',
    steps: [
      {
        stepNumber: 1,
        description: 'Add a new task on device A',
        expectedResult: 'Task is created successfully'
      },
      {
        stepNumber: 2,
        description: 'Wait for 30 seconds',
        expectedResult: 'Synchronization completes'
      },
      {
        stepNumber: 3,
        description: 'Check device B task list',
        expectedResult: 'New task appears in the task list'
      }
    ],
    assignedTo: {
      id: '2',
      name: 'Jane Smith'
    },
    createdBy: {
      id: '3',
      name: 'Bob Johnson'
    },
    createdAt: new Date('2023-05-02T11:30:00Z'),
    updatedAt: new Date('2023-05-02T11:30:00Z'),
    projectId: 'proj2',
    featureId: 'feat2',
    tags: ['sync', 'cross-device', 'regression']
  }
];

let mockTestExecutions: TestExecution[] = [
  {
    id: 'exec1',
    testCaseId: 'tc1',
    result: 'passed',
    executedBy: {
      id: '1',
      name: 'John Doe'
    },
    executedAt: new Date('2023-05-10T14:30:00Z'),
    duration: 120, // 2 minutes
    notes: 'Test executed successfully with no issues',
    environment: {
      platform: 'Web',
      version: '1.0.0',
      deviceModel: 'N/A',
      osVersion: 'Windows 11',
      browser: 'Chrome 112'
    },
    stepResults: [
      {
        stepNumber: 1,
        result: 'passed',
        notes: 'Login form loaded correctly'
      },
      {
        stepNumber: 2,
        result: 'passed',
        notes: 'Credentials accepted'
      },
      {
        stepNumber: 3,
        result: 'passed',
        notes: 'Successfully redirected to dashboard'
      }
    ]
  },
  {
    id: 'exec2',
    testCaseId: 'tc2',
    result: 'failed',
    executedBy: {
      id: '2',
      name: 'Jane Smith'
    },
    executedAt: new Date('2023-05-11T10:15:00Z'),
    duration: 180, // 3 minutes
    notes: 'Synchronization failed between devices',
    environment: {
      platform: 'Cross-platform',
      version: '1.5.2',
      deviceModel: 'Multiple',
      osVersion: 'iOS 15.4 / Android 12',
      browser: 'N/A'
    },
    stepResults: [
      {
        stepNumber: 1,
        result: 'passed',
        notes: 'Task created successfully on device A'
      },
      {
        stepNumber: 2,
        result: 'passed',
        notes: 'Waited for 30 seconds'
      },
      {
        stepNumber: 3,
        result: 'failed',
        notes: 'Task did not appear on device B even after 2 minutes'
      }
    ]
  }
];

// Get all test cases
export const getAllTestCases = async (): Promise<TestCase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockTestCases]);
    }, 500);
  });
};

// Get test cases by app ID
export const getTestCasesByAppId = async (appId: string): Promise<TestCase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredTestCases = mockTestCases.filter(testCase => testCase.appId === appId);
      resolve([...filteredTestCases]);
    }, 500);
  });
};

// Get test cases by tester ID
export const getTestCasesByTesterId = async (testerId: string): Promise<TestCase[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredTestCases = mockTestCases.filter(testCase => testCase.assignedTo.id === testerId);
      resolve([...filteredTestCases]);
    }, 500);
  });
};

// Get test case by ID
export const getTestCaseById = async (testCaseId: string): Promise<TestCase | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const testCase = mockTestCases.find(testCase => testCase.id === testCaseId) || null;
      resolve(testCase ? { ...testCase } : null);
    }, 500);
  });
};

// Create a new test case
export const createTestCase = async (
  testCaseData: TestCaseCreateInput,
  creatorId: string,
  creatorName: string,
  assigneeId: string,
  assigneeName: string,
  appName: string
): Promise<TestCase> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTestCase: TestCase = {
        id: uuidv4(),
        ...testCaseData,
        appName,
        status: 'pending',
        assignedTo: {
          id: assigneeId,
          name: assigneeName
        },
        createdBy: {
          id: creatorId,
          name: creatorName
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockTestCases.push(newTestCase);
      resolve({ ...newTestCase });
    }, 500);
  });
};

// Update test case status
export const updateTestCaseStatus = async (
  testCaseId: string,
  status: TestCaseStatus
): Promise<TestCase | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const testCaseIndex = mockTestCases.findIndex(testCase => testCase.id === testCaseId);
      
      if (testCaseIndex === -1) {
        resolve(null);
        return;
      }
      
      const updatedTestCase = { ...mockTestCases[testCaseIndex] };
      updatedTestCase.status = status;
      updatedTestCase.updatedAt = new Date();
      
      mockTestCases[testCaseIndex] = updatedTestCase;
      resolve({ ...updatedTestCase });
    }, 500);
  });
};

// Get all test executions
export const getAllTestExecutions = async (): Promise<TestExecution[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockTestExecutions]);
    }, 500);
  });
};

// Get test executions by test case ID
export const getTestExecutionsByTestCaseId = async (testCaseId: string): Promise<TestExecution[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredExecutions = mockTestExecutions.filter(execution => execution.testCaseId === testCaseId);
      resolve([...filteredExecutions]);
    }, 500);
  });
};

// Create a new test execution
export const createTestExecution = async (
  executionData: TestExecutionCreateInput,
  executorId: string,
  executorName: string
): Promise<TestExecution> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newExecution: TestExecution = {
        id: uuidv4(),
        ...executionData,
        executedBy: {
          id: executorId,
          name: executorName
        },
        executedAt: new Date()
      };
      
      mockTestExecutions.push(newExecution);
      
      // Update test case status based on execution result
      const testCaseIndex = mockTestCases.findIndex(testCase => testCase.id === executionData.testCaseId);
      if (testCaseIndex !== -1) {
        const updatedTestCase = { ...mockTestCases[testCaseIndex] };
        updatedTestCase.status = executionData.result === 'passed' ? 'passed' : 'failed';
        updatedTestCase.updatedAt = new Date();
        mockTestCases[testCaseIndex] = updatedTestCase;
      }
      
      resolve({ ...newExecution });
    }, 500);
  });
};

// Get test case statistics
export const getTestCaseStatistics = async (appId?: string): Promise<{
  total: number;
  byPriority: Record<TestCasePriority, number>;
  byStatus: Record<TestCaseStatus, number>;
  executionResults: {
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    total: number;
    passRate: number;
  };
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const testCasesToAnalyze = appId 
        ? mockTestCases.filter(testCase => testCase.appId === appId)
        : mockTestCases;
      
      const executionsToAnalyze = appId
        ? mockTestExecutions.filter(execution => {
            const testCase = mockTestCases.find(tc => tc.id === execution.testCaseId);
            return testCase && testCase.appId === appId;
          })
        : mockTestExecutions;
      
      const statistics = {
        total: testCasesToAnalyze.length,
        byPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        byStatus: {
          'pending': 0,
          'in-progress': 0,
          'passed': 0,
          'failed': 0,
          'blocked': 0
        },
        executionResults: {
          passed: 0,
          failed: 0,
          blocked: 0,
          skipped: 0,
          total: executionsToAnalyze.length,
          passRate: 0
        }
      };
      
      testCasesToAnalyze.forEach(testCase => {
        statistics.byPriority[testCase.priority]++;
        statistics.byStatus[testCase.status]++;
      });
      
      executionsToAnalyze.forEach(execution => {
        statistics.executionResults[execution.result]++;
      });
      
      // Calculate pass rate
      if (statistics.executionResults.total > 0) {
        statistics.executionResults.passRate = 
          (statistics.executionResults.passed / statistics.executionResults.total) * 100;
      }
      
      resolve(statistics);
    }, 500);
  });
};
