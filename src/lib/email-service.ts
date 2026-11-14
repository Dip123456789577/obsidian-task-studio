// TASKFORGE — Brevo (Sendinblue) Email Messaging & Authentication Engine

export const BREVO_API_KEY =
  (typeof process !== "undefined" && process.env?.["BREVO_API_KEY"]) ||
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.["VITE_BREVO_API_KEY"] as string | undefined)) ||
  "";

export const BREVO_SENDER = {
  name: "TASKFORGE",
  email: "noreply@taskforge.dev",
};

export type SendEmailParams = {
  to: string;
  name?: string | undefined;
  subject: string;
  htmlContent: string;
  textContent?: string | undefined;
};

export type EmailSendResult = {
  success: boolean;
  messageId?: string | undefined;
  error?: string | undefined;
  ipRestricted?: boolean | undefined;
};

/**
 * Sends a transactional email using the Brevo v3 SMTP API.
 * Handles IP authorization restrictions gracefully with fallback messaging.
 */
export async function sendBrevoEmail({
  to,
  name,
  subject,
  htmlContent,
  textContent,
}: SendEmailParams): Promise<EmailSendResult> {
  const payload = {
    sender: BREVO_SENDER,
    to: [{ email: to, name: name || to.split("@")[0] }],
    subject,
    htmlContent,
    textContent: textContent || subject,
  };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (response.ok) {
      return {
        success: true,
        messageId: (data["messageId"] as string) || "msg_" + Date.now(),
      };
    }

    const errorMsg = (data["message"] as string) || `Brevo API error (Status ${response.status})`;
    const isIpRestricted = errorMsg.toLowerCase().includes("unrecognised ip address");

    console.warn("[TASKFORGE Brevo Email Warning]:", errorMsg);

    return {
      success: false,
      error: errorMsg,
      ipRestricted: isIpRestricted,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network error contacting Brevo API";
    console.warn("[TASKFORGE Brevo Network Error]:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Builds an Obsidian Dark styled HTML email wrapper.
 */
function buildObsidianEmailTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0c0e;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f4f4f5;
    }
    .wrapper {
      max-width: 560px;
      margin: 32px auto;
      background-color: #141417;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(180deg, #18181b 0%, #141417 100%);
      padding: 28px 32px;
      border-bottom: 1px solid #27272a;
      text-align: left;
    }
    .badge {
      display: inline-block;
      font-family: monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #a78bfa;
      background: rgba(167, 139, 250, 0.12);
      border: 1px solid rgba(167, 139, 250, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .brand-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #ffffff;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      font-size: 15px;
      color: #d4d4d8;
    }
    .footer {
      padding: 20px 32px;
      background: #0f0f12;
      border-top: 1px solid #27272a;
      font-size: 12px;
      color: #71717a;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background: #8b5cf6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      font-weight: 600;
      font-size: 14px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .otp-code {
      display: inline-block;
      font-family: monospace;
      font-size: 32px;
      letter-spacing: 0.25em;
      font-weight: 700;
      color: #a78bfa;
      background: #1e1e24;
      border: 1px solid #3f3f46;
      padding: 12px 24px;
      border-radius: 8px;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">Obsidian Dark Workspace</div>
      <h1 class="brand-title">TASKFORGE</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #ffffff; font-size: 18px;">${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">
      TASKFORGE Personal Productivity Platform &bull; End-to-end encrypted &bull; Built for focused builders.
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Sends a welcome email upon user registration or first sign-in.
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<EmailSendResult> {
  const displayName = name || email.split("@")[0];
  const html = buildObsidianEmailTemplate(
    `Welcome to TASKFORGE, ${displayName}!`,
    `
    <p>Your Obsidian-inspired dark productivity workspace has been prepared.</p>
    <p>Here is what is ready for you:</p>
    <ul style="padding-left: 20px; line-height: 1.8;">
      <li><strong>Multi-View Tracking:</strong> Switch seamlessly between List, Kanban Board, Calendar, Grid, and the Eisenhower Matrix.</li>
      <li><strong>Pomodoro Focus Engine:</strong> Integrated 25-minute sprints with synthesized audio cue tones.</li>
      <li><strong>Fast Navigation:</strong> Hit <code style="background: #27272a; padding: 2px 6px; border-radius: 4px; color: #a78bfa;">Cmd/Ctrl + K</code> anywhere to summon the command palette.</li>
      <li><strong>Owner-Scoped Persistence:</strong> Your tasks, projects, and custom categories remain private to your account.</li>
    </ul>
    <p style="margin-top: 24px;">
      <a href="http://localhost:8080/" class="btn">Open Your Workspace &rarr;</a>
    </p>
    `,
  );

  return sendBrevoEmail({
    to: email,
    name: displayName,
    subject: "Welcome to TASKFORGE — Your Workspace is Ready",
    htmlContent: html,
  });
}

/**
 * Sends a 6-digit authentication verification code (OTP).
 */
export async function sendOtpEmail(email: string, code: string): Promise<EmailSendResult> {
  const html = buildObsidianEmailTemplate(
    "Your TASKFORGE Verification Code",
    `
    <p>Use the 6-digit verification code below to complete your sign-in to TASKFORGE:</p>
    <div style="text-align: center;">
      <div class="otp-code">${code}</div>
    </div>
    <p style="color: #a1a1aa; font-size: 13px;">This verification code is valid for 10 minutes. If you did not request this sign-in, you can safely ignore this email.</p>
    `,
  );

  return sendBrevoEmail({
    to: email,
    subject: `TASKFORGE Sign-In Code: ${code}`,
    htmlContent: html,
  });
}

/**
 * Sends a password reset notification email.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<EmailSendResult> {
  const html = buildObsidianEmailTemplate(
    "Reset Your TASKFORGE Password",
    `
    <p>We received a request to reset your password for your TASKFORGE account.</p>
    <p>Click the button below to choose a new password:</p>
    <p style="margin-top: 20px;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <p style="color: #a1a1aa; font-size: 13px; margin-top: 24px;">If you did not request a password reset, no action is needed.</p>
    `,
  );

  return sendBrevoEmail({
    to: email,
    subject: "TASKFORGE — Password Reset Instructions",
    htmlContent: html,
  });
}
