"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function FormSubmitButton({
  pendingLabel = "Submitting...",
  children,
}: {
  pendingLabel?: string;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button className="brand-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
