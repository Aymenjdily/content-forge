export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Platform</p>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">Configure your workspace and account preferences.</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Account</h3>
        <p className="text-sm text-muted-foreground">Account settings can be managed through Clerk.</p>
      </div>
    </div>
  );
}
