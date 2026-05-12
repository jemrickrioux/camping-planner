import { getCurrentTrip, getParticipants } from "@/lib/trip";
import { ParticipantsTable } from "./participants-table";

export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  await getCurrentTrip();
  const participants = await getParticipants();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">👥 Participants</h1>
        <p className="text-muted text-sm">Confirmer la présence, ajouter allergies et contact.</p>
      </div>
      <ParticipantsTable participants={participants} />
    </div>
  );
}
