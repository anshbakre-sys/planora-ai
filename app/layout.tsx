import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { CalendarHeart, Sparkles, FolderHeart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Planora AI — Plan Beautifully. Celebrate Effortlessly.',
  description: 'GenAI-powered planning assistant for weddings, birthdays, and community events with budgets, timelines, and vendor checklists.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col min-h-screen bg-[#FAF6EF] text-[#26232B] antialiased">
        <header className="sticky top-0 z-50 bg-[#FAF6EF]/90 backdrop-blur-md border-b border-[#E5DBCB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#26232B] text-[#C9A96A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#26232B] block leading-none">
                  Planora <span className="text-[#8B7BB8] font-sans font-medium text-lg">AI</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#665F6B] font-semibold block mt-0.5">
                  Plan Beautifully. Celebrate Effortlessly.
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              <Link
                href="/events"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#26232B] hover:bg-[#EFE7DA] transition-colors flex items-center gap-2"
              >
                <FolderHeart className="w-4 h-4 text-[#8B7BB8]" />
                <span>Saved Events</span>
              </Link>
              <Link
                href="/events/new"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[#26232B] text-[#FAF6EF] hover:bg-[#3D3845] transition-all shadow-sm flex items-center gap-2"
              >
                <CalendarHeart className="w-4 h-4 text-[#C9A96A]" />
                <span>Plan Event</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-[#E5DBCB] bg-[#F3ECE0] mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#665F6B]">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-[#26232B]">Planora AI</span>
              <span>— Local Single-User Event Planning Assistant</span>
            </div>
            <div className="text-xs text-center md:text-right">
              Runs in honest demo mode or real Gemini 2.0. SQLite local persistent storage.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
