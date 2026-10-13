import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export const metadata: Metadata = {
  title: 'GameDeal Hunter — Best Gaming Laptop Deals in Canada',
  description: 'Track, compare, and find the best gaming laptop deals in Canada. Real-time price monitoring across Best Buy, Canada Computers, Memory Express, Newegg, and more.',
  keywords: ['gaming laptop', 'Canada', 'deals', 'price tracker', 'RTX 5070', 'Best Buy Canada'],
  openGraph: {
    title: 'GameDeal Hunter',
    description: 'Find the best gaming laptop deals in Canada',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <TopBar />
            <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
