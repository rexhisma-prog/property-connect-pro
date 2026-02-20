import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping: extra_package DB id -> Stripe price id
const EXTRA_PRICE_MAP: Record<string, string> = {
  "fb45d830-a31f-4672-b0f0-21c56cbc6a0c": "price_1T2yGZJSjWCE502nlFkYI02K", // Featured 7 ditë
  "265c0179-05bb-4625-86ea-adfbff9f609f": "price_1T2yGuJSjWCE502n1h6y57OG", // Featured 30 ditë
  "e7d37dd4-1cf0-4140-9ab7-3c2eb3c39666": "price_1T2yH6JSjWCE502nCF1JwS7w", // Urgent 7 ditë
  "6703b740-11be-47d6-8630-23362b0e341f": "price_1T2yHLJSjWCE502nOQWJGGIo", // Urgent 30 ditë
  "ee05665c-b402-4e7b-bf62-fc3c2b08e860": "price_1T2yHsJSjWCE502nYvy8NsJ6", // Boost
};

// Mapping: credit_package DB id -> Stripe price id
const CREDIT_PRICE_MAP: Record<string, string> = {
  "bf0f27d0-5e6f-4ef5-a801-2e5b47ae773b": "price_1T2yIAJSjWCE502n6SYmM9X5", // 1 Kredit
  "30bb747f-f8ec-4842-8fcc-97f6ad9cf400": "price_1T2yINJSjWCE502nNdUbYMhw", // 2 Kredite
  "70a84b77-270b-4407-8e77-e7518a9aecdc": "price_1T2yIsJSjWCE502n1HvHNjrz", // 3 Kredite
  "23db3644-0c61-4d3a-92fb-4edf5dbdd9f4": "price_1T2yJDJSjWCE502nDr8rhLvN", // 4 Kredite
  "f2fc30ea-7a4b-437b-9dc9-ee61833cd96b": "price_1T2yJNJSjWCE502nbxg0BzuW", // 5 Kredite
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const body = await req.json();
    const { type, package_id, property_id } = body;
    // type: "extra" | "credit"

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    let priceId: string;
    let metadata: Record<string, string> = {};
    let successUrl: string;
    const origin = req.headers.get("origin") || "";

    if (type === "extra") {
      priceId = EXTRA_PRICE_MAP[package_id];
      if (!priceId) throw new Error("Invalid extra package");

      // Get extra package details
      const { data: pkg } = await supabaseClient.from("extra_packages").select("*").eq("id", package_id).single();
      if (!pkg) throw new Error("Package not found");

      metadata = {
        type: "extra_package",
        user_id: user.id,
        property_id: property_id,
        extra_package_id: package_id,
        extra_type: pkg.type,
        duration_days: String(pkg.duration_days),
        amount: String(pkg.price_eur),
      };
      successUrl = `${origin}/dashboard/properties/${property_id}/extras?payment=success`;
    } else if (type === "credit") {
      priceId = CREDIT_PRICE_MAP[package_id];
      if (!priceId) throw new Error("Invalid credit package");

      const { data: pkg } = await supabaseClient.from("credit_packages").select("*").eq("id", package_id).single();
      if (!pkg) throw new Error("Package not found");

      metadata = {
        type: "credit_package",
        user_id: user.id,
        package_id: package_id,
        credits_amount: String(pkg.credits_amount),
        amount: String(pkg.price_eur),
      };
      successUrl = `${origin}/dashboard/buy-credits?payment=success`;
    } else {
      throw new Error("Invalid checkout type");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl,
      cancel_url: `${origin}/dashboard/properties`,
      metadata,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[CREATE-CHECKOUT] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
