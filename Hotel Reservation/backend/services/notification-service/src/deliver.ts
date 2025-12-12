import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { notificationConfig } from "./config";
import { NotificationJobPayload } from "./types";

if (notificationConfig.sendgridKey) {
  sgMail.setApiKey(notificationConfig.sendgridKey);
}

const twilioClient =
  notificationConfig.sms.twilioSid && notificationConfig.sms.twilioToken
    ? twilio(notificationConfig.sms.twilioSid, notificationConfig.sms.twilioToken)
    : null;

const htmlWrapper = (subject: string, body: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
    <style>
      body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background: #f7f7f7; padding: 24px; }
      .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
      .brand { font-weight: 600; color: ${notificationConfig.brand.color}; }
      p { line-height: 1.5; color: #1f2937; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="brand">${notificationConfig.brand.name}</p>
      <p>${body.replace(/\n/g, '<br/>')}</p>
      <p style="font-size:12px;color:#6b7280;margin-top:32px;">This message was generated automatically. Do not reply.</p>
    </div>
  </body>
</html>`;

export const sendEmail = async ({ to, subject, message, html }: NotificationJobPayload) => {
  const resolvedSubject = subject || "Phoenix Booking Notification";
  if (!notificationConfig.sendgridKey) {
    if (notificationConfig.email.fallbackToConsole) {
      console.log("[notification:email:fallback]", { to, subject: resolvedSubject, message });
      return { mocked: true };
    }
    throw new Error("SendGrid API key missing");
  }
  await sgMail.send({
    to,
    from: { email: notificationConfig.email.fromEmail, name: notificationConfig.email.fromName },
    subject: resolvedSubject,
    text: message,
    html: html || htmlWrapper(resolvedSubject, message),
  });
  return { mocked: false };
};

export const sendSms = async ({ to, message }: NotificationJobPayload) => {
  if (!twilioClient || (!notificationConfig.sms.fromNumber && !notificationConfig.sms.messagingServiceSid)) {
    if (notificationConfig.sms.fallbackToConsole) {
      console.log("[notification:sms:fallback]", { to, message });
      return { mocked: true };
    }
    throw new Error("Twilio credentials missing");
  }
  await twilioClient.messages.create({
    to,
    body: message,
    ...(notificationConfig.sms.messagingServiceSid
      ? { messagingServiceSid: notificationConfig.sms.messagingServiceSid }
      : { from: notificationConfig.sms.fromNumber })
  });
  return { mocked: false };
};

export const deliverNotification = async (payload: NotificationJobPayload) => {
  switch (payload.channel) {
    case "email":
      return sendEmail(payload);
    case "sms":
      return sendSms(payload);
    default:
      throw new Error(`Unsupported channel ${payload.channel}`);
  }
};
