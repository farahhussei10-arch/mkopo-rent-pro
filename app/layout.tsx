import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './components/LanguageProvider';

export const metadata: Metadata = {
  title: 'Mkopo & Rent Tracker',
  description: 'Professional Kenyan business app for loan and rent tracking.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-slate-900">
        <LanguageProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          <div className="mx-auto flex min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="w-full rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-6 lg:p-8">
              {children}
            </div>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
