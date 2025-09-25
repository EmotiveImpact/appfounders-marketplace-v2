// Bug service for handling bug-related operations
import { v4 as uuidv4 } from 'uuid';

// Bug severity types
export type BugSeverity = 'critical' | 'high' | 'medium' | 'low';

// Bug status types
export type BugStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'rejected';

// Bug interface
export interface Bug {
  id: string;
  title: string;
  description: string;
  appId: string;
  appName: string;
  severity: BugSeverity;
  status: BugStatus;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    platform: string;
    version: string;
    deviceModel: string;
    osVersion: string;
    browser: string;
  };
  reportedBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  testCaseId?: string;
  projectId?: string;
}

// Bug creation interface
export interface BugCreateInput {
  title: string;
  description: string;
  appId: string;
  severity: BugSeverity;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: {
    platform: string;
    version: string;
    deviceModel: string;
    osVersion: string;
    browser: string;
  };
  testCaseId?: string;
  projectId?: string;
}

// Mock data for development
let mockBugs: Bug[] = [
  {
    id: '1',
    title: 'Login button not working on iOS',
    description: 'When clicking the login button on iOS devices, nothing happens.',
    appId: 'app1',
    appName: 'Finance Tracker',
    severity: 'high',
    status: 'open',
    stepsToReproduce: [
      'Open the app on iOS device',
      'Navigate to login screen',
      'Enter credentials',
      'Click login button'
    ],
    expectedBehavior: 'User should be logged in and redirected to dashboard',
    actualBehavior: 'Button click has no effect, no error message displayed',
    environment: {
      platform: 'iOS',
      version: '2.1.0',
      deviceModel: 'iPhone 13',
      osVersion: 'iOS 15.4',
      browser: 'N/A'
    },
    reportedBy: {
      id: '1',
      name: 'John Doe'
    },
    createdAt: new Date('2023-05-15T10:30:00Z'),
    updatedAt: new Date('2023-05-15T10:30:00Z'),
    testCaseId: 'tc1',
    projectId: 'proj1'
  },
  {
    id: '2',
    title: 'Data not syncing between devices',
    description: 'Changes made on one device are not reflected on other devices.',
    appId: 'app2',
    appName: 'Task Manager',
    severity: 'medium',
    status: 'in-progress',
    stepsToReproduce: [
      'Login on device A',
      'Add a new task',
      'Login on device B',
      'Check for the new task'
    ],
    expectedBehavior: 'New task should appear on device B',
    actualBehavior: 'New task only visible on device A',
    environment: {
      platform: 'Cross-platform',
      version: '1.5.2',
      deviceModel: 'Multiple',
      osVersion: 'Multiple',
      browser: 'N/A'
    },
    reportedBy: {
      id: '2',
      name: 'Jane Smith'
    },
    assignedTo: {
      id: '3',
      name: 'Bob Johnson'
    },
    createdAt: new Date('2023-05-10T14:20:00Z'),
    updatedAt: new Date('2023-05-11T09:15:00Z'),
    testCaseId: 'tc2',
    projectId: 'proj2'
  }
];

// Get all bugs
export const getAllBugs = async (): Promise<Bug[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockBugs]);
    }, 500);
  });
};

// Get bugs by app ID
export const getBugsByAppId = async (appId: string): Promise<Bug[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredBugs = mockBugs.filter(bug => bug.appId === appId);
      resolve([...filteredBugs]);
    }, 500);
  });
};

// Get bugs by tester ID
export const getBugsByTesterId = async (testerId: string): Promise<Bug[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const filteredBugs = mockBugs.filter(bug => bug.reportedBy.id === testerId);
      resolve([...filteredBugs]);
    }, 500);
  });
};

// Get bug by ID
export const getBugById = async (bugId: string): Promise<Bug | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bug = mockBugs.find(bug => bug.id === bugId) || null;
      resolve(bug ? { ...bug } : null);
    }, 500);
  });
};

// Create a new bug
export const createBug = async (
  bugData: BugCreateInput,
  userId: string,
  userName: string,
  appName: string
): Promise<Bug> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newBug: Bug = {
        id: uuidv4(),
        ...bugData,
        appName,
        status: 'open',
        reportedBy: {
          id: userId,
          name: userName
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockBugs.push(newBug);
      resolve({ ...newBug });
    }, 500);
  });
};

// Update bug status
export const updateBugStatus = async (
  bugId: string,
  status: BugStatus,
  assigneeId?: string,
  assigneeName?: string
): Promise<Bug | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bugIndex = mockBugs.findIndex(bug => bug.id === bugId);
      
      if (bugIndex === -1) {
        resolve(null);
        return;
      }
      
      const updatedBug = { ...mockBugs[bugIndex] };
      updatedBug.status = status;
      updatedBug.updatedAt = new Date();
      
      if (assigneeId && assigneeName) {
        updatedBug.assignedTo = {
          id: assigneeId,
          name: assigneeName
        };
      }
      
      if (status === 'resolved') {
        updatedBug.resolvedAt = new Date();
      }
      
      mockBugs[bugIndex] = updatedBug;
      resolve({ ...updatedBug });
    }, 500);
  });
};

// Get bug statistics
export const getBugStatistics = async (appId?: string): Promise<{
  total: number;
  bySeverity: Record<BugSeverity, number>;
  byStatus: Record<BugStatus, number>;
}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const bugsToAnalyze = appId 
        ? mockBugs.filter(bug => bug.appId === appId)
        : mockBugs;
      
      const statistics = {
        total: bugsToAnalyze.length,
        bySeverity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        byStatus: {
          'open': 0,
          'in-progress': 0,
          'resolved': 0,
          'closed': 0,
          'rejected': 0
        }
      };
      
      bugsToAnalyze.forEach(bug => {
        statistics.bySeverity[bug.severity]++;
        statistics.byStatus[bug.status]++;
      });
      
      resolve(statistics);
    }, 500);
  });
};
