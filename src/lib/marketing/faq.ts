export type Faq = {
  question: string;
  answer: string;
};

/** Visible FAQ copy. Structured data must use these strings unchanged. */
export const FAQS: Faq[] = [
  {
    question: "Is Developer Inbox an email provider?",
    answer:
      "No. Resend sends and receives the mail. Developer Inbox is the conversation layer where your team reads threads, replies, switches mailboxes, and keeps attachments.",
  },
  {
    question: "What does the $5 Small group plan include?",
    answer:
      "Small group is $5 per month or $50 per year. It includes unlimited inboxes and 10 GB of persistent storage for messages and attachments. The free plan is one inbox and 1 GB at no charge.",
  },
  {
    question: "What does the Team plan include?",
    answer:
      "Team is $25 per month or $250 per year. It includes unlimited inboxes and 100 GB of persistent storage. Paid plans do not limit how many inboxes you add. Storage is the limit.",
  },
  {
    question: "How does yearly billing compare with monthly?",
    answer:
      "Yearly billing is $50 for Small group and $250 for Team, which is ten months of the monthly price paid once a year. Monthly billing is $5 for Small group and $25 for Team. The Monthly and Yearly control on the pricing section shows either price.",
  },
  {
    question: "How do I connect Resend?",
    answer:
      "Create an account, then add a Resend API key and the webhook signing secret in Settings. Add the mailbox addresses you want in the inbox. The Connect Resend guide covers domains, webhooks, and a first inbound test.",
  },
];
