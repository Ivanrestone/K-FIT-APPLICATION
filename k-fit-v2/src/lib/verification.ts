// Member verification gate: members must be approved by an admin (or have an
// email on the access_grants list) before they can use the member app.
export type ApprovalStatus = 'approved' | 'pending';

/**
 * Returns whether the given user may access member features.
 * - admin/coach roles always pass
 * - members pass when users.approved = true
 * - fallback: email found in access_grants also counts as approved
 * - fails OPEN on unexpected errors so the app never locks everyone out
 *   if the migration has not been applied yet
 */
export async function getApprovalStatus(user: any): Promise<ApprovalStatus> {
  try {
    if (!user?.id) return 'pending';

    const role = user?.user_metadata?.role || 'member';
    if (role === 'admin' || role === 'coach') return 'approved';

    const { getSupabaseClient } = await import('./supabase');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('approved')
      .eq('id', user.id)
      .maybeSingle();

    // If the approved column doesn't exist yet (migration not run),
    // fail open so the app keeps working.
    if (error) {
      console.warn('getApprovalStatus: approved column missing, allowing access:', error.message);
      return 'approved';
    }

    if (data && (data as any).approved === true) {
      return 'approved';
    }

    // approved === false → check access grant fallback
    const email = user.email;
    if (email) {
      const { data: grant, error: grantError } = await supabase
        .from('access_grants')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();

      if (!grantError && grant) return 'approved';
    }

    return 'pending';
  } catch (error) {
    console.error('getApprovalStatus failed:', error);
    return 'approved'; // fail open — see note above
  }
}
