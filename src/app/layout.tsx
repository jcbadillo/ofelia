import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '@/shared/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ofelia',
  applicationName: 'Ofelia',
  description: 'Personal daily journal & tasks',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
