// server/src/lib/mailer.js
import Brevo from "@getbrevo/brevo";

const brevo = new Brevo.TransactionalEmailsApi();
brevo.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

// ...same imports/initialization...

export async function sendOtpEmail({ toEmail, toName = "", otp, templateId = null }) {
    const sender = {
      name: process.env.MAIL_FROM_NAME || "FitMate",
      email: process.env.MAIL_FROM_EMAIL || "no-reply@example.com",
    };
  
    const safeName =
      (toName && String(toName).trim()) ||
      (toEmail && String(toEmail).split("@")[0]) ||
      "User";
  
    const payload = templateId
      ? {
          sender,
          to: [{ email: toEmail, name: safeName }],
          templateId,
          params: { otp },
          headers: { "X-Mailin-Tag": "fitmate-otp" },
        }
      : {
          sender,
          to: [{ email: toEmail, name: safeName }],
          subject: `Your FitMate OTP: ${otp}`,
          htmlContent: `
            <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto">
              <h2>FitMate Login Code</h2>
              <p>Use this one-time code to sign in:</p>
              <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${otp}</div>
              <p>This code expires in ${Math.round((+process.env.OTP_TTL_MS || 600000)/60000)} minutes.</p>
              <p>If you didn’t request this, you can ignore this email.</p>
            </div>`,
          headers: { "X-Mailin-Tag": "fitmate-otp" },
        };
  
    try {
      const resp = await brevo.sendTransacEmail(payload);
  
      // Accept both SDK response shapes:
      //  - { messageId: '...' }
      //  - { response: IncomingMessage, body: { messageId: '...' } }
      const messageId =
        resp?.messageId ||
        resp?.body?.messageId ||
        (Array.isArray(resp?.body?.messageIds) ? resp.body.messageIds[0] : undefined);
  
      if (!messageId) {
        console.error("Brevo: unexpected response", resp);
        throw new Error("Brevo did not return a messageId");
      }
  
      console.log("Brevo sent. messageId:", messageId, "to:", toEmail);
      return messageId;
    } catch (err) {
      const body = err?.response?.body;
      console.error("Brevo error:", body || err.message || err);
      throw new Error(
        body?.message || body?.errors?.[0]?.message || err.message || "Brevo send error"
      );
    }
  }
  