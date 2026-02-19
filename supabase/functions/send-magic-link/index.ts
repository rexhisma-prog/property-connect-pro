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
    const { email, redirectTo } = await req.json();

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

    // Generate magic link via Admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: redirectTo || 'https://www.shitepronen.com/dashboard',
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error('Error generating magic link:', error);
      return new Response(JSON.stringify({ error: error?.message || 'Failed to generate magic link' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const magicLink = data.properties.action_link;

    // Send email via SMTP using fetch to smtp-compatible service
    const smtpHost = Deno.env.get('SMTP_HOST') || 'mail.privateemail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER') || '';
    const smtpPass = Deno.env.get('SMTP_PASS') || '';

    // Use Deno TCP with TLS for SSL/TLS SMTP (port 465)
    const emailSent = await sendSmtpEmail({
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      pass: smtpPass,
      to: email,
      from: `ShitePronen.com <${smtpUser}>`,
      subject: 'Hyrja juaj në ShitePronen.com',
      html: buildEmailHtml(magicLink, email),
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
    // Connect with TLS (SSL/TLS on port 465)
    const conn = await Deno.connectTls({
      hostname: opts.host,
      port: opts.port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readLine = async (): Promise<string> => {
      const buf = new Uint8Array(4096);
      let result = '';
      while (true) {
        const n = await conn.read(buf);
        if (n === null) break;
        result += decoder.decode(buf.subarray(0, n));
        if (result.includes('\r\n')) break;
      }
      return result;
    };

    const send = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + '\r\n'));
    };

    // Read server greeting
    await readLine();

    // EHLO
    await send(`EHLO shitepronen.com`);
    let ehloResp = '';
    while (true) {
      const line = await readLine();
      ehloResp += line;
      if (line.includes('250 ') || line.match(/250[^-]/)) break;
    }

    // AUTH LOGIN
    await send('AUTH LOGIN');
    await readLine();
    await send(btoa(opts.user));
    await readLine();
    await send(btoa(opts.pass));
    const authResp = await readLine();
    if (!authResp.includes('235')) {
      console.error('SMTP auth failed:', authResp);
      conn.close();
      return false;
    }

    // MAIL FROM
    await send(`MAIL FROM:<${opts.user}>`);
    await readLine();

    // RCPT TO
    await send(`RCPT TO:<${opts.to}>`);
    await readLine();

    // DATA
    await send('DATA');
    await readLine();

    // Email content
    const boundary = `boundary_${Date.now()}`;
    const message = [
      `From: ${opts.from}`,
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: quoted-printable`,
      ``,
      opts.html,
      ``,
      `--${boundary}--`,
      `.`,
    ].join('\r\n');

    await conn.write(encoder.encode(message + '\r\n'));
    const dataResp = await readLine();
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

function buildEmailHtml(magicLink: string, email: string): string {
  return `<!DOCTYPE html>
<html lang="sq">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hyrja juaj në ShitePronen.com</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:32px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:bold;color:#ffffff;">shite<span style="color:#f97316;">pronen</span>.com</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 12px;font-size:24px;color:#111827;font-weight:700;">Mirë se vini!</h1>
              <p style="margin:0 0 8px;color:#6b7280;font-size:15px;">Kemi marrë një kërkesë hyrjeje për:</p>
              <p style="margin:0 0 28px;color:#111827;font-size:15px;font-weight:600;">${email}</p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Klikoni butonin më poshtë për të hyrë në llogarinë tuaj. Ky link është i vlefshëm për <strong>60 minuta</strong>.</p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#f97316;border-radius:8px;">
                    <a href="${magicLink}" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;">
                      Hyr në Llogari
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">Nëse butoni nuk funksionon, kopjoni dhe ngjisni këtë link në shfletues:</p>
              <p style="margin:0;word-break:break-all;font-size:11px;color:#6b7280;">${magicLink}</p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Nëse nuk e kërkuat këtë, mund ta injoroni këtë email.</p>
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
