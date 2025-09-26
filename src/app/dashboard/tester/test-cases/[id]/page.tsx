'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTesterDashboard } from '@/hooks/useTesterDashboard';
import { TestCase, TestExecution } from '@/services/testCaseService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';

export default function TestCaseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { fetchTestCaseById, fetchTestExecutions } = useTesterDashboard();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        const fetchedTestCase = await fetchTestCaseById(id as string);
        setTestCase(fetchedTestCase);
        
        const fetchedExecutions = await fetchTestExecutions(id as string);
        setExecutions(fetchedExecutions);
        
        setLoading(false);
      }
    };
    loadData();
  }, [id, fetchTestCaseById, fetchTestExecutions]);

  if (loading) return <LoadingSpinner />;
  if (!testCase) return <div>Test case not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Case: {testCase.title}</h1>
        <Button onClick={() => router.push(`/dashboard/tester/test-cases/${id}/execute`)}>
          Execute Test
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Priority</h2>
            <p className="mt-1">{testCase.priority}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Status</h2>
            <p className="mt-1">{testCase.status}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Application</h2>
            <p className="mt-1">{testCase.appName}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Assigned To</h2>
            <p className="mt-1">{testCase.assignedTo.name}</p>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-500">Description</h2>
          <p className="mt-1">{testCase.description}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-500">Preconditions</h2>
          <p className="mt-1">{testCase.preconditions}</p>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Test Steps</h2>
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Result</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testCase.steps.map((step) => (
                  <tr key={step.stepNumber}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{step.stepNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{step.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{step.expectedResult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Execution History</h2>
        {executions.length === 0 ? (
          <p>No executions found for this test case.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Executed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.map((execution) => (
                  <tr key={execution.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(execution.executedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        execution.result === 'passed' ? 'bg-green-100 text-green-800' : 
                        execution.result === 'failed' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {execution.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.executedBy.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {execution.duration}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
