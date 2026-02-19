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
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate any previous unused codes for this email
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Store new OTP code (expires in 10 minutes)
    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({ email, code });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate code' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email via SMTP
    const smtpHost = Deno.env.get('SMTP_HOST') || 'mail.privateemail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER') || '';
    const smtpPass = Deno.env.get('SMTP_PASS') || '';

    const emailSent = await sendSmtpEmail({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      to: email,
      from: `ShitePronen.com <${smtpUser}>`,
      subject: `${code} — Kodi juaj i hyrjes`,
      html: buildEmailHtml(code, email),
    });

    if (!emailSent) {
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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

async function sendSmtpEmail(opts: {
  host: string;
  port: number;
  user: string;
  pass: string;
  to: string;
  from: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const conn = await Deno.connectTls({
      hostname: opts.host,
      port: opts.port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(8192);
      let result = '';
      while (true) {
        const n = await conn.read(buf);
        if (n === null) break;
        result += decoder.decode(buf.subarray(0, n));
        if (/^\d{3} /m.test(result) || result.endsWith('\r\n')) break;
      }
      return result;
    };

    const send = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + '\r\n'));
    };

    await readResponse(); // greeting

    await send('EHLO shitepronen.com');
    await readResponse();

    await send('AUTH LOGIN');
    await readResponse();
    await send(btoa(opts.user));
    await readResponse();
    await send(btoa(opts.pass));
    const authResp = await readResponse();

    if (!authResp.includes('235')) {
      console.error('SMTP auth failed:', authResp);
      conn.close();
      return false;
    }

    await send(`MAIL FROM:<${opts.user}>`);
    await readResponse();

    await send(`RCPT TO:<${opts.to}>`);
    await readResponse();

    await send('DATA');
    await readResponse();

    const boundary = `b_${Date.now()}`;
    const message = [
      `From: ${opts.from}`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      opts.html,
      ``,
      `--${boundary}--`,
      `.`,
    ].join('\r\n');

    await conn.write(encoder.encode(message + '\r\n'));
    const dataResp = await readResponse();

    if (!dataResp.includes('250')) {
      console.error('SMTP data failed:', dataResp);
      conn.close();
      return false;
    }

    await send('QUIT');
    conn.close();
    return true;

  } catch (err) {
    console.error('SMTP error:', err);
    return false;
  }
}

function buildEmailHtml(code: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
              <img src="https://daztdyskforqmcokwexv.supabase.co/storage/v1/object/public/property-images/branding%2Flogo.png" alt="ShitePronen.com" style="height:48px;width:auto;display:inline-block;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 16px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827;font-weight:700;">Kodi juaj i hyrjes</h1>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;">Për llogarinë: <strong>${email}</strong></p>
              <!-- OTP Code -->
              <div style="background:#f9fafb;border:2px dashed #e5e7eb;border-radius:12px;padding:28px 20px;margin:0 auto 28px;display:inline-block;width:100%;box-sizing:border-box;">
                <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Kodi juaj</p>
                <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#111827;font-family:monospace;">${code}</p>
              </div>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Ky kod është i vlefshëm për <strong>10 minuta</strong>.</p>
              <p style="margin:0 0 28px;color:#9ca3af;font-size:12px;">Nëse nuk e kërkuat këtë, mund ta injoroni emailin.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 ShitePronen.com — Platforma #1 e Pronave në Shqipëri</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
