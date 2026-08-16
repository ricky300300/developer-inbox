import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-3 pb-8 pt-3 sm:space-y-6 sm:p-6">
        <SettingsNav />
        {children}
      </div>
    </div>
  );
}
