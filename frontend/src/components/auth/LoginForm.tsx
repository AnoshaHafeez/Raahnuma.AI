"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { toast } from "@/components/ui/toaster";

/** Matches the server's PASSWORD_MIN_LENGTH in backend/app/schemas/user.py. */
const PASSWORD_MIN_LENGTH = 8;

export function LoginForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address";
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      next.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await dispatch(loginUser(form));
    setLoading(false);

    if (loginUser.fulfilled.match(result)) {
      toast({ title: "Welcome back", description: "Logged in successfully.", variant: "success" });
      router.replace("/dashboard");
      return;
    }

    toast({
      title: "Login failed",
      // The server deliberately returns the same message for an unknown email
      // and a wrong password, so there is nothing to attribute to a field.
      description: result.payload ?? "Invalid email or password",
      variant: "error"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="pl-10"
            error={!!errors.email}
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-10 pr-10"
            error={!!errors.password}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>

      <div className="relative py-2 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-card px-2">OR</span>
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
      </div>

      {/*
        The backend has no OAuth routes yet (only /auth/login and /auth/register),
        so these stay disabled rather than silently doing nothing on click.
      */}
      <div className="grid grid-cols-3 gap-3">
        {["Google", "Facebook", "Apple"].map((provider) => (
          <button
            key={provider}
            type="button"
            disabled
            title={`${provider} sign-in is not available yet`}
            className="flex h-11 items-center justify-center rounded-lg border border-input bg-background text-sm font-medium shadow-sm transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {provider[0]}
          </button>
        ))}
      </div>
    </form>
  );
}