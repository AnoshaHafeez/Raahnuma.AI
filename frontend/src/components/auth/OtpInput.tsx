"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const inputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^[0-9]?$/.test(digit)) return;
    const chars = value.split("");
    chars[index] = digit;
    const next = chars.join("").slice(0, length);
    onChange(next);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={cn(
            "h-12 w-11 rounded-lg border border-input bg-background text-center text-lg font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary sm:h-14 sm:w-12",
            error && "border-destructive focus-visible:ring-destructive/40"
          )}
        />
      ))}
    </div>
  );
}