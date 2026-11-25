// Membership gate: members without an active membership or a pending payment
// are restricted to the membership/payments screen.
export type MembershipAccess = 'active' | 'pending' | 'none';

export async function getMembershipAccess(userId: string): Promise<MembershipAccess> {
  try {
    const { getSupabaseClient } = await import('./supabase');
    const supabase = getSupabaseClient();

    const today = new Date().toISOString().slice(0, 10);

    // Active membership whose end date hasn't passed
    const { data: active } = await supabase
      .from('memberships')
      .select('id')
      .eq('member_id', userId)
      .eq('status', 'active')
      .gte('end_date', today)
      .limit(1);

    if (active && active.length > 0) return 'active';

    // A pending payment means checkout is in progress — let them through
    const { data: pendingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('member_id', userId)
      .eq('status', 'pending')
      .limit(1);

    if (pendingPayment && pendingPayment.length > 0) return 'pending';

    return 'none';
  } catch (error) {
    console.error('getMembershipAccess failed:', error);
    return 'none';
  }
}
