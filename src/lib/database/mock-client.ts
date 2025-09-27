// Temporary mock database client for deployment
// This allows the build to succeed while we properly implement the database layer

export const mockNeonClient = {
  sql: () => Promise.resolve([]),
};

// Mock database responses
export const mockDbResponse = (data: any[] = []) => Promise.resolve(data);

// Common mock responses
export const mockEmptyArray = () => Promise.resolve([]);
export const mockSingleResult = (data: any = {}) => Promise.resolve([data]);
export const mockCount = (count: number = 0) => Promise.resolve([{ count, total: count }]);
