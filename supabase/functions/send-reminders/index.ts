// @ts-nocheck
// Supabase Edge Function: send-reminders
// Triggered via pg_cron daily at 09:00 WIB
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

serve(async (req: Request) => {
  try {
    const cronSecret = Deno.env.get('CRON_SECRET') || 'cicilanku-cron-secret-12345';
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';

    console.log(`[Edge Function] Triggering reminders to ${appUrl}/api/cron/reminders`);

    const response = await fetch(`${appUrl}/api/cron/reminders`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify({ status: 'ok', data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
