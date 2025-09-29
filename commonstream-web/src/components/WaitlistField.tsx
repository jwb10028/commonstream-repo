// src/components/WaitlistField.tsx
"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  className?: string;
  buttonLabel?: string;
  placeholder?: string;
};

const WaitlistField: React.FC<Props> = ({
  className,
  buttonLabel = "Notify me",
  placeholder = "you@domain.com",
}) => {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "success" | "error">(
    "idle"
  );
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setError(null);
    setStatus("success");
    // TODO: hook to /api/waitlist (Vercel Function / Supabase, etc.)
  };

  return (
    <form
      onSubmit={onSubmit}
      className={clsx("w-full max-w-md", className)}
      noValidate
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>

      {/* Solid white container (no opacity / blur) */}
      <div className="flex w-full overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-lg">
        <input
          id="waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-black/10"
          aria-invalid={status === "error"}
          aria-describedby="waitlist-help"
          required
        />
        <button
          type="submit"
          className="px-4 sm:px-5 py-3 bg-black text-white font-medium hover:bg-black/90 active:bg-black/80 transition"
        >
          {buttonLabel}
        </button>
      </div>

      <div id="waitlist-help" className="mt-2 text-sm" aria-live="polite">
        {status === "error" && <span className="text-red-400">{error}</span>}
        {status === "success" && (
          <span className="text-green-400">
            Thanks! You’re on the list — we’ll email you when it’s ready.
          </span>
        )}
      </div>
    </form>
  );
};

export default WaitlistField;
