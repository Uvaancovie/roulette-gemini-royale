/**
 * API Configuration
 * Handles API base URL for different environments
 */

// In production (Vercel), API routes are served from the same origin
// In development, they need to point to the local server
export const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5003';

// Helper to build full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};
