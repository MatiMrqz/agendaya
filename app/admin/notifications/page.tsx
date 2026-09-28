'use client';

import React, { useState, useEffect } from 'react';

interface NotificationPreferences {
  newBooking: boolean;
  cancellation: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newBooking: true,
  cancellation: true,
};

const NOTIFICATION_ITEMS = [
  {
    key: 'newBooking' as keyof NotificationPreferences,
    labelId: 'label-newBooking',
    label: 'Nueva reserva',
    description:
      'Recibir un correo electrónico cada vez que un cliente realiza una nueva reserva.',
  },
  {
    key: 'cancellation' as keyof NotificationPreferences,
    labelId: 'label-cancellation',
    label: 'Cancelación de reserva',
    description:
      'Recibir un correo electrónico cuando un cliente cancela una reserva existente.',
  },
] as const;

function Toggle({
  checked,
  onChange,
  disabled,
  labelId,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  labelId: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'bg-emerald-600'
          : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/notifications/preferences');
      if (!res.ok) {
        throw new Error('No se pudieron cargar las preferencias.');
      }
      const data = await res.json();
      setPreferences(data);
      setLoaded(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences(updated: NotificationPreferences) {
    const previous = { ...preferences };
    setPreferences(updated);
    setSaving(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar las preferencias.');
      }
      const saved = await res.json();
      setPreferences(saved);
      setSuccessMessage('Preferencias actualizadas correctamente.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setPreferences(previous);
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(key: keyof NotificationPreferences) {
    const updated = { ...preferences, [key]: !preferences[key] };
    savePreferences(updated);
  }

  async function handleResetConfirm() {
    setSaving(true);
    setSuccessMessage(null);
    setError(null);
    setShowResetModal(false);

    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      if (!res.ok) {
        throw new Error('Error al restablecer las preferencias.');
      }
      const data = await res.json();
      setPreferences(data);
      setSuccessMessage(
        'Configuración restablecida a valores predeterminados.'
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (error && !loaded) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 font-medium">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Preferencias de Notificación
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Gestioná las notificaciones por correo electrónico que recibís como
          administrador.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400 font-medium">
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400 font-medium">
          Error: {error}
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Notificaciones del Administrador
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configurá qué eventos generan un correo electrónico a tu casilla.
          </p>
        </div>

        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between px-6 py-5"
            >
              <div className="flex-1 pr-4">
                <span
                  id={item.labelId}
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {item.label}
                </span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {item.description}
                </p>
              </div>
              <Toggle
                checked={preferences[item.key]}
                onChange={() => handleToggle(item.key)}
                disabled={saving}
                labelId={item.labelId}
              />
            </div>
          ))}
        </div>

        <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-950/30 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={saving}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm disabled:opacity-50"
          >
            Restablecer configuración predeterminada
          </button>
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              ¿Restablecer configuración predeterminada?
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Esta acción restaurará todas las preferencias de notificación a sus
              valores iniciales. Ambas notificaciones serán activadas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 px-4 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
