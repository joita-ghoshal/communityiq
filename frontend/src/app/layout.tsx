import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from 'react-hot-toast';
import I18nProvider from '@/lib/i18n/provider';

export const metadata: Metadata = {
  title: 'CommunityIQ — AI-Powered Civic Intelligence Platform',
  description: 'Enterprise-grade AI platform for intelligent civic issue identification, verification, prediction, and resolution.',
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <I18nProvider>
                {children}
                <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' } }} />
              </I18nProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
