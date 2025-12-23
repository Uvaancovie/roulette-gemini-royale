/**
 * API Configuration
 * Handles API base URL for different environments
 */

// In production (Vercel), point to Render backend
// In development, use local proxy
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://covies-casino-api.onrender.com' 
  : 'http://localhost:5003';

// Helper to build full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};
