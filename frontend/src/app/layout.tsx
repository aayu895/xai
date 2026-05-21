import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'XAI-Gov — Transparent AI for Accountable Governance',
  description: 'An enterprise-grade AI governance platform that makes government AI systems transparent, explainable, and trustworthy.',
  keywords: ['XAI', 'Explainable AI', 'Government', 'Transparency', 'Accountability'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-navy-950 text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0F2044', color: '#fff', border: '1px solid #1A3A6E' },
            success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
