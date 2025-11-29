/**
 * KDS Token Management
 * Handles storage and retrieval of Kitchen Display System tokens
 */

const KDS_TOKEN_PREFIX = 'kdsToken_branch_';
const KDS_EXPIRES_PREFIX = 'kdsExpires_branch_';

/**
 * Get KDS token for a specific branch
 * Returns null if token doesn't exist or is expired
 */
export const getKdsToken = (branchId: number): string | null => {
  if (typeof window === 'undefined') return null;
  
  const tokenKey = `${KDS_TOKEN_PREFIX}${branchId}`;
  const expiresKey = `${KDS_EXPIRES_PREFIX}${branchId}`;
  
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    console.log('[getKdsToken] No token found for branch', branchId);
    return null;
  }

  // Check if token is expired
  const expiresAt = localStorage.getItem(expiresKey);
  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    
    // Check if expiry date is valid
    if (isNaN(expiryDate.getTime())) {
      console.warn('[getKdsToken] Invalid expiry date for branch', branchId, expiresAt);
      clearKdsToken(branchId);
      return null;
    }
    
    // Check if token is expired
    // Add a generous buffer (5 minutes) to account for clock skew and processing time
    // Token is considered expired only if expiry is more than 5 minutes in the past
    const bufferMs = 300000; // 5 minutes buffer (very generous to prevent false positives)
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    
    // Token is valid if it hasn't expired yet (or expired less than 30 seconds ago due to clock skew)
    if (timeUntilExpiry <= -bufferMs) {
      // Token expired (more than 30 seconds ago), clean up
      console.log('[getKdsToken] Token expired for branch', branchId, {
        expiredAt: expiresAt,
        currentTime: now.toISOString(),
        timeUntilExpiry: timeUntilExpiry,
        timeUntilExpirySeconds: Math.floor(timeUntilExpiry / 1000),
      });
      clearKdsToken(branchId);
      return null;
    }
    
    // If token expires soon (within 30 seconds) or is slightly expired (within buffer), log a warning but still allow it
    if (timeUntilExpiry <= bufferMs) {
      if (timeUntilExpiry > 0) {
        console.warn('[getKdsToken] Token expires soon for branch', branchId, {
          expiresAt: expiresAt,
          timeUntilExpiry: timeUntilExpiry,
          timeUntilExpirySeconds: Math.floor(timeUntilExpiry / 1000),
        });
      } else {
        console.warn('[getKdsToken] Token slightly expired but within buffer for branch', branchId, {
          expiresAt: expiresAt,
          timeUntilExpiry: timeUntilExpiry,
          timeUntilExpirySeconds: Math.floor(timeUntilExpiry / 1000),
        });
      }
    }
  }

  console.log('[getKdsToken] ✅ Valid token found for branch', branchId);
  return token;
};

/**
 * Store KDS token and expiry for a branch
 * Uses consistent key schema: kdsToken_branch_{branchId} and kdsExpires_branch_{branchId}
 */
export const setKdsToken = (branchId: number, token: string, expiresAt: string): void => {
  if (typeof window === 'undefined') return;
  
  const tokenKey = `${KDS_TOKEN_PREFIX}${branchId}`;
  const expiresKey = `${KDS_EXPIRES_PREFIX}${branchId}`;
  
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(expiresKey, expiresAt);
  
  console.log('[setKdsToken] ✅ Stored KDS token for branch', branchId, {
    tokenKey,
    expiresKey,
    expiresAt,
  });
};

/**
 * Clear KDS token for a branch
 */
export const clearKdsToken = (branchId: number): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(`${KDS_TOKEN_PREFIX}${branchId}`);
  localStorage.removeItem(`${KDS_EXPIRES_PREFIX}${branchId}`);
};

/**
 * Check if a valid KDS token exists for a branch
 */
export const hasValidKdsToken = (branchId: number): boolean => {
  return getKdsToken(branchId) !== null;
};

/**
 * Get all stored branch IDs with KDS tokens
 */
export const getAllKdsBranchIds = (): number[] => {
  if (typeof window === 'undefined') return [];
  
  const branchIds: number[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(KDS_TOKEN_PREFIX)) {
      const branchId = parseInt(key.replace(KDS_TOKEN_PREFIX, ''), 10);
      if (!isNaN(branchId)) {
        branchIds.push(branchId);
      }
    }
  }
  return branchIds;
};

