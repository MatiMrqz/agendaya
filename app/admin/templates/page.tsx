'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  html: string;
  status: 'active' | 'draft';
  lastModified: string;
  lastModifiedBy: string;
}

export default function TemplatesGridPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/notifications/templates');
        if (!res.ok) {
          throw new Error('No se pudieron cargar las plantillas.');
        }
        const data = await res.json();
        setTemplates(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Error al conectar con la API.');
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Gestión de Plantillas</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Centralizá y gestioná las notificaciones automáticas enviadas a los clientes.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 font-medium">
          Error: {error}
        </div>
      )}

      {/* Main Grid Card */}
      {!loading && !error && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="py-4 px-6">Acción / Plantilla</th>
                  <th className="py-4 px-6">Destinatario</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6">Última Modificación</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-zinc-900 dark:text-zinc-100">
                      {template.name}
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                      Usuario Invitado
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {template.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 dark:text-zinc-400">
                      <div className="flex flex-col">
                        <span>{formatDate(template.lastModified)}</span>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">por {template.lastModifiedBy}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/admin/templates/${template.id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors shadow-sm"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
