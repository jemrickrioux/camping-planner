"use client";

import { useEffect, useState } from "react";

export function Countdown({ target }: { target: string }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const t = new Date(target).getTime();
      const now = Date.now();
      const diff = Math.max(0, t - now);
      setDays(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };
    update();
    const i = setInterval(update, 60_000);
    return () => clearInterval(i);
  }, [target]);

  if (days === null) return <span className="opacity-50">…</span>;
  if (days === 0) return <span>C'est aujourd'hui 🎉</span>;
  if (days < 0) return <span>Voyage passé</span>;
  return (
    <span>
      Dans <span className="font-bold tabular-nums">{days}</span> {days === 1 ? "jour" : "jours"}
    </span>
  );
}
