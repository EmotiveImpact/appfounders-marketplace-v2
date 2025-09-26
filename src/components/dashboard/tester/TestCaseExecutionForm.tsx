'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestCase, TestExecutionCreateInput } from '@/services/testCaseService';
import { useTesterDashboard } from '@/hooks/useTesterDashboard';
import { Button } from '@/components/ui/button';

interface TestCaseExecutionFormProps {
  testCase: TestCase;
}

export default function TestCaseExecutionForm({ testCase }: TestCaseExecutionFormProps) {
  const router = useRouter();
  const { executeTestCase } = useTesterDashboard();
  const [currentStep, setCurrentStep] = useState(0);
  const [stepResults, setStepResults] = useState<Array<{
    stepNumber: number;
    result: 'passed' | 'failed';
    notes: string;
  }>>([]);
  const [notes, setNotes] = useState('');

  const handleStepResult = (result: 'passed' | 'failed') => {
    const newStepResults = [...stepResults];
    newStepResults[currentStep] = {
      stepNumber: testCase.steps[currentStep].stepNumber,
      result,
      notes: ''
    };
    setStepResults(newStepResults);

    if (currentStep < testCase.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    const executionData: TestExecutionCreateInput = {
      testCaseId: testCase.id,
      result: stepResults.some(step => step.result === 'failed') ? 'failed' : 'passed',
      duration: 0, // You might want to track actual duration
      notes,
      environment: {
        platform: navigator.platform,
        version: '1.0',
        deviceModel: 'Web',
        osVersion: navigator.userAgent,
        browser: navigator.userAgent
      },
      stepResults
    };

    await executeTestCase(executionData);
    router.push(`/dashboard/tester/test-cases/${testCase.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Current Step {currentStep + 1} of {testCase.steps.length}</h2>
        
        <div className="mb-4">
          <h3 className="font-medium">Description:</h3>
          <p>{testCase.steps[currentStep].description}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium">Expected Result:</h3>
          <p>{testCase.steps[currentStep].expectedResult}</p>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={() => handleStepResult('passed')}
            className="bg-green-500 hover:bg-green-600"
          >
            Pass
          </Button>
          <Button
            onClick={() => handleStepResult('failed')}
            className="bg-red-500 hover:bg-red-600"
          >
            Fail
          </Button>
        </div>
      </div>

      {currentStep === testCase.steps.length - 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <textarea
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Add any additional notes about the test execution..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            className="mt-4"
          >
            Complete Test Execution
          </Button>
        </div>
      )}
    </div>
  );
}
