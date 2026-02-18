import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Test login with anon client
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );

  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: 'rexh.isma@gmail.com',
    password: 'Admin1234!',
  });

  return new Response(JSON.stringify({
    success: !error,
    error: error?.message,
    user_id: data?.user?.id,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
