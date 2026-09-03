"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Self-service password reset is not wired up, because the backend has no
 * endpoint for it. `app/api/v1/endpoints/auth.py` exposes only:
 *   POST /auth/register, POST /auth/login, GET /auth/me,
 *   PATCH /auth/me, POST /auth/change-password
 *
 * The previous version of this screen simulated an OTP flow: it accepted any
 * 6-digit code and then reported "Password updated" without contacting the
 * server. That is worse than no feature at all, since a locked-out user would
 * believe their password had been changed. It has been replaced with an honest
 * notice until the API exists.
 *
 * To make this real the backend needs, at minimum:
 *   POST /auth/forgot-password  { email }                        -> emails a signed, expiring token
 *   POST /auth/reset-password   { token, new_password }          -> verifies the token, rotates the hash
 * Both must be rate limited, and the first must return 202 for unknown emails
 * so it cannot be used to enumerate accounts.
 */
export function ForgotPasswordFlow() {
  return (
    <div className="w-full max-w-md">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Password reset by email is not available yet.
          </p>
        </div>

        <div className="flex gap-3 rounded-xl border border-border bg-secondary/40 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-2 text-sm">
            <p>
              If you can still log in, change your password from{" "}
              <span className="font-medium">Settings → Security</span>.
            </p>
            <p className="text-muted-foreground">
              If you are locked out, contact the Raahnuma.AI team so an administrator can reset
              your account.
            </p>
          </div>
        </div>

        <Button className="w-full" size="lg" asChild>
          <a href="mailto:support@raahnuma.ai?subject=Password%20reset%20request">
            <Mail className="mr-2 h-4 w-4" /> Email support
          </a>
        </Button>

        <Button variant="outline" className="w-full" size="lg" asChild>
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
    </div>
  );
}
