export type ProviderId = "resend";

export type ReceiveMode = "webhook" | "poll" | "push_api";

export type ConfigFieldType = "text" | "password" | "email";

export type ConfigField = {
  key: string;
  label: string;
  type: ConfigFieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  /** If true, value is stored encrypted (api key / webhook secret), not in config JSON */
  secret?: boolean;
};

export type EmailAddress = {
  email: string;
  name?: string;
};

export type AttachmentMeta = {
  filename: string;
  contentType?: string;
  size?: number;
  providerAttachmentId?: string;
};

export type OutboundMessage = {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  html?: string;
  text?: string;
  inReplyTo?: string;
  references?: string[];
};

export type InboundEmail = {
  providerMessageId: string;
  messageIdHeader?: string;
  inReplyTo?: string;
  references?: string[];
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  html?: string;
  text?: string;
  attachments: AttachmentMeta[];
  receivedAt: Date;
  rawHeaders?: Record<string, string>;
};

export type DecryptedConfig = {
  apiKey: string;
  webhookSecret?: string;
  /** Provider-specific non-secret settings */
  settings: Record<string, unknown>;
};

export type SendResult = {
  providerMessageId: string;
};

export interface EmailProvider {
  id: ProviderId;
  name: string;
  receiveMode: ReceiveMode;
  getConfigFields(): ConfigField[];
  send(config: DecryptedConfig, message: OutboundMessage): Promise<SendResult>;
  handleWebhook?(args: {
    request: Request;
    config: DecryptedConfig;
    webhookSecret?: string;
  }): Promise<InboundEmail | null>;
  pollInbound?(config: DecryptedConfig): Promise<InboundEmail[]>;
}
