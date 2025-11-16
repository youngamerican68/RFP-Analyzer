import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Brief Analyst',
  description: 'Analyze project briefs, RFPs, and client emails. Extract structured information and create ClickUp tasks automatically.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
