'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTesterDashboard } from '@/hooks/useTesterDashboard';
import { TestCase, TestExecution } from '@/services/testCaseService';
import TestCaseExecutionForm from '@/components/dashboard/tester/TestCaseExecutionForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Note: metadata cannot be exported from client components
// This would be handled by the parent layout or a server component

export default function TestCaseExecutePage() {
  const { id } = useParams();
  const { fetchTestCaseById } = useTesterDashboard();
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTestCase = async () => {
      if (id) {
        const fetchedTestCase = await fetchTestCaseById(id as string);
        setTestCase(fetchedTestCase);
        setLoading(false);
      }
    };
    loadTestCase();
  }, [id, fetchTestCaseById]);

  if (loading) return <LoadingSpinner />;
  if (!testCase) return <div>Test case not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Execute Test Case: {testCase.title}</h1>
      <TestCaseExecutionForm testCase={testCase} />
    </div>
  );
}
