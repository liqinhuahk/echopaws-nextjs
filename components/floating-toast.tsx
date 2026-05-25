"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FloatingToastProps = {
  message?: string | null;
  tone?: "success" | "error";
  clearKeys?: string[];
  durationMs?: number;
};

export function FloatingToast({
  message,
  tone = "success",
  clearKeys = ["message", "error"],
  durationMs = 3200,
}: FloatingToastProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(Boolean(message));

  function clearQueryAndHide() {
    setVisible(false);

    const next = new URLSearchParams(searchParams?.toString() || "");
    for (const key of clearKeys) {
      next.delete(key);
    }

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    setVisible(Boolean(message));
  }, [message]);

  const styles = useMemo(() => {
    if (tone === "error") {
      return {
        wrapper: "border-rose-200 bg-rose-50 text-rose-900 shadow-rose-100/80",
        icon: "bg-rose-100 text-rose-700",
        button: "text-rose-500 hover:bg-rose-100",
        emoji: "⚠️",
        title: "Operation Failed",
      };
    }

    return {
      wrapper: "border-emerald-200 bg-white/95 text-slate-900 shadow-emerald-100/80",
      icon: "bg-emerald-100 text-emerald-700",
      button: "text-slate-400 hover:bg-slate-100",
      emoji: "✨",
      title: "Saved Successfully",
    };
  }, [tone]);

  useEffect(() => {
    if (!message || !visible) return;

    const timer = window.setTimeout(() => {
      clearQueryAndHide();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [message, visible, clearKeys, durationMs, pathname, router, searchParams]);

  if (!message || !visible) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-6 z-50 w-[min(420px,calc(100vw-2rem))]">
      <div className={`pointer-events-auto rounded-[28px] border px-4 py-4 shadow-2xl backdrop-blur ${styles.wrapper}`}>
        <div className="flex items-start gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-lg font-bold ${styles.icon}`}>{styles.emoji}</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold tracking-wide">{styles.title}</div>
            <div className="mt-1 text-sm leading-7">{message}</div>
          </div>
          <button
            type="button"
            aria-label="Close toast"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${styles.button}`}
            onClick={clearQueryAndHide}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
