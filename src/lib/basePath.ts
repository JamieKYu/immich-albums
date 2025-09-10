// Helper function to create API URLs with the correct base path
// For now, we'll use the configured base path directly
// In production, this should match your Next.js basePath configuration
const BASE_PATH = '/photos';

export const createApiUrl = (path: string): string => {
  // Ensure the path starts with /api
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  return `${BASE_PATH}${apiPath}`;
};