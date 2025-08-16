/**
 * Generate Wi-Fi QR code payload according to the standard format
 * Format: WIFI:T:security;S:ssid;P:password;H:hidden;;
 */
export interface WiFiConfig {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export function generateWiFiPayload(config: WiFiConfig): string {
  const { ssid, password, security, hidden } = config;
  
  // Escape special characters in SSID and password
  const escapedSSID = escapeWiFiString(ssid);
  const escapedPassword = escapeWiFiString(password);
  
  // Build the Wi-Fi payload string
  const payload = `WIFI:T:${security};S:${escapedSSID};P:${escapedPassword};H:${hidden ? 'true' : 'false'};;`;
  
  return payload;
}

/**
 * Escape special characters in Wi-Fi strings
 * Characters that need escaping: \ , ; " :
 */
function escapeWiFiString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/,/g, '\\,')    // Escape commas
    .replace(/;/g, '\\;')    // Escape semicolons
    .replace(/"/g, '\\"')    // Escape quotes
    .replace(/:/g, '\\:');   // Escape colons
}

/**
 * Validate Wi-Fi configuration
 */
export function validateWiFiConfig(config: WiFiConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!config.ssid.trim()) {
    errors.push('SSID is required');
  }
  
  if (config.ssid.length > 32) {
    errors.push('SSID cannot exceed 32 characters');
  }
  
  if (config.security !== 'nopass' && !config.password) {
    errors.push('Password is required for secured networks');
  }
  
  if (config.password && config.password.length > 63) {
    errors.push('Password cannot exceed 63 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}