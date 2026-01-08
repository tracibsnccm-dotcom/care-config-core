# Required Environment Variables for Vercel

## Found in .env.local

Based on the local environment file, here are the **variable names** (not values) that need to be set in Vercel:

### Client-Side Variables (VITE_ prefix)

These are used by the React app in the browser:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Sanitized example from .env.local:**
```
VITE_SUPABASE_URL=https://***.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.***
```

---

## Complete List of Required Variables

### 🔴 CRITICAL - Must be set for app to work

#### Client-Side (React App):
1. **`VITE_SUPABASE_URL`**
   - Used in: `src/integrations/supabase/client.ts`, `src/auth/supabaseAuth.tsx`
   - Example format: `https://xxxxx.supabase.co`

2. **`VITE_SUPABASE_ANON_KEY`**
   - Used in: `src/integrations/supabase/client.ts`, `src/auth/supabaseAuth.tsx`
   - Example format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Server-Side (API Routes):
3. **`SUPABASE_URL`**
   - Used in: `api/crisis-buddy-checklist.ts`, `api/crisis-incidents.ts`, `api/crisis-supervisor-actions.ts`
   - Same value as `VITE_SUPABASE_URL` but without the `VITE_` prefix

4. **`SUPABASE_SERVICE_ROLE_KEY`**
   - Used in: All API routes
   - ⚠️ **Keep this secret!** This has admin privileges
   - Different from `VITE_SUPABASE_ANON_KEY` - this is the service role key

---

### 🟢 OPTIONAL Variables

These are optional and the app will work without them:

- `VITE_ENABLE_DEMO` - Set to `"true"` to enable demo mode (default: disabled)
- `VITE_PROVIDER_CONFIRMATION_URL` - Webhook URL for provider confirmations
- `VITE_WEBHOOK_SECURITY_TOKEN` - Security token for webhooks
- `VITE_GAS_URL` - Google Apps Script URL (currently commented out in code)
- `ALLOW_TEST_SETUP` - Set to `"true"` to allow test setup endpoint

---

## How to Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: The actual value from your Supabase dashboard
   - **Environment**: Select **Production** (and optionally Preview/Development)

4. **Important**: 
   - Client-side variables MUST start with `VITE_` prefix
   - Server-side variables (for API routes) do NOT have `VITE_` prefix
   - Make sure to set them for the **Production** environment

5. After adding variables, **redeploy** your application

---

## Where to Find Your Supabase Values

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. You'll find:
   - **Project URL** → Use for `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

---

## Quick Checklist

- [ ] `VITE_SUPABASE_URL` set in Vercel Production
- [ ] `VITE_SUPABASE_ANON_KEY` set in Vercel Production
- [ ] `SUPABASE_URL` set in Vercel Production (if using API routes)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel Production (if using API routes)
- [ ] Variables are set for **Production** environment (not just Preview)
- [ ] Application redeployed after adding variables

---

## Summary

**Minimum required for app to work:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**If using API routes, also add:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
