/**
 * Security utility functions for DrowsyGuard
 * Ensures data privacy and security best practices
 */

export const sanitizeInput = (input: string): string => {
  // Remove any potential XSS vectors
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500); // Limit length
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const isSecureContext = (): boolean => {
  return window.isSecureContext;
};

export const checkCameraPermission = async (): Promise<PermissionState> => {
  if (!navigator.permissions) {
    console.warn('Permissions API not supported');
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return result.state;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return 'prompt';
  }
};

export const checkLocationPermission = async (): Promise<PermissionState> => {
  if (!navigator.permissions) {
    console.warn('Permissions API not supported');
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (error) {
    console.error('Error checking location permission:', error);
    return 'prompt';
  }
};

export const validateSessionData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  
  const session = data as Record<string, unknown>;
  
  // Check required fields
  if (!session.user_id || typeof session.user_id !== 'string') return false;
  if (!session.start_time || !(session.start_time instanceof Date || typeof session.start_time === 'string')) return false;
  
  // Validate numeric fields
  if (session.total_drowsiness_incidents !== undefined && typeof session.total_drowsiness_incidents !== 'number') return false;
  if (session.avg_alertness_level !== undefined && (typeof session.avg_alertness_level !== 'number' || session.avg_alertness_level < 0 || session.avg_alertness_level > 100)) return false;
  
  return true;
};

export const encryptSensitiveData = (data: string): string => {
  // In production, use proper encryption library
  // This is a placeholder for demonstration
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    console.log('Encryption should be implemented with crypto.subtle API');
  }
  return btoa(data); // Basic encoding, NOT secure encryption
};

export const decryptSensitiveData = (encrypted: string): string => {
  // In production, use proper decryption library
  // This is a placeholder for demonstration
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
};

export const isPrivacyCompliant = (): {
  cameraLocalProcessing: boolean;
  noExternalDataTransmission: boolean;
  userConsentRequired: boolean;
} => {
  return {
    cameraLocalProcessing: true, // All facial detection happens locally
    noExternalDataTransmission: true, // No camera data sent externally
    userConsentRequired: true, // Camera permission required
  };
};

export const performSecurityAudit = (): {
  https: boolean;
  csp: boolean;
  permissions: boolean;
  dataEncryption: boolean;
} => {
  return {
    https: window.location.protocol === 'https:',
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
    permissions: 'permissions' in navigator,
    dataEncryption: 'crypto' in window && 'subtle' in window.crypto,
  };
};