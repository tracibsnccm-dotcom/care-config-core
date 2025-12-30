# Provider Confirmation Webhook Setup

This guide explains how to configure the Google Apps Script webhook for provider confirmations in RCMS C.A.R.E.

## Overview

The system sends provider confirmation data to a Google Apps Script Web App, which can then:
- Store confirmations in Google Sheets
- Send notifications via email
- Trigger other automated workflows
- Integrate with other systems

## Step 1: Create Google Apps Script Web App

1. Go to [Google Apps Script](https://script.google.com/)
2. Create a new project
3. Paste your Apps Script code (the script that handles the webhook)
4. In your script, make sure you have a `CONFIG.SHARED_SECRET` that matches the token in step 2

Example Apps Script structure:
```javascript
const CONFIG = {
  SHARED_SECRET: "YOUR_LONG_RANDOM_STRING_HERE"
};

function doPost(e) {
  // Verify token
  const receivedToken = e.parameter.headers?.['X-RCMS-Token'] || '';
  if (receivedToken !== CONFIG.SHARED_SECRET) {
    return ContentService.createTextOutput('Unauthorized').setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Process the webhook data
  const data = JSON.parse(e.postData.contents);
  // Your logic here...
  
  return ContentService.createTextOutput('Success').setMimeType(ContentService.MimeType.TEXT);
}
```

5. Deploy as Web App:
   - Click **Deploy** > **New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (for webhooks)
   - Click **Deploy**
   - Copy the Web App URL

## Step 2: Configure RCMS

1. Open `src/config/webhooks.ts`
2. Replace the placeholder values:

```typescript
export const WEBHOOK_CONFIG = {
  // Paste your Google Apps Script Web App URL here
  PROVIDER_CONFIRMATION_URL: "https://script.google.com/macros/s/YOUR_ACTUAL_WEB_APP_ID/exec",
  
  // Generate a secure random string (at least 32 characters)
  // This MUST match the SHARED_SECRET in your Apps Script
  SECURITY_TOKEN: "your-secure-random-string-here-make-it-long",
} as const;
```

## Step 3: Generate a Secure Token

Generate a secure random string for the `SECURITY_TOKEN`:

**Option 1 - Command Line:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Option 2 - Online:**
- Use a password generator tool
- Make it at least 32 characters long
- Include letters, numbers, and special characters

**Important:** Use the SAME token in both:
- `src/config/webhooks.ts` → `SECURITY_TOKEN`
- Your Google Apps Script → `CONFIG.SHARED_SECRET`

## Step 4: Test the Integration

1. Navigate to a case with an assigned provider
2. Click the "Confirm Provider" button
3. Check for success toast notification
4. Verify data received in your Google Apps Script/Sheets

## Webhook Payload Structure

The webhook sends the following data:

```typescript
{
  caseId: string;              // e.g., "RCMS-1047"
  providerId: string;          // Provider ID
  providerName: string;        // e.g., "Dr. Smith"
  specialty: string;           // e.g., "Orthopedic"
  clientInitials?: string;     // e.g., "A.J."
  attorneyRef?: string;        // Attorney reference
  timestamp: string;           // ISO 8601 format
  confirmationType: string;    // "appointment_confirmed" | "appointment_scheduled" | "appointment_completed"
  source: "RCMS_CARE";        // Always sent
  version: "1.0";             // API version
}
```

## Security Notes

1. **Never commit your actual tokens to version control**
2. The `X-RCMS-Token` header must be validated in your Apps Script
3. Consider rate limiting in your Apps Script if needed
4. Use HTTPS for all webhook communications (Google Apps Script does this by default)

## Troubleshooting

### Webhook not receiving data
- Verify the Web App URL is correct
- Check that the Apps Script is deployed with "Anyone" access
- Ensure the security token matches on both sides

### "Unauthorized" response
- The `SECURITY_TOKEN` doesn't match `SHARED_SECRET`
- Check for typos or extra spaces
- Regenerate both tokens if needed

### CORS errors
- Google Apps Script automatically handles CORS
- If using a different webhook service, ensure CORS is configured

## Alternative: GHL Forms Integration

If you prefer to use GoHighLevel forms instead of webhooks, you can use the `OpenConfirmationFormButton` component:

```tsx
import { OpenConfirmationFormButton } from "@/components/ProviderConfirmationButton";

<OpenConfirmationFormButton
  caseData={caseData}
  provider={provider}
  formUrl="https://form.highlevelforms.com/YOUR_FORM_URL"
/>
```

This opens a pre-filled form in a new tab instead of sending webhook data.
