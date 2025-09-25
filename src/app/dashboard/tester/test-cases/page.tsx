import React from 'react';
import TestCaseList from '@/components/dashboard/tester/TestCaseList';

export const metadata = {
  title: 'Test Cases | AppFounders Tester Dashboard',
  description: 'View and manage test cases for your projects'
};

export default function TestCasesPage() {
  return <TestCaseList />;
}
