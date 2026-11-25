import { getSupabaseClient } from "@/lib/supabase";

export type PointsTransaction = {
  id: string;
  amount: number;
  transaction_type: "earn" | "deduction" | "adjustment" | "challenge_reward";
  source: string;
  reference_id: string | null;
  description: string;
  created_at: string;
};

const client = () => getSupabaseClient() as any;

export async function getMemberPointsBalance(memberId: string): Promise<number> {
  const { data, error } = await client()
    .from("member_points")
    .select("balance")
    .eq("member_id", memberId)
    .maybeSingle();
  if (error) throw error;
  return Number(data?.balance ?? 0);
}

export async function getMemberPointsTransactions(
  memberId: string,
  limit = 30,
): Promise<PointsTransaction[]> {
  const { data, error } = await client()
    .from("points_transactions")
    .select(
      "id, amount, transaction_type, source, reference_id, description, created_at",
    )
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as PointsTransaction[];
}

export async function adminAdjustMemberPoints(input: {
  memberId: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
}): Promise<string> {
  const { data, error } = await client().rpc("admin_adjust_member_points", {
    p_member_id: input.memberId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data as string;
}
