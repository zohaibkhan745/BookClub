// ============================================
// API Configuration
// ============================================

/** Backend API base URL */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** API version prefix */
export const API_PREFIX = '/api/v1';

/** Full API URL */
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

// ============================================
// API Helper Functions
// ============================================

import type { ApiError } from '../types';

/** Creates a standardized API error from response */
export function createApiError(
  code: string,
  message: string,
  details?: ApiError['details']
): ApiError {
  return { code, message, details };
}

/** Handles API response and throws errors if not ok */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    // Map backend error format to frontend ApiError
    if (errorData.detail) {
      // FastAPI validation errors
      if (Array.isArray(errorData.detail)) {
        const details = errorData.detail.map((err: { loc: string[]; msg: string }) => ({
          field: err.loc[err.loc.length - 1],
          message: err.msg,
        }));
        throw createApiError('VALIDATION_ERROR', 'Validation failed', details);
      }
      // Backend error with code and message in detail object
      if (typeof errorData.detail === 'object' && errorData.detail.code) {
        throw createApiError(
          errorData.detail.code,
          errorData.detail.message || 'An error occurred'
        );
      }
      // Single error message string
      throw createApiError(
        errorData.code || 'API_ERROR',
        typeof errorData.detail === 'string' ? errorData.detail : 'An error occurred'
      );
    }
    
    // Generic error
    throw createApiError(
      'API_ERROR',
      errorData.message || `Request failed with status ${response.status}`
    );
  }
  
  return response.json();
}

import { getAccessToken } from './authService';

/** Gets authorization headers if user is authenticated */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

/** Makes a GET request to the API */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  return handleResponse<T>(response);
}

/** Makes a POST request to the API */
export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

/** Makes a PATCH request to the API */
export async function apiPatch<T>(endpoint: string, data: unknown): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify(data),
  });
  return handleResponse<T>(response);
}

/** Makes a DELETE request to the API */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
  });
  return handleResponse<T>(response);
}