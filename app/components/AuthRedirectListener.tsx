'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function AuthRedirectListener({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password';

      if (session && isAuthPage) {
        router.replace('/dashboard');
      } else if (!session && pathname === '/dashboard') {
        router.replace('/login');
      }
    };

    void checkSession();
  }, [pathname, router]);

  return <>{children}</>;
}
