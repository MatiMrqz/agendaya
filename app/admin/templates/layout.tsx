import React from 'react';

export default function AdminTemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Agenda<span className="text-emerald-600 dark:text-emerald-500">YA</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Administrador
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-10 px-6">
        {children}
      </main>
    </div>
  );
}
