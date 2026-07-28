import type { EmailProvider, ProviderId } from "@/providers/types";
import { resendProvider } from "@/providers/resend";

const providers: Record<ProviderId, EmailProvider> = {
  resend: resendProvider,
};

export function getProvider(id: string): EmailProvider {
  const provider = providers[id as ProviderId];
  if (!provider) {
    throw new Error(`Unknown email provider: ${id}`);
  }
  return provider;
}

export function listProviders(): EmailProvider[] {
  return Object.values(providers);
}

export function isProviderId(value: string): value is ProviderId {
  return value in providers;
}
