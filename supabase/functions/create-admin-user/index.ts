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
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const ADMIN_ID = 'c504d6e1-93d0-4648-a27f-05f3ca048556';
  const email = 'rexh.isma@gmail.com';
  const password = 'Admin1234!';

  // Directly update the password using the known user ID
  const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    ADMIN_ID,
    { password, email_confirm: true }
  );

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Ensure public.users is correct
  await supabaseAdmin.from('users').upsert({
    id: ADMIN_ID, email, full_name: 'Super Admin', role: 'admin', status: 'active',
  }, { onConflict: 'id' });

  // Insert user_roles if not exists
  const { data: existingRole } = await supabaseAdmin.from('user_roles').select('id').eq('user_id', ADMIN_ID).maybeSingle();
  if (!existingRole) {
    await supabaseAdmin.from('user_roles').insert({ user_id: ADMIN_ID, role: 'admin' });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Password updated successfully',
    user_email: updated.user?.email,
    confirmed: updated.user?.email_confirmed_at,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
