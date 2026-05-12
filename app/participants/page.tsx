import { getCurrentTrip, getParticipants, getMealSlots } from "@/lib/trip";
import { ParticipantsTable } from "./participants-table";
import { AddParticipantForm } from "./add-participant-form";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();
  const slots = await getMealSlots();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">👥 Participants</h1>
        <p className="text-muted text-sm">Confirmer la présence, ajouter allergies et contact.</p>
      </div>
      <AddParticipantForm tripId={trip.id} />
      <ParticipantsTable participants={participants} mealSlots={slots} />
    </div>
  );
}
