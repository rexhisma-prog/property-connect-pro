import { Deno } from 'https://deno.land/std@0.177.0/node/process.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeSignature = req.headers.get('stripe-signature');
  const body = await req.text();

  // In production: verify Stripe signature
  // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  // const event = stripe.webhooks.constructEvent(body, stripeSignature!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const metadata = paymentIntent.metadata || {};

    if (metadata.type === 'credit_package') {
      // Credit purchase: add credits to user
      const { user_id, package_id, credits_amount } = metadata;
      
      await supabase.from('credit_transactions').update({ status: 'paid' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      await supabase.rpc('increment_credits', { 
        p_user_id: user_id, 
        p_credits: parseInt(credits_amount) 
      }).catch(async () => {
        // Fallback: direct update
        const { data: user } = await supabase.from('users').select('credits_remaining').eq('id', user_id).single();
        if (user) {
          await supabase.from('users').update({ 
            credits_remaining: user.credits_remaining + parseInt(credits_amount) 
          }).eq('id', user_id);
        }
      });

    } else if (metadata.type === 'extra_package') {
      // Extra purchase: update property
      const { property_id, extra_type, duration_days } = metadata;
      
      await supabase.from('extra_transactions').update({ status: 'paid' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      const now = new Date();
      const until = new Date(now.getTime() + parseInt(duration_days) * 24 * 60 * 60 * 1000);

      if (extra_type === 'featured') {
        await supabase.from('properties').update({
          is_featured: true,
          featured_until: until.toISOString(),
        }).eq('id', property_id);
      } else if (extra_type === 'urgent') {
        await supabase.from('properties').update({
          is_urgent: true,
          urgent_until: until.toISOString(),
        }).eq('id', property_id);
      } else if (extra_type === 'boost') {
        await supabase.from('properties').update({
          last_boosted_at: now.toISOString(),
        }).eq('id', property_id);
      }

    } else if (metadata.type === 'ad_purchase') {
      // Ad purchase: activate ad
      const { ad_id } = metadata;
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await supabase.from('ad_transactions').update({ status: 'paid' })
        .eq('stripe_payment_intent_id', paymentIntent.id);

      await supabase.from('ads').update({
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
      }).eq('id', ad_id);
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    // Mark all related transactions as failed
    await supabase.from('credit_transactions').update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
    await supabase.from('extra_transactions').update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
    await supabase.from('ad_transactions').update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
