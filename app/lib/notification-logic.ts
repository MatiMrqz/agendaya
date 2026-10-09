/**
 * Lógica de negocio del módulo M06 — Notificaciones.
 * Funciones puras, sin dependencias de la interfaz ni del sistema de archivos,
 * para poder verificarlas con tests unitarios (TP6 · Tarea C).
 */

export interface TemplateInput {
  subject?: string | null;
  html?: string | null;
}

export interface Template {
  id: string;
  subject: string;
  preheader?: string;
  html: string;
  [key: string]: unknown;
}

export interface NotificationPreferences {
  newBooking: boolean;
  cancellation: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  newBooking: true,
  cancellation: true,
};

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

// ---------- Plantillas: validación y actualización (Márquez) ----------

/** Devuelve la lista de errores de una plantilla; vacía si es válida. */
export function validateTemplate(input: TemplateInput): string[] {
  const errors: string[] = [];
  if (!input.subject || input.subject.trim() === '') {
    errors.push('El asunto es obligatorio');
  }
  if (!input.html || input.html.trim() === '') {
    errors.push('El cuerpo de la plantilla es obligatorio');
  }
  return errors;
}

/**
 * Aplica una actualización a la plantilla con el mismo id.
 * Devuelve una nueva lista, o null si la plantilla no existe. No muta la original.
 */
export function applyTemplateUpdate(
  templates: Template[],
  update: Partial<Template> & { id: string }
): Template[] | null {
  const index = templates.findIndex((t) => t.id === update.id);
  if (index === -1) return null;
  return templates.map((t, i) => (i === index ? { ...t, ...update } : t));
}

// ---------- Variables y construcción del correo (Martin) ----------

/** Reemplaza cada {{variable}} por su valor; las desconocidas quedan sin cambios. */
export function interpolateVariables(text: string, vars: Record<string, string>): string {
  return text.replace(VARIABLE_PATTERN, (match, key) => (Object.hasOwn(vars, key) ? vars[key] : match));
}

/** Construye el correo final (asunto, preheader y cuerpo) a partir de una plantilla. */
export function buildEmail(
  template: { subject: string; preheader?: string; html: string },
  vars: Record<string, string>
): { subject: string; preheader: string; html: string } {
  return {
    subject: interpolateVariables(template.subject, vars),
    preheader: interpolateVariables(template.preheader ?? '', vars),
    html: interpolateVariables(template.html, vars),
  };
}

// ---------- Detección de variables (Montenegro) ----------

/** Lista, sin duplicados y en orden de aparición, las variables {{nombre}} de un texto. */
export function extractVariables(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1]);
  }
  return [...found];
}

/** Devuelve las variables usadas en el texto que no tienen un valor disponible. */
export function findMissingVariables(text: string, vars: Record<string, string>): string[] {
  return extractVariables(text).filter((name) => !Object.hasOwn(vars, name));
}

// ---------- Preferencias (Ranzuglia) ----------

/** Valida el cuerpo de una actualización de preferencias; devuelve un mensaje de error o null. */
export function validatePreferences(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return 'Formato de preferencias inválido';
  const prefs = body as Record<string, unknown>;
  for (const key of ['newBooking', 'cancellation'] as const) {
    if (!(key in prefs)) return `Falta la preferencia ${key}`;
    if (typeof prefs[key] !== 'boolean') return `La preferencia ${key} debe ser booleana`;
  }
  return null;
}

/** Completa preferencias guardadas (posiblemente parciales) con los valores por defecto. */
export function mergeWithDefaults(
  saved: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  return { ...DEFAULT_PREFERENCES, ...(saved ?? {}) };
}

// ---------- Envío de prueba (Zaupa) ----------

/** Valida el formato básico de una dirección de correo. */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Valida la solicitud de envío de prueba; devuelve un mensaje de error o null. */
export function validateSendTestRequest(body: { to?: string; templateId?: string }): string | null {
  if (!body.to || body.to.trim() === '') return 'La dirección de correo de destino es obligatoria';
  if (!isValidEmail(body.to)) return 'La dirección de correo de destino no es válida';
  if (!body.templateId) return 'El identificador de plantilla es obligatorio';
  return null;
}

// ---------- Helper del editor y restablecimiento (Zirulnik) ----------

/** Inserta un valor en la posición indicada; las posiciones fuera de rango se ajustan a los extremos. */
export function insertAtCursor(text: string, value: string, position: number): string {
  const pos = Math.min(Math.max(position, 0), text.length);
  return text.slice(0, pos) + value + text.slice(pos);
}

/** Indica si las preferencias actuales coinciden con las predeterminadas. */
export function isAtDefaults(
  current: NotificationPreferences,
  defaults: NotificationPreferences = DEFAULT_PREFERENCES
): boolean {
  return current.newBooking === defaults.newBooking && current.cancellation === defaults.cancellation;
}
