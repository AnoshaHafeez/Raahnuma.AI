"use client";

import * as React from "react";
import { Lock, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { authApi, toErrorMessage } from "@/lib/api";

/** Must match the server's `PasswordChangeRequest.new_password` minimum. */
const PASSWORD_MIN_LENGTH = 8;

export default function SecuritySettingsPage() {
  const [form, setForm] = React.useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = React.useState(false);
  const mismatch = form.next.length > 0 && form.confirm.length > 0 && form.next !== form.confirm;
  const tooShort = form.next.length > 0 && form.next.length < PASSWORD_MIN_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || form.next.length < PASSWORD_MIN_LENGTH || saving) return;
    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: form.current,
        new_password: form.next
      });
      toast({
        title: "Password changed",
        description: "Use your new password next time you log in.",
        variant: "success"
      });
      setForm({ current: "", next: "", confirm: "" });
    } catch (error) {
      toast({ title: "Could not change password", description: toErrorMessage(error), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update your password and manage account security.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4 text-primary" /> Change password
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="current">Current password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="current" type="password" className="pl-10" value={form.current} onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="next">New password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="next" type="password" className="pl-10" minLength={PASSWORD_MIN_LENGTH} error={tooShort} value={form.next} onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))} required />
          </div>
          <p className={tooShort ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            At least {PASSWORD_MIN_LENGTH} characters.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="confirm" type="password" className="pl-10" error={mismatch} value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} required />
          </div>
          {mismatch && <p className="text-xs text-destructive">Passwords do not match</p>}
        </div>

        <Button type="submit" disabled={saving || mismatch || tooShort}>{saving ? "Updating..." : "Update password"}</Button>
      </form>
    </div>
  );
}