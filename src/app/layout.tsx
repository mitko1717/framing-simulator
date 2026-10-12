import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Framing Simulator',
  description: 'A hands-on guide to camera framing, composition, and perspective.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}