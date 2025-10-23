// Webhook Configuration for Provider Confirmations
// Connected to Google Apps Script for RCMS Journal tracking

export const WEBHOOK_CONFIG = {
  // Google Apps Script Web App URL
  PROVIDER_CONFIRMATION_URL: "https://script.google.com/macros/s/AKfycbwgEBv05s0ELS5Cyz8-p3IFCe3cSUJcFcNIuOgCXctY_4dyHPvrvTIQa6X_jmRo2ekbAA/exec",
  
  // Security token - matches SHARED_SECRET in Apps Script CONFIG
  SECURITY_TOKEN: "RCMS2025_secure_key_001",
} as const;
