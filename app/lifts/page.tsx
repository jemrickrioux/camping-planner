import { getParticipants } from "@/lib/trip";
import { LiftsView } from "./lifts-view";

export const dynamic = "force-dynamic";

export default async function LiftsPage() {
  const participants = await getParticipants();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">🚗 Lifts &amp; covoiturage</h1>
        <p className="text-muted text-sm">
          Qui conduit ? Qui embarque avec qui ? Vendredi 12 juin, accueil dès 9h, site à 15h.
        </p>
      </div>
      <LiftsView participants={participants} />
    </div>
  );
}
