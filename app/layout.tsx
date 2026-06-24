import type { Metadata } from 'next';
import '@/src/styles.css';

export const metadata: Metadata = {
  title: 'You OS — AI Chief of Staff',
  description: 'Your personalized executive operating system.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
