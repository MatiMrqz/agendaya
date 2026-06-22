'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
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

const FACTORY_DEFAULTS: Record<string, { subject: string; preheader: string; html: string }> = {
  'new-booking': {
    subject: '¡Reserva de {{nombre}}!',
    preheader: 'Cita el {{fecha}}',
    html: '<p>Hola {{nombre}}</p>'
  },
  'cancellation': {
    subject: 'Cita cancelada - {{fecha}}',
    preheader: 'Tu cita del {{fecha}} ha sido cancelada.',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Cancelada</title>
  <style>
    body{font-family:sans-serif;background-color:#f4f4f5;margin:0;padding:20px;}
    #card{background-color:#ffffff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
    .title{color:#e11d48;font-size:20px;font-weight:600;margin-top:0;}
    .text{color:#52525b;font-size:16px;line-height:24px;}
    .button{display:inline-block;background-color:#18181b;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;margin-top:16px;}
  </style>
</head>
<body>
  <div id="card">
    <h1 class="title">Cita Cancelada</h1>
    <p class="text">Hola, {{nombre}}.</p>
    <p class="text">Te informamos que tu cita programada para el día <strong>{{fecha}}</strong> a las <strong>{{hora}}</strong> ha sido cancelada.</p>
    <p class="text">Si considerás que esto es un error o querés agendar una nueva cita, podés hacerlo ingresando a nuestra agenda:</p>
    <a href="{{enlace}}" class="button">Agendar Cita</a>
  </div>
</body>
</html>`
  },
  'confirmation': {
    subject: 'Cita confirmada - {{fecha}}',
    preheader: 'Te recordamos tu próxima cita del {{fecha}}.',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita Confirmada</title>
  <style>
    body{font-family:sans-serif;background-color:#f4f4f5;margin:0;padding:20px;}
    #card{background-color:#ffffff;border-radius:8px;padding:24px;max-width:600px;margin:0 auto;box-shadow:0 1px 3px rgba(0,0,0,0.1);}
    .title{color:#16a34a;font-size:20px;font-weight:600;margin-top:0;}
    .text{color:#52525b;font-size:16px;line-height:24px;}
    .button{display:inline-block;background-color:#18181b;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;margin-top:16px;}
  </style>
</head>
<body>
  <div id="card">
    <h1 class="title">¡Cita Confirmada!</h1>
    <p class="text">Hola, {{nombre}}.</p>
    <p class="text">Tu cita para el día <strong>{{fecha}}</strong> a las <strong>{{hora}}</strong> ha sido confirmada correctamente.</p>
    <p class="text">Para cualquier duda o cambio, podés ingresar al siguiente enlace:</p>
    <a href="{{enlace}}" class="button">Gestionar Cita</a>
  </div>
</body>
</html>`
  }
};

const mockVariables: Record<string, string> = {
  nombre: 'Juan Pérez',
  fecha: '2026-06-25',
  hora: '15:30',
  enlace: 'https://agendaya.app/citas/test-123'
};

function interpolateVariables(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] || match);
}

export default function TemplateEditorPage() {
  const params = useParams();
  const templateId = params?.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Test Email states
  const [testEmail, setTestEmail] = useState('test@agendaya.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Modal reset confirm state
  const [showResetModal, setShowResetModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const res = await fetch('/api/notifications/templates');
        if (!res.ok) {
          throw new Error('No se pudieron cargar las plantillas.');
        }
        const data: Template[] = await res.json();
        const found = data.find((t) => t.id === templateId);
        if (!found) {
          throw new Error('La plantilla solicitada no existe.');
        }
        setTemplate(found);
        setSubject(found.subject);
        setPreheader(found.preheader || '');
        setHtml(found.html);
        setStatus(found.status);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Error al conectar con la API.');
      } finally {
        setLoading(false);
      }
    }

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaveSuccess(false);

    // Validate
    const errors: Record<string, boolean> = {};
    if (!subject.trim()) {
      errors.subject = true;
    }
    if (!html.trim()) {
      errors.html = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);

    try {
      const res = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateId,
          subject,
          preheader,
          html,
          status,
          lastModifiedBy: 'Admin'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar la plantilla.');
      }

      const updated = await res.json();
      setTemplate(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error al guardar: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    setTestSuccess(null);
    setTestError(null);
    if (!testEmail.trim()) {
      setTestError('El correo es obligatorio');
      return;
    }
    setSendingTest(true);

    try {
      const res = await fetch('/api/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          templateId,
          subject,
          preheader,
          html
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar el correo de prueba.');
      }

      setTestSuccess('¡Correo de prueba enviado con éxito!');
      setTimeout(() => setTestSuccess(null), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setTestError(message || 'Error desconocido.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleResetToDefault = () => {
    const defaults = FACTORY_DEFAULTS[templateId];
    if (defaults) {
      setSubject(defaults.subject);
      setPreheader(defaults.preheader);
      setHtml(defaults.html);
      setValidationErrors({});
    }
    setShowResetModal(false);
  };

  const insertVariable = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newHtml = text.substring(0, start) + variableName + text.substring(end);
    setHtml(newHtml);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variableName.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Interpolated preview inputs
  const previewSubject = interpolateVariables(subject, mockVariables);
  const previewPreheader = interpolateVariables(preheader, mockVariables);
  const previewHtml = interpolateVariables(html, mockVariables);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 font-medium">
        <p className="mb-4">Error: {error || 'Plantilla no encontrada'}</p>
        <Link href="/admin/templates" className="text-sm font-semibold underline hover:text-rose-700 dark:hover:text-rose-300">
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/templates"
            aria-label="Volver a la lista de plantillas"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <span className="text-zinc-600 dark:text-zinc-400">&larr;</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Editar Plantilla: {template.name}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ID: <span className="font-mono">{template.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {FACTORY_DEFAULTS[templateId] && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shadow-sm"
            >
              Volver a Plantilla predeterminada
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 px-5 text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-md shadow-emerald-500/10"
          >
            {saving ? 'Guardando...' : 'Guardar Plantilla'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400 font-medium animate-fade-in">
          ✓ ¡La plantilla se guardó correctamente!
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Form Editor */}
        <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            {/* Subject Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Asunto (obligatorio)
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (e.target.value.trim()) {
                    setValidationErrors((prev) => ({ ...prev, subject: false }));
                  }
                }}
                className={`w-full rounded-lg border ${
                  validationErrors.subject ? 'border-rose-500 bg-rose-50/10 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 focus:ring-emerald-500'
                } px-4 py-2.5 text-sm outline-none focus:ring-2 transition-all`}
                placeholder="Escribí el asunto del correo..."
              />
              {validationErrors.subject && (
                <span className="text-xs text-rose-500">El asunto es obligatorio.</span>
              )}
            </div>

            {/* Preheader Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="preheader" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Preheader
              </label>
              <input
                id="preheader"
                type="text"
                value={preheader}
                onChange={(e) => setPreheader(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="Texto corto que se muestra abajo del asunto en la bandeja de entrada..."
              />
            </div>

            {/* Variable Helpers */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Insertar variables:
              </span>
              <div className="flex flex-wrap gap-2">
                {['{{nombre}}', '{{fecha}}', '{{hora}}', '{{enlace}}'].map((variable) => (
                  <button
                    key={variable}
                    type="button"
                    onClick={() => insertVariable(variable)}
                    className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors border border-zinc-200/50 dark:border-zinc-800"
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>

            {/* HTML Editor Textarea */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="html" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Editor HTML
              </label>
              <textarea
                id="html"
                ref={textareaRef}
                value={html}
                onChange={(e) => {
                  setHtml(e.target.value);
                  if (e.target.value.trim()) {
                    setValidationErrors((prev) => ({ ...prev, html: false }));
                  }
                }}
                rows={15}
                className={`w-full font-mono text-sm rounded-lg border ${
                  validationErrors.html ? 'border-rose-500 bg-rose-50/10 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-emerald-400 dark:text-emerald-300 focus:ring-emerald-500'
                } p-4 outline-none focus:ring-2 transition-all leading-relaxed`}
                placeholder="Escribí el código HTML aquí..."
              />
              {validationErrors.html && (
                <span className="text-xs text-rose-500">El cuerpo HTML es obligatorio.</span>
              )}
            </div>
          </div>
        </form>

        {/* Right Column: Dynamic Live Preview & Test email panel */}
        <div className="space-y-6">
          {/* Real-time Email Client Preview Simulator */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col">
            {/* Window header */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400 block"></span>
                <span className="h-3 w-3 rounded-full bg-amber-400 block"></span>
                <span className="h-3 w-3 rounded-full bg-emerald-400 block"></span>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 ml-2">
                  Vista Previa en Vivo (Simulación)
                </span>
              </div>
              <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                Auto-update
              </span>
            </div>

            {/* Email Metadata Card */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/50 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <p>
                <span className="text-zinc-400 font-normal">De:</span>{' '}
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                  AgendaYA &lt;onboarding@resend.dev&gt;
                </span>
              </p>
              <p>
                <span className="text-zinc-400 font-normal">Para:</span>{' '}
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{testEmail}</span>
              </p>
              <p className="truncate">
                <span className="text-zinc-400 font-normal">Asunto:</span>{' '}
                <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                  {previewSubject || '(Sin asunto)'}
                </span>
              </p>
              {previewPreheader && (
                <p className="truncate">
                  <span className="text-zinc-400 font-normal">Preheader:</span>{' '}
                  <span className="text-zinc-700 dark:text-zinc-300 italic">{previewPreheader}</span>
                </p>
              )}
            </div>

            {/* Rendered HTML inside sandboxed iframe */}
            <div className="bg-white min-h-[350px] p-1 flex">
              <iframe
                title="Preview"
                sandbox="allow-same-origin"
                srcDoc={previewHtml || '<p style="font-family: sans-serif; color: #71717a; text-align: center; margin-top: 100px;">Comenzá a escribir HTML para ver la vista previa...</p>'}
                className="w-full flex-grow border-0 rounded"
                style={{ minHeight: '350px' }}
              />
            </div>
          </div>

          {/* Test Email Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Probar Plantilla
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enviá un correo de prueba usando el servicio configurado para ver cómo se visualiza en tu bandeja de entrada.
            </p>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-grow flex flex-col gap-1">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="destinatario@correo.com"
                  aria-label="Correo de Prueba"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 px-4 text-sm font-semibold text-white dark:text-zinc-900 disabled:opacity-50 transition-colors shadow-sm shrink-0"
              >
                {sendingTest ? 'Enviando...' : 'Enviar Correo de Prueba'}
              </button>
            </div>

            {testSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {testSuccess}
              </p>
            )}
            {testError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Error: {testError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              ¿Restaurar valores de fábrica?
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Esta acción reemplazará los textos y el HTML actual en el editor por la plantilla predeterminada del sistema. Los cambios que no hayas guardado se perderán.
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
                onClick={handleResetToDefault}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 px-4 text-sm font-semibold text-white transition-colors shadow-sm"
              >
                Confirmar y Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
