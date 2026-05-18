"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-900)] shadow-[0_16px_42px_-24px_rgba(2,8,23,.92)]",
          title: "text-[var(--ink-900)]",
          description: "text-[var(--ink-600)]",
          actionButton:
            "bg-[var(--brand-600)] text-white hover:bg-[var(--brand-500)]",
          cancelButton:
            "bg-[var(--surface-2)] text-[var(--ink-700)] hover:bg-[var(--surface-3)]",
        },
      }}
      {...props}
    />
  );
}
