import type { Metadata } from "next";
import { BotsProvider } from '@/contexts/BotsContext';
import { TournamentsProvider } from '@/contexts/TournamentsContext';
import "./globals.css";


export const metadata: Metadata = {
  title: "Select Bots",
  description: "Choose your bots for the duel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <BotsProvider>
          <TournamentsProvider>
            {children}
          </TournamentsProvider>
        </BotsProvider>
      </body>
    </html>
  );
}
