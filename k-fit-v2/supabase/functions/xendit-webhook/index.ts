import { createClient } from 'jsr:@supabase/supabase-js@2';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // Verify Xendit callback token
  const callbackToken = req.headers.get('x-callback-token');
  const webhookToken = Deno.env.get('XENDIT_WEBHOOK_TOKEN');
  if (!webhookToken || callbackToken !== webhookToken) {
    return json({ error: 'Invalid callback token' }, 401);
  }

  let body: { id?: string; external_id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }

  const invoiceId = body.id;
  const externalId = body.external_id;
  const invoiceStatus = body.status;

  if (!invoiceId || !invoiceStatus) {
    return json({ error: 'Missing invoice id or status' }, 400);
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Match payment by external_id first, fall back to gateway invoice id
  let query = admin
    .from('payments')
    .select('id, member_id, membership_id, status')
    .eq('gateway', 'xendit');

  query = externalId
    ? query.eq('external_id', externalId)
    : query.eq('gateway_invoice_id', invoiceId);

  const { data: payment, error: paymentError } = await query.maybeSingle();

  if (paymentError) {
    console.error('Webhook payment lookup error:', paymentError);
    return json({ error: 'Lookup failed' }, 500);
  }
  if (!payment) {
    // Unknown invoice — acknowledge so Xendit does not retry forever
    return json({ received: true, matched: false });
  }

  // Idempotency: never process a payment twice
  if (payment.status === 'paid') {
    return json({ received: true, duplicate: true });
  }

  if (invoiceStatus === 'PAID') {
    // Conditional update guards against concurrent duplicate webhooks:
    // only the first request flips pending -> paid.
    const { data: updated, error: updateError } = await admin
      .from('payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        gateway_status: invoiceStatus,
        gateway_invoice_id: invoiceId,
      } as any)
      .eq('id', payment.id)
      .neq('status', 'paid')
      .select('id');

    if (updateError) {
      console.error('Webhook payment update error:', updateError);
      return json({ error: 'Update failed' }, 500);
    }

    if (!updated || updated.length === 0) {
      return json({ received: true, duplicate: true });
    }

    // Activate the pending membership only after verified payment
    const { error: membershipError } = await admin
      .from('memberships')
      .update({ status: 'active' } as any)
      .eq('id', payment.membership_id)
      .eq('status', 'pending');

    if (membershipError) {
      console.error('Webhook membership activation error:', membershipError);
      return json({ error: 'Membership activation failed' }, 500);
    }

    return json({ received: true, status: 'paid' });
  }

  if (invoiceStatus === 'EXPIRED') {
    await admin
      .from('payments')
      .update({ status: 'failed', gateway_status: invoiceStatus } as any)
      .eq('id', payment.id)
      .neq('status', 'paid');

    // Leave the pending membership as 'pending'; it can be cleaned up later
    // or superseded by a new purchase.
    return json({ received: true, status: 'expired' });
  }

  // Other statuses (PENDING etc.) — just record gateway status
  await admin
    .from('payments')
    .update({ gateway_status: invoiceStatus } as any)
    .eq('id', payment.id)
    .neq('status', 'paid');

  return json({ received: true, status: invoiceStatus });
});
