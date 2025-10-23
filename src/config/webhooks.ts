// Webhook Configuration for Provider Confirmations
// Replace with your Google Apps Script Web App URL

export const WEBHOOK_CONFIG = {
  // Google Apps Script Web App URL
  // Get this from: Extensions > Apps Script > Deploy > New deployment > Web app
  PROVIDER_CONFIRMATION_URL: "https://script.google.com/macros/s/PASTE_YOUR_WEB_APP_URL/exec",
  
  // Security token - must match the SHARED_SECRET in your Apps Script CONFIG
  // Generate a long random string for production
  SECURITY_TOKEN: "CHANGE_ME_TO_A_LONG_RANDOM_STRING",
} as const;
