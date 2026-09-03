"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { registerUser } from "@/store/slices/authSlice";
import { toast } from "@/components/ui/toaster";
import { RegisterPayload } from "@/types/user";

/** Matches the server's PASSWORD_MIN_LENGTH in backend/app/schemas/user.py. */
const PASSWORD_MIN_LENGTH = 8;

const experienceLevels: { value: RegisterPayload["experienceLevel"]; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" }
];

export function RegisterForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<RegisterPayload>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    experienceLevel: "beginner",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  const update = (key: keyof RegisterPayload, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Registers, then logs in with the same credentials — /auth/register returns
    // the created profile, not a token.
    const result = await dispatch(registerUser(form));
    setLoading(false);

    if (registerUser.fulfilled.match(result)) {
      toast({ title: "Account created", description: "Welcome to Raahnuma.AI", variant: "success" });
      router.replace("/dashboard");
      return;
    }

    toast({
      title: "Could not create your account",
      description: result.payload ?? "Please check your details and try again.",
      variant: "error"
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="fullName" className="pl-10" placeholder="Anosha Khan" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="phone" type="tel" className="pl-10" placeholder="+92 300 1234567" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-email">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="reg-email" type="email" className="pl-10" placeholder="you@example.com" required value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="reg-password" type="password" className="pl-10" placeholder="••••••••" required minLength={PASSWORD_MIN_LENGTH} value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">At least {PASSWORD_MIN_LENGTH} characters.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Experience level</Label>
        <div className="grid grid-cols-3 gap-2">
          {experienceLevels.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => update("experienceLevel", level.value)}
              className={`h-10 rounded-lg border text-xs font-medium transition-colors ${
                form.experienceLevel === level.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ecName">Emergency contact name</Label>
          <div className="relative">
            <ShieldAlert className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ecName" className="pl-10" placeholder="Contact name" required value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ecPhone">Emergency contact phone</Label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="ecPhone" type="tel" className="pl-10" placeholder="+92 300 7654321" required value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}