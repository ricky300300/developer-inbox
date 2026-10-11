import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** When true, hide from assistive tech (use next to visible brand text). */
  decorative?: boolean;
  title?: string;
};

/** Transparent product mark — inherits text color via currentColor. */
export function Logo({
  className,
  decorative = false,
  title = "Developer Inbox",
}: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      className={cn("block", className)}
    >
      <rect
        x="8"
        y="2"
        width="48"
        height="20"
        rx="4"
        stroke="currentColor"
        strokeWidth="2.6"
        opacity="0.45"
      />
      <text
        x="32"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        opacity="0.85"
        aria-hidden="true"
      >
        API
      </text>
      <path
        d="M4 38h56l-5.5 22H9.5L4 38Z"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 38v-6c0-3.3 2.7-6 6-6h28c3.3 0 6 2.7 6 6v6"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M16 50h32"
        stroke="#0F8F86"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
