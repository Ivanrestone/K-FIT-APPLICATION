# Debugging Techniques for K-Fit

This document outlines debugging techniques used during development to help troubleshoot issues quickly.

## General Debugging Strategy

1. **Start with console.log** - Add logs at key points to trace execution flow
2. **Verify data flow** - Check what data is being passed between functions
3. **Check API responses** - Log full error objects from Supabase/external APIs
4. **Test assumptions** - Verify environment variables, user roles, permissions
5. **Isolate the issue** - Remove UI layers to test core logic directly

## Common Debugging Patterns

### Pattern 1: Function Entry/Exit Logging
```typescript
const handleDeleteMember = async (member: Member) => {
  console.log('handleDeleteMember called for:', member.id, 'Role:', member.role);
  // ... function logic
  console.log('handleDeleteMember completed');
};
```

**When to use:**
- When a function isn't being called
- When you need to trace execution order
- When async operations might be failing silently

### Pattern 2: API Call Logging
```typescript
const { error, data, count } = await supabase
  .from('users')
  .delete({ count: 'exact' })
  .eq('id', member.id);

console.log('Users delete count:', count);
if (error) {
  console.error('Users table error:', error);
}
```

**When to use:**
- When database operations fail
- When you need to know if records were affected
- When RLS policies might be blocking operations

### Pattern 3: State Verification
```typescript
console.log('Current state:', { loading, deleting, selectedMember });
```

**When to use:**
- When UI doesn't update after state changes
- When conditional rendering isn't working
- When async operations might be racing

### Pattern 4: Environment Variable Verification
```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', supabaseUrl ? 'set' : 'missing');
console.log('Key:', serviceRoleKey ? serviceRoleKey.substring(0, 20) + '...' : 'missing');
```

**When to use:**
- When environment variables might not be loaded
- When Expo requires specific prefixes (EXPO_PUBLIC_)
- When keys are sensitive (log only first 20 chars)

### Pattern 5: Verification After Operations
```typescript
// After delete
const { data: checkUser } = await supabase
  .from('users')
  .select('id')
  .eq('id', member.id)
  .maybeSingle();

if (checkUser) {
  console.error('ERROR: User still exists after delete!', checkUser);
  throw new Error('Delete failed - user still exists in database');
}
```

**When to use:**
- When operations report success but don't work
- When you need to verify database state
- When caching might be hiding issues

## Debugging the Delete Member Issue

### Problem
Delete button appeared to work but records remained in database.

### Debugging Steps Taken

1. **Added function entry logging**
   - Confirmed function was being called
   - Verified user ID and role were correct

2. **Added API call logging**
   - Discovered delete returned no error
   - Added `{ count: 'exact' }` to see affected rows
   - Found count was 0 (no rows deleted)

3. **Checked RLS policies**
   - Tried adding DELETE policies for admin
   - Got "infinite recursion detected" error
   - Policy was querying users table while deleting from it

4. **Switched to service role client**
   - Added `getServiceRoleClient()` to bypass RLS
   - Added service role key to environment variables
   - Still got count: 0

5. **Verified environment variables**
   - Added logging to check if key was loaded
   - Discovered key was missing EXPO_PUBLIC_ prefix
   - Fixed .env file with correct prefix

6. **Added verification step**
   - Query database after delete to confirm record gone
   - Throw error if record still exists
   - This caught the issue where delete reported success but didn't work

### Key Learnings

- **Supabase delete can return success without deleting** if RLS blocks it
- **RLS policies can cause infinite recursion** if they query the same table
- **Service role key bypasses RLS** but requires EXPO_PUBLIC_ prefix in Expo
- **Always verify after destructive operations** - don't trust success responses
- **Log affected row counts** to distinguish "no error" from "no rows affected"

## Debugging Checklist

When something doesn't work:

- [ ] Add console.log at function entry
- [ ] Add console.log at each async operation
- [ ] Log full error objects (not just messages)
- [ ] Check environment variables are loaded
- [ ] Verify user authentication/role
- [ ] Check RLS policies in Supabase
- [ ] Add count/exact to database operations
- [ ] Verify result after operation
- [ ] Check for TypeScript errors
- [ ] Restart dev server after env changes

## Expo-Specific Debugging

### Environment Variables
- Must use `EXPO_PUBLIC_` prefix for client-side access
- Changes to .env require dev server restart
- Check `env: load .env` output on startup

### Router Issues
- Route paths must match file structure in src/app/
- TypeScript errors about routes are normal during dev
- Use `router.push()` for navigation, not `router.replace()` for back navigation

### Supabase in Expo
- Use `@supabase/supabase-js` package
- Initialize client on client-side only (typeof window !== 'undefined')
- Service role key for admin operations, anon key for user operations

## Common Issues and Solutions

### Issue: "Missing Supabase service role environment variable"
**Solution:** Add `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to .env and restart dev server

### Issue: Delete returns success but record still exists
**Solution:** 
1. Check if using service role client (bypasses RLS)
2. Add `{ count: 'exact' }` to see affected rows
3. Verify with a SELECT query after delete

### Issue: "infinite recursion detected in policy"
**Solution:** Don't query the same table in RLS policy. Use `auth.jwt()->>'role'` instead.
**Applied fix (Nov 2026):** `is_admin()`, `is_coach()`, and `is_member()` are `SECURITY DEFINER` (`SET search_path = public`). The "Members can request a coach" INSERT policy on `coach_clients` was rewritten to use `is_member()` instead of a direct `EXISTS (SELECT 1 FROM users ...)` — the direct table reference created a `coach_clients` ↔ `users` policy cycle that Postgres rejects even when helper functions are definer. **Rule: never put a direct subquery on another RLS-protected table inside a policy `qual`/`with_check` — route it through a SECURITY DEFINER function.** Inspect/fix policies with `npx supabase db query --remote --read-only "SELECT ... FROM pg_policies ..."` (add `--yes` for writes).

### Issue: Alert dialogs not showing
**Solution:** Alert.alert might not work in web. Use console.log for debugging in web environment.

### Issue: Multiple GoTrueClient instances warning
**Solution:** This is a warning, not an error. Can be ignored or fixed by reusing client instances.
