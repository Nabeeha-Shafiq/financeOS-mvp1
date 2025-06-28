import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FinancialDataProvider } from '@/context/financial-data-context';

export const metadata: Metadata = {
  title: 'FinanceOS Lite',
  description: 'Extract financial data from receipts with AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FinancialDataProvider>
            {children}
        </FinancialDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
