import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { WhoAmIProvider } from "@/components/who-am-i";
import { getCurrentTrip, getParticipants } from "@/lib/trip";

export const metadata: Metadata = {
  title: "🛶 Canot Camping — Poisson Blanc",
  description: "Organisation du voyage canot-camping juin 2026",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const trip = await getCurrentTrip();
  const participants = await getParticipants();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <WhoAmIProvider participants={participants}>
          <Nav tripName={trip.name} />
          <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">{children}</main>
          <footer className="border-t border-border py-4 text-center text-xs text-muted">
            🛶 {trip.name}
          </footer>
        </WhoAmIProvider>
      </body>
    </html>
  );
}
