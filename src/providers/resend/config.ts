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
    required: false,
    placeholder: "whsec_xxxxxxxx",
    description:
      "Added in step 3 after creating the Resend webhook (Resend shows this only after save)",
    secret: true,
  },
  {
    key: "fromEmail",
    label: "Default From Address",
    type: "email",
    required: true,
    placeholder: "inbox@yourdomain.com",
    description:
      "Fallback for new outbound mail. Replies use the address that received the inbound email.",
  },
];

export type ResendSettings = {
  fromEmail: string;
};
