import { createClient } from 'jsr:@supabase/supabase-js@2';

const XENDIT_API = 'https://api.xendit.co';
const INVOICE_DURATION_SECONDS = 86400; // 24 hours

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function toDateString(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const xenditSecret = Deno.env.get('XENDIT_SECRET_KEY');

  if (!xenditSecret) return json({ error: 'Payment gateway not configured' }, 500);

  // Authenticate the member
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  const admin = createClient(supabaseUrl, serviceKey);

  let body: { plan_id?: string; success_redirect_url?: string; failure_redirect_url?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const { plan_id, success_redirect_url, failure_redirect_url } = body;
  if (!plan_id) return json({ error: 'plan_id is required' }, 400);

  // Validate plan and use server-side price — never trust the client amount
  const { data: plan, error: planError } = await admin
    .from('membership_plans')
    .select('id, name, price, duration_days, status')
    .eq('id', plan_id)
    .eq('status', 'active')
    .maybeSingle();

  if (planError || !plan) return json({ error: 'Invalid or inactive membership plan' }, 400);
  const amount = Number(plan.price);
  if (!amount || amount <= 0) return json({ error: 'Plan has no valid price' }, 400);

  // Resolve member record (members.id === auth user id in this schema)
  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (!member) return json({ error: 'No member profile found for this account' }, 400);

  // Idempotency: reuse an existing pending checkout for the same plan
  const { data: pendingPayments } = await admin
    .from('payments')
    .select('id, checkout_url, memberships!inner(plan_id, status)')
    .eq('member_id', user.id)
    .eq('status', 'pending')
    .eq('memberships.plan_id', plan.id)
    .eq('memberships.status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  const existing = pendingPayments?.[0] as any;
  if (existing?.checkout_url) {
    return json({ checkout_url: existing.checkout_url, payment_id: existing.id, reused: true });
  }

  // Compute membership window: renewals start at the current active end date
  const { data: activeMembership } = await admin
    .from('memberships')
    .select('end_date')
    .eq('member_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const startDate = activeMembership?.end_date
    ? new Date(`${activeMembership.end_date}T00:00:00Z`)
    : new Date();
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + plan.duration_days);

  // Pending membership — activated only by the webhook after verified payment
  const { data: membership, error: membershipError } = await admin
    .from('memberships')
    .insert({
      member_id: user.id,
      plan_id: plan.id,
      start_date: toDateString(startDate),
      end_date: toDateString(endDate),
      status: 'pending',
    } as any)
    .select('id')
    .single();

  if (membershipError || !membership) {
    return json({ error: 'Failed to create membership record' }, 500);
  }

  const external_id = crypto.randomUUID();

  const { data: payment, error: paymentError } = await admin
    .from('payments')
    .insert({
      member_id: user.id,
      membership_id: membership.id,
      amount: plan.price,
      payment_method: 'online',
      status: 'pending',
      reference_number: external_id,
      gateway: 'xendit',
      external_id,
      gateway_status: 'pending',
    } as any)
    .select('id')
    .single();

  if (paymentError || !payment) {
    await admin.from('memberships').delete().eq('id', membership.id);
    return json({ error: 'Failed to create payment record' }, 500);
  }

  // Create Xendit hosted invoice
  const invoicePayload: Record<string, unknown> = {
    external_id,
    amount,
    description: `${plan.name} — K-Fit Gym Membership`,
    invoice_duration: INVOICE_DURATION_SECONDS,
    currency: 'PHP',
    payer_email: user.email,
  };
  if (success_redirect_url) invoicePayload.success_redirect_url = success_redirect_url;
  if (failure_redirect_url) invoicePayload.failure_redirect_url = failure_redirect_url;

  const xenditResponse = await fetch(`${XENDIT_API}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${xenditSecret}:`)}`,
    },
    body: JSON.stringify(invoicePayload),
  });

  const invoice = await xenditResponse.json();

  if (!xenditResponse.ok || !invoice?.id || !invoice?.invoice_url) {
    console.error('Xendit invoice creation failed:', invoice);
    await admin
      .from('payments')
      .update({ status: 'failed', gateway_status: 'failed' } as any)
      .eq('id', payment.id);
    return json({ error: 'Failed to create payment invoice' }, 502);
  }

  await admin
    .from('payments')
    .update({
      gateway_invoice_id: invoice.id,
      checkout_url: invoice.invoice_url,
      gateway_status: invoice.status,
    } as any)
    .eq('id', payment.id);

  return json({
    checkout_url: invoice.invoice_url,
    payment_id: payment.id,
    external_id,
    amount,
    plan_name: plan.name,
  });
});
