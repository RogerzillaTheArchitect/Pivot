import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { FiltrosProvider } from "@/lib/filters-context";

export const metadata: Metadata = {
  title: "Pivots Insights",
  description: "Inteligência de mercado sobre prestação de serviços — dados agregados e anônimos do Pivot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-base text-ink">
        <FiltrosProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-6 py-6 md:px-10 md:py-8">{children}</main>
          </div>
        </FiltrosProvider>
      </body>
    </html>
  );
}
