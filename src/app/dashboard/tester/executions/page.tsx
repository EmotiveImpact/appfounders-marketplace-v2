import React from 'react';
import TestExecutionComponent from '@/components/dashboard/tester/TestExecutionComponent';

export const metadata = {
  title: 'Test Executions | AppFounders Tester Dashboard',
  description: 'View and manage test execution history for your projects'
};

export default function TestExecutionsPage() {
  return <TestExecutionComponent />;
}
