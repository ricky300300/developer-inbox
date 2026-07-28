import type { EmailProvider } from "@/providers/types";
import { resendConfigFields } from "@/providers/resend/config";
import { sendWithResend } from "@/providers/resend/send";
import { handleResendWebhook } from "@/providers/resend/webhook";

export const resendProvider: EmailProvider = {
  id: "resend",
  name: "Resend",
  receiveMode: "webhook",
  getConfigFields: () => resendConfigFields,
  send: sendWithResend,
  handleWebhook: handleResendWebhook,
};
