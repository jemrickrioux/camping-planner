"use client";

import { useState } from "react";

export function AddButton({
  label = "Ajouter",
  children,
}: {
  label?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition"
      >
        <span className="text-lg leading-none">+</span> {label}
      </button>
    );
  }
  return (
    <div className="bg-card rounded-2xl border-2 border-primary p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{label}</h3>
        <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground text-xl leading-none">✕</button>
      </div>
      {children(() => setOpen(false))}
    </div>
  );
}
