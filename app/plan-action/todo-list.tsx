"use client";

import { useState, useTransition } from "react";
import type { Todo } from "@/db/schema";
import { updateTodo } from "@/app/actions";
import { useWhoAmI } from "@/components/who-am-i";

const STATUSES = ["À faire", "En cours", "Fait"] as const;
type Status = typeof STATUSES[number];

const COLUMN_STYLE: Record<Status, string> = {
  "À faire": "bg-amber-50 border-amber-200",
  "En cours": "bg-sky-50 border-sky-200",
  "Fait": "bg-emerald-50 border-emerald-200",
};

const COLUMN_EMOJI: Record<Status, string> = {
  "À faire": "⏳",
  "En cours": "🔄",
  "Fait": "✓",
};

export function TodoList({ items }: { items: Todo[] }) {
  const { isOrganizer } = useWhoAmI();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {STATUSES.map((status) => {
        const colItems = items.filter((t) => t.status === status);
        return (
          <div key={status} className={`rounded-2xl border-2 ${COLUMN_STYLE[status]} p-3 min-h-[200px]`}>
            <h3 className="font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>{COLUMN_EMOJI[status]}</span>
              <span>{status}</span>
              <span className="ml-auto text-xs opacity-60">{colItems.length}</span>
            </h3>
            <ul className="space-y-2">
              {colItems.map((todo) => (
                <li key={todo.id}>
                  <TodoCard todo={todo} canEdit={isOrganizer} />
                </li>
              ))}
              {colItems.length === 0 && (
                <li className="text-xs text-muted text-center py-4 opacity-60">vide</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function TodoCard({ todo, canEdit }: { todo: Todo; canEdit: boolean }) {
  const [status, setStatus] = useState(todo.status as Status);
  const [, startTransition] = useTransition();

  const move = (newStatus: Status) => {
    if (!canEdit && newStatus !== "Fait" && status !== "Fait") {
      // Anyone can toggle "Fait" but only organizer can move between states
      return;
    }
    setStatus(newStatus);
    startTransition(() => updateTodo(todo.id, { status: newStatus }));
  };

  return (
    <div className={`bg-card rounded-xl p-3 shadow-sm border border-white/50 ${status === "Fait" ? "opacity-70" : ""}`}>
      <div className={`text-sm font-medium ${status === "Fait" ? "line-through" : ""}`}>{todo.action}</div>
      {(todo.responsible || todo.deadline) && (
        <div className="flex flex-wrap gap-1 mt-2 text-xs">
          {todo.responsible && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-slate-700">
              👤 {todo.responsible}
            </span>
          )}
          {todo.deadline && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-slate-700">
              📅 {todo.deadline}
            </span>
          )}
        </div>
      )}
      {todo.notes && <div className="text-xs text-muted mt-1.5 italic">{todo.notes}</div>}
      <div className="flex gap-1 mt-2">
        {STATUSES.filter((s) => s !== status).map((s) => (
          <button
            key={s}
            onClick={() => move(s)}
            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-full transition"
          >
            → {COLUMN_EMOJI[s]} {s}
          </button>
        ))}
      </div>
    </div>
  );
}
