"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompose } from "@/components/compose/compose-provider";

/** Opens the compose popup and returns to inbox (keeps old /inbox/compose links working). */
export default function ComposePage() {
  const router = useRouter();
  const { openCompose } = useCompose();

  useEffect(() => {
    openCompose();
    router.replace("/inbox");
  }, [openCompose, router]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Opening composer…
    </div>
  );
}
