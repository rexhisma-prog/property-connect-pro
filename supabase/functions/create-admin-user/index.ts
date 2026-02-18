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

  const email = 'rexh.isma@gmail.com';
  const password = 'Admin1234!';

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError && !authError.message.includes('already been registered')) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const userId = authData?.user?.id;

  if (!userId) {
    // User might already exist, find them
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find(u => u.email === email);
    if (!found) {
      return new Response(JSON.stringify({ error: 'Could not find or create user' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update password for existing user
    await supabaseAdmin.auth.admin.updateUserById(found.id, { password });

    // Ensure public.users record exists
    await supabaseAdmin.from('users').upsert({
      id: found.id,
      email,
      full_name: 'Super Admin',
      role: 'admin',
      status: 'active',
    }, { onConflict: 'id' });

    // Ensure user_roles record
    await supabaseAdmin.from('user_roles').upsert({
      user_id: found.id,
      role: 'admin',
    }, { onConflict: 'user_id' });

    return new Response(JSON.stringify({ success: true, message: 'Admin updated', id: found.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // New user - create public records
  await supabaseAdmin.from('users').upsert({
    id: userId,
    email,
    full_name: 'Super Admin',
    role: 'admin',
    status: 'active',
  }, { onConflict: 'id' });

  await supabaseAdmin.from('user_roles').upsert({
    user_id: userId,
    role: 'admin',
  }, { onConflict: 'user_id' });

  return new Response(JSON.stringify({ success: true, message: 'Admin created', id: userId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
