"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuthView } from "@/store/slices/uiSlice";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { cn } from "@/lib/utils";

export function AuthToggleCard() {
  const dispatch = useAppDispatch();
  const authView = useAppSelector((s) => s.ui.authView);

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex rounded-lg border border-border bg-secondary/50 p-1">
        {(["login", "register"] as const).map((view) => (
          <button
            key={view}
            onClick={() => dispatch(setAuthView(view))}
            className={cn(
              "relative flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              authView === view ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {authView === view && (
              <motion.div layoutId="auth-toggle-bg" className="absolute inset-0 rounded-md bg-primary" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />
            )}
            <span className="relative z-10">{view === "login" ? "Login" : "Register"}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={authView}
          initial={{ opacity: 0, x: authView === "login" ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: authView === "login" ? 16 : -16 }}
          transition={{ duration: 0.25 }}
        >
          {authView === "login" ? <LoginForm /> : <RegisterForm />}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {authView === "login" ? "Do not have an account? " : "Already have an account? "}
        <button
          onClick={() => dispatch(setAuthView(authView === "login" ? "register" : "login"))}
          className="font-medium text-primary hover:underline"
        >
          {authView === "login" ? "Register now" : "Login"}
        </button>
      </p>
    </div>
  );
}