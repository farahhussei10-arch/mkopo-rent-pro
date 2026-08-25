'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
    onClose();
    toast.success('Logged out successfully');
  };

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '➕', label: 'Add Client', href: '/dashboard/add-client' },
    { icon: '📋', label: 'Archived Clients', href: '/dashboard' },
    { icon: '📊', label: 'Reports & Analytics', href: '/dashboard/reports' },
    { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-emerald-600">Mkopo</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close sidebar"
              >
                ✕
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Business OS for SMEs</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-1 px-3 py-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            <button
              onClick={handleLogout}
              className="w-full rounded-lg bg-red-50 px-4 py-3 text-center font-medium text-red-600 transition hover:bg-red-100"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
