/**
 * Web Push & Notification Helper
 * Menangani pengiriman notifikasi Push dan Email (Resend)
 */

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  type: 'h-3' | 'h-1' | 'h-0' | 'inactivity';
}

/**
 * Kirim email pemberitahuan via Resend API
 */
export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'CicilanKu <notifications@resend.dev>';

  if (!apiKey || apiKey.includes('placeholder')) {
    console.log('[CicilanKu Reminder Mock] Email to:', params.to, 'Subject:', params.subject);
    return { success: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      return { success: false, error: JSON.stringify(errData) };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
