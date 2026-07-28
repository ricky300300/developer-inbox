import type { ConfigField } from "@/providers/types";

export const resendConfigFields: ConfigField[] = [
  {
    key: "apiKey",
    label: "API Key",
    type: "password",
    required: true,
    placeholder: "re_xxxxxxxx",
    description: "Your Resend API key",
    secret: true,
  },
  {
    key: "webhookSecret",
    label: "Webhook Signing Secret",
    type: "password",
    required: true,
    placeholder: "whsec_xxxxxxxx",
    description: "From the Resend webhook settings (Svix signing secret)",
    secret: true,
  },
  {
    key: "fromEmail",
    label: "Default From Address",
    type: "email",
    required: true,
    placeholder: "inbox@yourdomain.com",
    description: "Verified address used when sending replies",
  },
];

export type ResendSettings = {
  fromEmail: string;
};
