import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Find user by email
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  const user = users?.find(u => u.email === 'rexh.isma@gmail.com');

  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'User not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: 'Admin!shitepronen',
  });

  return new Response(JSON.stringify({
    success: !error,
    error: error?.message,
    user_id: user.id,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
