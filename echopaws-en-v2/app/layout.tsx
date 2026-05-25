import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EchoPaws — Your Pet, Always By Your Side',
  description: 'Create an AI companion from your pet. It remembers you, understands you, and grows closer with every conversation.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}