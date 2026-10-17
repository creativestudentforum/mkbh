type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info("Email skipped: RESEND_API_KEY or EMAIL_FROM is not configured.");
    return { skipped: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const message = await response.text();
      console.error("Email failed:", message);
      return { error: message };
    }

    return { ok: true };
  } catch (error) {
    console.error("Email failed:", error);
    return { error };
  }
}

export function approvalEmailHtml(name: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Your AlumniHub account has been approved</h2>
      <p>Hello ${name || "there"},</p>
      <p>Your alumni account has been approved. You can now sign in and access the member directory, events, gallery, and other alumni features.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/login">Sign in to AlumniHub</a></p>
    </div>
  `;
}

export function rejectionEmailHtml(name: string, reason: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Your AlumniHub application was not approved</h2>
      <p>Hello ${name || "there"},</p>
      <p>Your alumni application was reviewed and not approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>If you believe this was a mistake, please contact the administrator.</p>
    </div>
  `;
}
