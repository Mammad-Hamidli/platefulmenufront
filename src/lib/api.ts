import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from './env';
import { getKdsToken } from './kds-token';

type UnauthorizedHandler = () => void | Promise<void>;

/**
 * Extract branchId from URL if it matches /branches/{branchId}/kitchen pattern
 */
const extractBranchIdFromUrl = (url: string): number | null => {
  const match = url.match(/\/branches\/(\d+)\/kitchen/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

export const createApiClient = (token?: string, onUnauthorized?: UnauthorizedHandler) => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use((config) => {
    // Add JWT Authorization header if token provided
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add KDS token header for ALL kitchen endpoints (except PIN management)
    // PIN management endpoints (/kitchen/pin) use JWT, not KDS token
    // Pattern: /api/branches/{branchId}/kitchen/* or /branches/{branchId}/kitchen/*
    const requestUrl = config.url || '';
    
    // Handle both relative paths and full URLs
    let urlPath = requestUrl;
    if (requestUrl.includes('http')) {
      try {
        const urlObj = new URL(requestUrl);
        urlPath = urlObj.pathname;
      } catch {
        // If URL parsing fails, use as-is
        urlPath = requestUrl;
      }
    }
    
    // Remove /api prefix if present for pattern matching
    // Backend URLs might be /api/branches/{branchId}/kitchen/orders
    // Frontend URLs might be /branches/{branchId}/kitchen/orders
    const normalizedPath = urlPath.startsWith('/api') ? urlPath.substring(4) : urlPath;
    
    // Check if this is a kitchen endpoint (but not PIN management)
    // Match: /branches/{branchId}/kitchen/* or /api/branches/{branchId}/kitchen/*
    const isKitchenEndpoint = /\/branches\/\d+\/kitchen/.test(normalizedPath) && !normalizedPath.includes('/kitchen/pin');
    
    if (isKitchenEndpoint) {
      // Extract branchId from normalized path (works with both /api/branches/... and /branches/...)
      const branchId = extractBranchIdFromUrl(normalizedPath);
      if (branchId) {
        // Read token from localStorage at request time (ensures we get the latest token)
        const kdsToken = getKdsToken(branchId);
        
        if (kdsToken) {
          config.headers = config.headers ?? {};
          config.headers['X-KDS-Token'] = kdsToken;
          console.log('[API Client] ✅ X-KDS-Token header attached for branch', branchId, {
            tokenPreview: `${kdsToken.substring(0, 10)}...`,
            url: urlPath,
            normalizedPath: normalizedPath,
          });
        } else {
          console.error('[API Client] ❌ No KDS token found for branch:', branchId, {
            url: urlPath,
            normalizedPath: normalizedPath,
            allLocalStorageKeys: typeof window !== 'undefined' ? Object.keys(localStorage).filter(k => k.includes('kds')) : [],
          });
          // Don't fail the request - let the backend return 401/403
          // The component will handle showing PIN login
        }
      } else {
        console.warn('[API Client] ⚠️ Could not extract branchId from URL:', urlPath, normalizedPath);
      }
    }

    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      // Handle 401 Unauthorized
      // For kitchen endpoints, 401 with requiresPin is expected and should not trigger logout
      const fullUrl = error.config?.url || '';
      let url = fullUrl.includes('http') ? new URL(fullUrl).pathname : fullUrl;
      // Remove /api prefix if present
      const normalizedUrl = url.startsWith('/api') ? url.substring(4) : url;
      const isKitchenEndpoint = /\/branches\/\d+\/kitchen/.test(normalizedUrl) && !normalizedUrl.includes('/kitchen/pin');
      
      if (error.response?.status === 401) {
        // For kitchen endpoints, check if it's a requiresPin response
        if (isKitchenEndpoint) {
          const responseData = error.response.data as any;
          if (responseData?.requiresPin) {
            // This is expected - don't trigger logout, just let it propagate
            return Promise.reject(error);
          }
        }
        
        // For non-kitchen endpoints or other 401s, trigger logout
        if (onUnauthorized) {
          await onUnauthorized();
        }
      }
      
      // Handle 403 Forbidden for kitchen endpoints (token expired or invalid)
      // Don't redirect here - let the component handle it
      // The component will check the error and decide whether to redirect
      if (error.response?.status === 403 && isKitchenEndpoint) {
        const branchId = extractBranchIdFromUrl(normalizedUrl);
        if (branchId) {
          console.error('[API Client] ❌ 403 Forbidden for kitchen endpoint', {
            branchId,
            url: fullUrl,
            normalizedUrl,
            requestHeaders: error.config?.headers,
            responseData: error.response?.data,
          });
          // Don't clear token or redirect here - let the component decide
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

