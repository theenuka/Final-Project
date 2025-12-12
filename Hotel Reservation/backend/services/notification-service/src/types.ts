export type NotificationChannel = "email" | "sms" | "push";

export interface TemplateContext {
  subject?: string;
  text?: string;
  message?: string;
  html?: string;
  metadata?: Record<string, any>;
}

export interface TemplateResult {
  subject: string;
  text: string;
  html?: string;
}

export interface NotificationJobPayload {
  type?: string;
  channel: NotificationChannel;
  to: string;
  subject?: string;
  message: string;
  html?: string;
  metadata?: Record<string, any>;
}

export interface NotificationRequestPayload {
  channel?: NotificationChannel;
  type?: string;
  to: string;
  subject?: string;
  message?: string;
  html?: string;
  metadata?: Record<string, any>;
}
