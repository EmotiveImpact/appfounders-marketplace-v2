export interface TestExecution {
  id: string;
  testCase: {
    id: string;
    title: string;
  };
  result: 'passed' | 'failed' | 'skipped';
  duration: number;
  notes: string;
  executedAt: string;
  executedBy: string;
  environment: string;
}
