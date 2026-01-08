# Role Fetching Analysis

## Problem Identified

The app is **NOT reading roles from `rc_users` table** after login. Here's what I found:

## Current State

### 1. Authentication Hook (`src/auth/supabaseAuth.tsx`)
- ❌ **Does NOT fetch roles** from `rc_users` table
- ❌ **Does NOT fetch roles** from `user_roles` table  
- Only returns basic Supabase auth user object
- Returns: `{ user, session, loading, signInWithEmail, signOut }`
- **Missing**: `roles` and `primaryRole` properties

### 2. Role Landing Redirect (`src/pages/RoleLandingRedirect.tsx`)
- ❌ **Tries to access `user.roles`** (line 11) - **This property doesn't exist!**
- Code: `const r = new Set((user.roles || []).map(x => x.toUpperCase()));`
- This will always be an empty array, causing all users to default to CLIENT portal

### 3. App Context (`src/context/AppContext.tsx`)
- ❌ **Expects `roles` and `primaryRole` from `useAuth()`** (line 56)
- Code: `const { user, roles, primaryRole } = useAuth();`
- But `useAuth()` doesn't provide these properties
- Falls back to default: `const role = (primaryRole ? primaryRole.toUpperCase() : ROLES.ATTORNEY) as Role;`
- **This means it defaults to ATTORNEY, not CLIENT!**

## Role Storage Systems

The app has **TWO different role systems**:

### System 1: `user_roles` table
- Uses `app_role` enum: `'CLIENT', 'ATTORNEY', 'PROVIDER', 'RN_CCM', 'SUPER_USER', 'SUPER_ADMIN'`
- Used by: `src/lib/roleOperations.ts`
- Has function: `getUserRoles(userId)` that queries this table

### System 2: `rc_users` table  
- Uses text field: `role text not null check (role in ('attorney', 'rn_cm', 'supervisor', 'provider', 'client'))`
- Used by: PHI/case management system
- **This is where roles are correctly set** (per user's statement)
- Has `auth_user_id` column linking to `auth.users.id`

## The Fix Applied ✅

1. **Updated `supabaseAuth.tsx`** to:
   - ✅ Query `rc_users` table after login using `auth_user_id`
   - ✅ Fetch the `role` field from `rc_users`
   - ✅ Store roles in state
   - ✅ Map `rc_users.role` values to app role format:
     - `'attorney'` → `'ATTORNEY'`
     - `'rn_cm'` → `'RN_CM'`
     - `'rn'` → `'RN_CM'` (alias)
     - `'provider'` → `'PROVIDER'`
     - `'client'` → `'CLIENT'`
     - `'supervisor'` → `'RN_CM_SUPERVISOR'`
   - ✅ Return `roles` array and `primaryRole` in the auth context
   - ✅ Fetch roles on initial load and when auth state changes

2. **Updated `RoleLandingRedirect.tsx`** to:
   - ✅ Use `roles` from auth context (not `user.roles`)
   - ✅ Properly check roles for routing decisions

## Default Role Behavior

- **AppContext** (`src/context/AppContext.tsx` line 59): Defaults to `ATTORNEY` if `primaryRole` is null
- **RoleLandingRedirect** (`src/pages/RoleLandingRedirect.tsx` line 39): Defaults to `/client-portal` if no role matches

**Note**: If a user has no role in `rc_users`, they will:
- Get `primaryRole = null` in AppContext → defaults to ATTORNEY role
- Get empty `roles` array in RoleLandingRedirect → defaults to CLIENT portal redirect

This is a mismatch that may need to be addressed, but the main issue (not reading roles from `rc_users`) is now fixed.

## Code Locations

- Login/Auth: `src/auth/supabaseAuth.tsx`
- Role Redirect: `src/pages/RoleLandingRedirect.tsx`
- App Context: `src/context/AppContext.tsx`
- Role Operations: `src/lib/roleOperations.ts` (uses `user_roles`, not `rc_users`)
