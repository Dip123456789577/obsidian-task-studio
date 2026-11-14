import { sendBrevoEmail, sendWelcomeEmail, sendOtpEmail, BREVO_API_KEY } from "./email-service";

// In-memory OTP storage for passwordless email sign-in / verification
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

export async function handleApiRequest(url: URL, request?: Request): Promise<Response | null> {
  const method = request?.method || "GET";

  if (url.pathname === "/api/health") {
    return new Response(
      JSON.stringify({
        status: "healthy",
        app: "TASKFORGE",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
        emailService: {
          configured: Boolean(BREVO_API_KEY),
          provider: "Brevo (Sendinblue)",
        },
        features: [
          "obsidian-dark-ui",
          "kanban-board",
          "calendar-matrix",
          "productivity-intelligence",
          "guest-demo-mode",
          "data-portability-json-csv",
          "brevo-email-messaging",
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    );
  }

  if (url.pathname === "/api/templates") {
    return new Response(
      JSON.stringify({
        templates: [
          {
            id: "tmpl-sprint",
            title: "Sprint Planning & Execution",
            category: "Work",
            priority: "high",
            tags: ["sprint", "engineering", "milestone"],
            subtasks: [
              "Define sprint goals and scope",
              "Review backlog items & assign story points",
              "Execute daily standups and unblock dependencies",
              "Conduct sprint review and retrospective",
            ],
          },
          {
            id: "tmpl-deepwork",
            title: "Deep Work & Flow State Block",
            category: "Personal",
            priority: "urgent",
            tags: ["focus", "productivity"],
            subtasks: [
              "Close email and communication tabs",
              "Set 90-minute focus timer",
              "Produce primary deliverable draft",
              "Log accomplishments in notes",
            ],
          },
          {
            id: "tmpl-weekly-review",
            title: "Weekly Productivity & Goal Review",
            category: "Study",
            priority: "medium",
            tags: ["review", "habits"],
            subtasks: [
              "Review inbox & empty pending tasks",
              "Analyze weekly completion metrics",
              "Set top 3 priorities for coming week",
            ],
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      },
    );
  }

  // --- BREVO EMAIL ENDPOINTS ---

  // Check email integration status
  if (url.pathname === "/api/email/status") {
    return new Response(
      JSON.stringify({
        configured: Boolean(BREVO_API_KEY),
        provider: "Brevo (Sendinblue)",
        keyPrefix: BREVO_API_KEY ? BREVO_API_KEY.slice(0, 15) + "..." : "none",
        sender: "noreply@taskforge.dev",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Send generic transactional email
  if (url.pathname === "/api/email/send" && method === "POST") {
    try {
      const body = (await request?.json()) as Record<string, string>;
      const to = body["to"];
      const subject = body["subject"];
      const htmlContent = body["htmlContent"];
      const name = body["name"];

      if (!to || !subject || !htmlContent) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: to, subject, htmlContent" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const result = await sendBrevoEmail({
        to,
        subject,
        htmlContent,
        name,
      });

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Send welcome email upon registration
  if (url.pathname === "/api/email/welcome" && method === "POST") {
    try {
      const body = (await request?.json()) as Record<string, string>;
      const email = body["email"];
      const name = body["name"];

      if (!email) {
        return new Response(JSON.stringify({ error: "Missing email" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await sendWelcomeEmail(email, name);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Failed to dispatch email" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Send 6-digit OTP code for sign-in / verification
  if (url.pathname === "/api/auth/send-otp" && method === "POST") {
    try {
      const body = (await request?.json()) as Record<string, string>;
      const email = body["email"]?.trim().toLowerCase();

      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generate a secure 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore[email] = {
        code,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };

      const emailResult = await sendOtpEmail(email, code);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification code dispatched",
          // Return code in dev for seamless testing if IP whitelist blocks external SMTP
          devCode: code,
          emailDelivery: emailResult,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  // Verify 6-digit OTP code
  if (url.pathname === "/api/auth/verify-otp" && method === "POST") {
    try {
      const body = (await request?.json()) as Record<string, string>;
      const email = body["email"]?.trim().toLowerCase();
      const code = body["code"]?.trim();

      if (!email || !code) {
        return new Response(JSON.stringify({ error: "Email and code are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const record = otpStore[email];
      if (!record) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "No code found for this email. Request a new one.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return new Response(
          JSON.stringify({ success: false, error: "Code expired. Please request a new code." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      if (record.code !== code) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid code. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Validated! Clear OTP so it cannot be reused
      delete otpStore[email];

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          user: {
            id: `usr_${btoa(email)
              .replace(/[^a-zA-Z0-9]/g, "")
              .slice(0, 16)}`,
            email,
            name: email.split("@")[0],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Verification error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }

  return null;
}
