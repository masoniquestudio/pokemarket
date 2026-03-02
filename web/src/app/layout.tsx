import Nav from "@/components/Nav";
import "./globals.css";

export const metadata = {
  title: "PokéMarket — Pokemon TCG Price Tracker",
  description: "Stock market-style price tracking for Pokemon trading cards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <Nav />
        <main className="max-w-screen-xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
