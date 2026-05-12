import { db, schema } from "@/lib/db";
import { getCurrentTrip } from "@/lib/trip";
import { eq } from "drizzle-orm";
import { TodoList } from "./todo-list";
import { AddTodoForm } from "./add-todo-form";

export const dynamic = "force-dynamic";

export default async function PlanActionPage() {
  const trip = await getCurrentTrip();
  const items = await db
    .select()
    .from(schema.todos)
    .where(eq(schema.todos.tripId, trip.id))
    .orderBy(schema.todos.position);

  const done = items.filter((t) => t.status === "Fait").length;
  const inProgress = items.filter((t) => t.status === "En cours").length;
  const todo = items.filter((t) => t.status === "À faire").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">✅ Plan d'action</h1>
        <p className="text-muted text-sm">Toutes les tâches pré-départ.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="À faire" value={todo} accent="warn" />
        <Stat label="En cours" value={inProgress} accent="primary" />
        <Stat label="Fait" value={done} accent="ok" />
      </div>

      <AddTodoForm tripId={trip.id} />

      <TodoList items={items} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent: "primary" | "ok" | "warn" }) {
  const cls = {
    primary: "bg-teal-50 text-teal-900 border-teal-200",
    ok: "bg-emerald-50 text-emerald-900 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
  }[accent];
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
