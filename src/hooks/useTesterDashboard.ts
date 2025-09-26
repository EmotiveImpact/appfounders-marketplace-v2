// Custom hook for tester dashboard functionality
import { useState, useCallback, useEffect } from 'react';
import { 
  getAllBugs, 
  getBugsByAppId, 
  getBugsByTesterId,
  getBugById,
  createBug,
  updateBugStatus,
  getBugStatistics,
  Bug,
  BugCreateInput,
  BugStatus
} from '@/services/bugService';

import {
  getAllTestCases,
  getTestCasesByAppId,
  getTestCasesByTesterId,
  getTestCaseById,
  createTestCase,
  updateTestCaseStatus,
  getAllTestExecutions,
  getTestExecutionsByTestCaseId,
  createTestExecution,
  getTestCaseStatistics,
  TestCase,
  TestCaseCreateInput,
  TestCaseStatus,
  TestExecution,
  TestExecutionCreateInput
} from '@/services/testCaseService';

import { useSession } from 'next-auth/react';

// Helper function to get current user from session
const getCurrentUser = () => {
  const { data: session } = useSession();
  return session?.user || null;
};

// Hook for bug management
export const useBugs = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [currentBug, setCurrentBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
  } | null>(null);

  // Fetch all bugs
  const fetchAllBugs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBugs();
      setBugs(data);
    } catch (err) {
      setError('Failed to fetch bugs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bugs by app ID
  const fetchBugsByAppId = useCallback(async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBugsByAppId(appId);
      setBugs(data);
    } catch (err) {
      setError('Failed to fetch bugs for this app');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bugs by tester ID
  const fetchBugsByTesterId = useCallback(async (testerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBugsByTesterId(testerId);
      setBugs(data);
    } catch (err) {
      setError('Failed to fetch your bugs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch bug by ID
  const fetchBugById = useCallback(async (bugId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBugById(bugId);
      setCurrentBug(data);
      return data;
    } catch (err) {
      setError('Failed to fetch bug details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new bug
  const reportBug = useCallback(async (
    bugData: BugCreateInput,
    appName: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const data = await createBug(
        bugData,
        currentUser.id,
        currentUser.name,
        appName
      );
      
      // Update local state
      setBugs(prevBugs => [...prevBugs, data]);
      setCurrentBug(data);
      
      return data;
    } catch (err) {
      setError('Failed to report bug');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update bug status
  const updateBug = useCallback(async (
    bugId: string,
    status: BugStatus,
    assigneeId?: string,
    assigneeName?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateBugStatus(bugId, status, assigneeId, assigneeName);
      
      if (data) {
        // Update local state
        setBugs(prevBugs => 
          prevBugs.map(bug => bug.id === bugId ? data : bug)
        );
        
        if (currentBug && currentBug.id === bugId) {
          setCurrentBug(data);
        }
      }
      
      return data;
    } catch (err) {
      setError('Failed to update bug status');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentBug]);

  // Fetch bug statistics
  const fetchBugStatistics = useCallback(async (appId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBugStatistics(appId);
      setStatistics(data);
      return data;
    } catch (err) {
      setError('Failed to fetch bug statistics');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bugs,
    currentBug,
    loading,
    error,
    statistics,
    fetchAllBugs,
    fetchBugsByAppId,
    fetchBugsByTesterId,
    fetchBugById,
    reportBug,
    updateBug,
    fetchBugStatistics
  };
};

// Hook for test case management
export const useTestCases = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{
    total: number;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    executionResults: {
      passed: number;
      failed: number;
      blocked: number;
      skipped: number;
      total: number;
      passRate: number;
    };
  } | null>(null);

  // Fetch all test cases
  const fetchAllTestCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTestCases();
      setTestCases(data);
    } catch (err) {
      setError('Failed to fetch test cases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch test cases by app ID
  const fetchTestCasesByAppId = useCallback(async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestCasesByAppId(appId);
      setTestCases(data);
    } catch (err) {
      setError('Failed to fetch test cases for this app');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch test cases by tester ID
  const fetchTestCasesByTesterId = useCallback(async (testerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestCasesByTesterId(testerId);
      setTestCases(data);
    } catch (err) {
      setError('Failed to fetch your test cases');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch test case by ID
  const fetchTestCaseById = useCallback(async (testCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestCaseById(testCaseId);
      setCurrentTestCase(data);
      return data;
    } catch (err) {
      setError('Failed to fetch test case details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch test executions for a test case
  const fetchTestExecutions = useCallback(async (testCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestExecutionsByTestCaseId(testCaseId);
      setTestExecutions(data);
      return data;
    } catch (err) {
      setError('Failed to fetch test executions');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new test execution
  const executeTestCase = useCallback(async (executionData: TestExecutionCreateInput) => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const data = await createTestExecution(
        executionData,
        currentUser.id,
        currentUser.name
      );
      
      // Update local state
      setTestExecutions(prevExecutions => [...prevExecutions, data]);
      
      // Update test case status based on execution result
      if (currentTestCase && currentTestCase.id === executionData.testCaseId) {
        const updatedStatus: TestCaseStatus = 
          executionData.result === 'passed' ? 'passed' : 'failed';
        
        const updatedTestCase = await updateTestCaseStatus(
          executionData.testCaseId,
          updatedStatus
        );
        
        if (updatedTestCase) {
          setCurrentTestCase(updatedTestCase);
          setTestCases(prevTestCases => 
            prevTestCases.map(tc => tc.id === updatedTestCase.id ? updatedTestCase : tc)
          );
        }
      }
      
      return data;
    } catch (err) {
      setError('Failed to record test execution');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTestCase]);

  // Fetch test case statistics
  const fetchTestCaseStatistics = useCallback(async (appId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTestCaseStatistics(appId);
      setStatistics(data);
      return data;
    } catch (err) {
      setError('Failed to fetch test case statistics');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    testCases,
    currentTestCase,
    testExecutions,
    loading,
    error,
    statistics,
    fetchAllTestCases,
    fetchTestCasesByAppId,
    fetchTestCasesByTesterId,
    fetchTestCaseById,
    fetchTestExecutions,
    executeTestCase,
    fetchTestCaseStatistics
  };
};

// Hook for tester dashboard
export const useTesterDashboard = () => {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [selectedBug, setSelectedBug] = useState<Bug | null>(null);
  const [loadingBugs, setLoadingBugs] = useState(false);
  const [errorBugs, setErrorBugs] = useState<string | null>(null);

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [errorTestCases, setErrorTestCases] = useState<string | null>(null);

  const [testExecutions, setTestExecutions] = useState<TestExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<TestExecution | null>(null);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [errorExecutions, setErrorExecutions] = useState<string | null>(null);

  // Bug methods
  const fetchBugs = useCallback(async () => {
    try {
      setLoadingBugs(true);
      setErrorBugs(null);
      const fetchedBugs = await getAllBugs();
      setBugs(fetchedBugs);
    } catch (error) {
      setErrorBugs(error instanceof Error ? error.message : 'Failed to fetch bugs');
    } finally {
      setLoadingBugs(false);
    }
  }, []);

  const fetchBugById = useCallback(async (id: string) => {
    try {
      setLoadingBugs(true);
      setErrorBugs(null);
      const bug = await getBugById(id);
      setSelectedBug(bug);
      return bug;
    } catch (error) {
      setErrorBugs(error instanceof Error ? error.message : 'Failed to fetch bug');
      return null;
    } finally {
      setLoadingBugs(false);
    }
  }, []);

  const createBug = useCallback(async (bugData: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newBug = await createBug(
        bugData,
        getCurrentUser().id,
        getCurrentUser().name,
        ''
      );
      
      // Update local state
      setBugs(prevBugs => [...prevBugs, newBug]);
      setSelectedBug(newBug);
      
      return newBug;
    } catch (error) {
      throw new Error('Failed to create bug');
    }
  }, []);

  const updateBug = useCallback(async (id: string, bugData: Partial<Bug>) => {
    try {
      const updatedBug = await updateBugStatus(id, bugData.status, bugData.assigneeId, bugData.assigneeName);
      
      if (updatedBug) {
        // Update local state
        setBugs(prevBugs => 
          prevBugs.map(bug => bug.id === id ? updatedBug : bug)
        );
        
        if (selectedBug?.id === id) {
          setSelectedBug(updatedBug);
        }
      }
      
      return updatedBug;
    } catch (error) {
      throw new Error('Failed to update bug');
    }
  }, [selectedBug]);

  // Test case methods
  const fetchTestCases = useCallback(async () => {
    try {
      setLoadingTestCases(true);
      setErrorTestCases(null);
      const fetchedTestCases = await getAllTestCases();
      setTestCases(fetchedTestCases);
    } catch (error) {
      setErrorTestCases(error instanceof Error ? error.message : 'Failed to fetch test cases');
    } finally {
      setLoadingTestCases(false);
    }
  }, []);

  const fetchTestCaseById = useCallback(async (id: string) => {
    try {
      setLoadingTestCases(true);
      setErrorTestCases(null);
      const testCase = await getTestCaseById(id);
      setSelectedTestCase(testCase);
      return testCase;
    } catch (error) {
      setErrorTestCases(error instanceof Error ? error.message : 'Failed to fetch test case');
      return null;
    } finally {
      setLoadingTestCases(false);
    }
  }, []);

  const createTestCase = useCallback(async (testCaseData: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTestCase = await createTestCase(testCaseData);
      
      // Update local state
      setTestCases(prevTestCases => [...prevTestCases, newTestCase]);
      setSelectedTestCase(newTestCase);
      
      return newTestCase;
    } catch (error) {
      throw new Error('Failed to create test case');
    }
  }, []);

  const updateTestCase = useCallback(async (id: string, testCaseData: Partial<TestCase>) => {
    try {
      const updatedTestCase = await updateTestCaseStatus(id, testCaseData.status);
      
      if (updatedTestCase) {
        // Update local state
        setTestCases(prevTestCases => 
          prevTestCases.map(testCase => testCase.id === id ? updatedTestCase : testCase)
        );
        
        if (selectedTestCase?.id === id) {
          setSelectedTestCase(updatedTestCase);
        }
      }
      
      return updatedTestCase;
    } catch (error) {
      throw new Error('Failed to update test case');
    }
  }, [selectedTestCase]);

  // Test execution methods
  const fetchTestExecutions = useCallback(async () => {
    try {
      setLoadingExecutions(true);
      setErrorExecutions(null);
      const executions = await getAllTestExecutions();
      setTestExecutions(executions);
    } catch (error) {
      setErrorExecutions(error instanceof Error ? error.message : 'Failed to fetch test executions');
    } finally {
      setLoadingExecutions(false);
    }
  }, []);

  const fetchExecutionById = useCallback(async (id: string) => {
    try {
      setLoadingExecutions(true);
      setErrorExecutions(null);
      const execution = await getTestExecutionsByTestCaseId(id);
      if (execution) {
        setSelectedExecution(execution);
      }
      return execution;
    } catch (error) {
      setErrorExecutions(error instanceof Error ? error.message : 'Failed to fetch test execution');
      return null;
    } finally {
      setLoadingExecutions(false);
    }
  }, []);

  const createTestExecution = useCallback(async (data: Omit<TestExecution, 'id' | 'executedAt'>) => {
    try {
      const newExecution = await createTestExecution(
        data,
        getCurrentUser().id,
        getCurrentUser().name
      );
      
      // Update local state
      setTestExecutions(prev => [...prev, newExecution]);
      setSelectedExecution(newExecution);
      
      return newExecution;
    } catch (error) {
      throw new Error('Failed to create test execution');
    }
  }, []);

  const updateTestExecution = useCallback(async (id: string, data: Partial<TestExecution>) => {
    try {
      const updatedExecution = await updateTestCaseStatus(id, data.status);
      
      if (updatedExecution) {
        // Update local state
        setTestExecutions(prev => 
          prev.map(exec => exec.id === id ? updatedExecution : exec)
        );
        
        if (selectedExecution?.id === id) {
          setSelectedExecution(updatedExecution);
        }
      }
      
      return updatedExecution;
    } catch (error) {
      throw new Error('Failed to update test execution');
    }
  }, [selectedExecution]);

  // Analytics methods
  const fetchTestCaseStatistics = useCallback(async (timeRange: '7days' | '30days' | '90days' = '30days') => {
    try {
      // This would be an API call in a real implementation
      // For now, we'll return mock data
      
      // Mock data for test execution results
      const executionResults = [
        { name: 'Passed', value: timeRange === '7days' ? 42 : timeRange === '30days' ? 156 : 412 },
        { name: 'Failed', value: timeRange === '7days' ? 18 : timeRange === '30days' ? 64 : 187 },
        { name: 'Blocked', value: timeRange === '7days' ? 5 : timeRange === '30days' ? 23 : 56 },
        { name: 'Skipped', value: timeRange === '7days' ? 3 : timeRange === '30days' ? 12 : 34 }
      ];
      
      // Mock data for bug severity distribution
      const bugSeverity = [
        { name: 'Critical', value: timeRange === '7days' ? 3 : timeRange === '30days' ? 12 : 28 },
        { name: 'High', value: timeRange === '7days' ? 7 : timeRange === '30days' ? 26 : 68 },
        { name: 'Medium', value: timeRange === '7days' ? 14 : timeRange === '30days' ? 42 : 112 },
        { name: 'Low', value: timeRange === '7days' ? 8 : timeRange === '30days' ? 31 : 82 }
      ];
      
      // Mock data for test execution trends
      let executionTrends = [];
      if (timeRange === '7days') {
        executionTrends = [
          { date: '03/01', passed: 8, failed: 2, blocked: 1 },
          { date: '03/02', passed: 6, failed: 3, blocked: 0 },
          { date: '03/03', passed: 7, failed: 2, blocked: 1 },
          { date: '03/04', passed: 5, failed: 4, blocked: 0 },
          { date: '03/05', passed: 9, failed: 1, blocked: 2 },
          { date: '03/06', passed: 4, failed: 5, blocked: 1 },
          { date: '03/07', passed: 3, failed: 1, blocked: 0 }
        ];
      } else if (timeRange === '30days') {
        executionTrends = [
          { date: 'Week 1', passed: 32, failed: 12, blocked: 4 },
          { date: 'Week 2', passed: 38, failed: 15, blocked: 6 },
          { date: 'Week 3', passed: 45, failed: 18, blocked: 7 },
          { date: 'Week 4', passed: 41, failed: 19, blocked: 6 }
        ];
      } else {
        executionTrends = [
          { date: 'Jan', passed: 120, failed: 45, blocked: 18 },
          { date: 'Feb', passed: 135, failed: 52, blocked: 21 },
          { date: 'Mar', passed: 157, failed: 90, blocked: 17 }
        ];
      }
      
      // Mock data for test coverage by project
      const coverageByProject = [
        { name: 'Finance App', covered: 78, uncovered: 22 },
        { name: 'Health App', covered: 65, uncovered: 35 },
        { name: 'Education App', covered: 82, uncovered: 18 },
        { name: 'Gaming App', covered: 45, uncovered: 55 },
        { name: 'Social App', covered: 72, uncovered: 28 }
      ];
      
      // Mock data for execution time by app
      const executionTimeByApp = [
        { name: 'Finance App', time: 45 },
        { name: 'Health App', time: 32 },
        { name: 'Education App', time: 28 },
        { name: 'Gaming App', time: 52 },
        { name: 'Social App', time: 38 }
      ];
      
      return {
        executionResults,
        bugSeverity,
        executionTrends,
        coverageByProject,
        executionTimeByApp
      };
    } catch (error) {
      console.error('Failed to fetch test statistics:', error);
      throw new Error('Failed to fetch test statistics');
    }
  }, []);

  return {
    // Bug state and methods
    bugs,
    selectedBug,
    loadingBugs,
    errorBugs,
    fetchBugs,
    fetchBugById,
    createBug,
    updateBug,
    
    // Test case state and methods
    testCases,
    selectedTestCase,
    loadingTestCases,
    errorTestCases,
    fetchTestCases,
    fetchTestCaseById,
    createTestCase,
    updateTestCase,
    
    // Test execution state and methods
    testExecutions,
    selectedExecution,
    loadingExecutions,
    errorExecutions,
    fetchTestExecutions,
    fetchExecutionById,
    createTestExecution,
    updateTestExecution,
    
    // Analytics methods
    fetchTestCaseStatistics
  };
};
