import type { Metadata } from 'next';
import { SupabaseProvider } from '@/components/supabase-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'EchoPaws — Your Pet, Always By Your Side',
  description: 'Create an AI companion from your pet. It remembers you, understands you, and grows closer with every conversation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
