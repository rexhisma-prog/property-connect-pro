import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const body = await req.text();

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  console.log('[STRIPE-WEBHOOK] Event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const metadata = session.metadata || {};
    console.log('[STRIPE-WEBHOOK] Metadata:', JSON.stringify(metadata));

    if (metadata.type === 'credit_package') {
      const { user_id, package_id, credits_amount, amount } = metadata;

      // Record transaction
      await supabase.from('credit_transactions').insert({
        user_id,
        package_id,
        credits_added: parseInt(credits_amount),
        amount_paid: parseFloat(amount),
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent,
      });

      // Add credits to user
      const { data: user } = await supabase.from('users').select('credits_remaining').eq('id', user_id).single();
      if (user) {
        await supabase.from('users').update({
          credits_remaining: user.credits_remaining + parseInt(credits_amount)
        }).eq('id', user_id);
      }
      console.log('[STRIPE-WEBHOOK] Credits added:', credits_amount, 'to user:', user_id);

    } else if (metadata.type === 'extra_package') {
      const { user_id, property_id, extra_package_id, extra_type, duration_days, amount } = metadata;

      // Record transaction
      await supabase.from('extra_transactions').insert({
        user_id,
        property_id,
        extra_package_id,
        amount_paid: parseFloat(amount),
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent,
      });

      // Activate extra on property
      const now = new Date();
      if (extra_type === 'featured') {
        const until = new Date(now.getTime() + parseInt(duration_days) * 86400000);
        await supabase.from('properties').update({
          is_featured: true,
          featured_until: until.toISOString(),
        }).eq('id', property_id);
      } else if (extra_type === 'urgent') {
        const until = new Date(now.getTime() + parseInt(duration_days) * 86400000);
        await supabase.from('properties').update({
          is_urgent: true,
          urgent_until: until.toISOString(),
        }).eq('id', property_id);
      } else if (extra_type === 'boost') {
        await supabase.from('properties').update({
          last_boosted_at: now.toISOString(),
        }).eq('id', property_id);
      }
      console.log('[STRIPE-WEBHOOK] Extra activated:', extra_type, 'on property:', property_id);

    } else if (metadata.type === 'ad_purchase') {
      const { ad_id } = metadata;
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 86400000);

      await supabase.from('ad_transactions').update({ status: 'paid' })
        .eq('stripe_payment_intent_id', session.payment_intent);
      await supabase.from('ads').update({
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
      }).eq('id', ad_id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
