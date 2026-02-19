import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find valid OTP code
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      console.log('OTP lookup failed:', fetchError, 'record:', otpRecord);
      return new Response(JSON.stringify({ error: 'Kodi është i gabuar ose ka skaduar.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark code as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // Use a temporary password to create/sign in the user
    const tempPassword = `OTP_${code}_${Date.now()}`;

    // Check if user already exists
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      // User exists — update their password temporarily and confirm email to sign them in
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
        email_confirm: true,
      });
    } else {
      // Create new user
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(JSON.stringify({ error: 'Gabim gjatë krijimit të llogarisë.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Sign in with the temporary password to get a real session
    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: tempPassword,
    });

    if (signInError || !signInData?.session) {
      console.error('Sign in error:', signInError);
      return new Response(JSON.stringify({ error: 'Gabim gjatë hyrjes në llogari.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
