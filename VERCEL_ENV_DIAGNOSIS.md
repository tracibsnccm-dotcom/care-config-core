# Vercel Production Environment Variables Diagnosis

## 1. .env Files Check

**Result:** No `.env*` files found in the project root (this is expected - they should be gitignored)

- No `.env` file
- No `.env.local` file  
- No `.env.example` file
- No `.env.production` file

**Note:** Environment variables should be configured directly in Vercel's dashboard, not committed to the repository.

---

## 2. Supabase Configuration Analysis

### Client-Side Supabase Configuration

The Supabase client is initialized in **two locations** using environment variables:

#### Location 1: `src/integrations/supabase/client.ts`
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### Location 2: `src/auth/supabaseAuth.tsx`
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**⚠️ CRITICAL ISSUE:** If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are `undefined` or empty strings, the Supabase client will fail to initialize, causing the app to crash with a blank screen.

### Server-Side Supabase Configuration (API Routes)

The API routes in `/api` use different environment variable names:

- `api/crisis-buddy-checklist.ts`
- `api/crisis-incidents.ts`
- `api/crisis-supervisor-actions.ts`

All use:
```typescript
const supabaseUrl = process.env.SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
```

**Note:** Server-side routes use `process.env` (not `import.meta.env`) and different variable names.

---

## 3. Vite Configuration Check

**File:** `vite.config.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

**Status:** ✅ No production-specific issues found. The config is standard and should work fine in production.

**Note:** Vite automatically exposes environment variables prefixed with `VITE_` to the client-side code. Make sure all required `VITE_*` variables are set in Vercel.

---

## 4. All Environment Variables Required in Vercel

### 🔴 CRITICAL (Required for app to work)

These must be set or the app will show a blank screen:

| Variable Name | Type | Used In | Description |
|--------------|------|---------|-------------|
| `VITE_SUPABASE_URL` | Client | `src/integrations/supabase/client.ts`<br>`src/auth/supabaseAuth.tsx`<br>Multiple components | Your Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client | `src/integrations/supabase/client.ts`<br>`src/auth/supabaseAuth.tsx` | Your Supabase anonymous/public key |

### 🟡 IMPORTANT (Required for API routes)

| Variable Name | Type | Used In | Description |
|--------------|------|---------|-------------|
| `SUPABASE_URL` | Server | `api/crisis-buddy-checklist.ts`<br>`api/crisis-incidents.ts`<br>`api/crisis-supervisor-actions.ts` | Same as `VITE_SUPABASE_URL` but for server-side API routes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | All API routes | Supabase service role key (has admin privileges, keep secret!) |

### 🟢 OPTIONAL (App will work without these)

| Variable Name | Type | Used In | Description |
|--------------|------|---------|-------------|
| `VITE_ENABLE_DEMO` | Client | `src/main.tsx` | Set to `"true"` to enable `/demo` route (default: disabled) |
| `VITE_PROVIDER_CONFIRMATION_URL` | Client | `src/config/webhooks.ts` | External webhook URL for provider confirmations |
| `VITE_WEBHOOK_SECURITY_TOKEN` | Client | `src/config/webhooks.ts` | Security token for webhook authentication |
| `VITE_GAS_URL` | Client | `src/pages/rncm/RNCMCompliance.tsx`<br>`src/modules/rcms-intake-extras.tsx` | Google Apps Script URL (commented out, optional) |
| `ALLOW_TEST_SETUP` | Server | `api/test-setup.ts` | Set to `"true"` to allow test setup endpoint in production |

---

## 5. How to Fix the Blank Screen Issue

### Step 1: Set Required Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### For Production Environment:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Optional (if needed):
```
VITE_ENABLE_DEMO=false
VITE_PROVIDER_CONFIRMATION_URL=
VITE_WEBHOOK_SECURITY_TOKEN=
```

### Step 2: Redeploy

After adding the environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Select **Redeploy**

Or push a new commit to trigger a new deployment.

### Step 3: Verify

1. Check the browser console for errors
2. Look for messages like:
   - `"Missing VITE_SUPABASE_URL"`
   - `"Supabase client initialization failed"`
   - Any network errors to Supabase endpoints

---

## 6. Common Issues

### Issue: Blank Screen with No Errors
**Cause:** `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are undefined  
**Fix:** Add these environment variables in Vercel and redeploy

### Issue: Blank Screen with Console Errors
**Cause:** Supabase client fails to initialize  
**Fix:** Verify the Supabase URL and keys are correct (no trailing slashes, correct format)

### Issue: API Routes Return 500 Errors
**Cause:** `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` are missing  
**Fix:** Add these server-side environment variables in Vercel

### Issue: Environment Variables Not Working
**Cause:** Variables not prefixed with `VITE_` for client-side  
**Fix:** Client-side variables MUST start with `VITE_` prefix in Vite projects

---

## 7. Quick Checklist

- [ ] `VITE_SUPABASE_URL` is set in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` is set in Vercel
- [ ] `SUPABASE_URL` is set in Vercel (for API routes)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (for API routes)
- [ ] Environment variables are set for **Production** environment (not just Preview/Development)
- [ ] Redeployed after adding environment variables
- [ ] Checked browser console for errors
- [ ] Verified Supabase project is active and accessible

---

## 8. Where to Find Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Find:
   - **Project URL** → Use for `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

---

## Summary

**Most Likely Cause of Blank Screen:**
Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` environment variables in Vercel production environment.

**Quick Fix:**
1. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel environment variables
2. Redeploy the application
3. The app should now load correctly
