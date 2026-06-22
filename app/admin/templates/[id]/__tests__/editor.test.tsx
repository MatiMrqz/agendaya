import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TemplateEditorPage from '../page';

// Mock useParams and useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => {
  return {
    useParams: () => ({ id: 'new-booking' }),
    useRouter: () => ({
      push: mockPush,
      back: vi.fn()
    })
  };
});

const mockTemplate = {
  id: 'new-booking',
  name: 'Nueva Reserva',
  subject: '¡Reserva de {{nombre}}!',
  preheader: 'Cita el {{fecha}}',
  html: '<p>Hola {{nombre}}</p>',
  status: 'active',
  lastModified: '2026-06-20T18:00:00.000Z',
  lastModifiedBy: 'Admin'
};

describe('TemplateEditorPage Component', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      // Mock templates load
      if (url === '/api/notifications/templates' && !init) {
        return Promise.resolve({
          ok: true,
          json: async () => [mockTemplate]
        });
      }
      // Mock save
      if (url === '/api/notifications/templates' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => JSON.parse((init.body as string) || '{}')
        });
      }
      // Mock send test
      if (url === '/api/notifications/send-test' && init?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders editor fields with loaded template data', async () => {
    render(<TemplateEditorPage />);

    await waitFor(() => {
      expect(screen.getByText('Editar Plantilla: Nueva Reserva')).toBeInTheDocument();
    });

    const subjectInput = screen.getByLabelText(/Asunto/i) as HTMLInputElement;
    expect(subjectInput.value).toBe('¡Reserva de {{nombre}}!');

    const preheaderInput = screen.getByLabelText(/Preheader/i) as HTMLInputElement;
    expect(preheaderInput.value).toBe('Cita el {{fecha}}');

    const htmlTextarea = screen.getByLabelText(/Editor HTML/i) as HTMLTextAreaElement;
    expect(htmlTextarea.value).toBe('<p>Hola {{nombre}}</p>');
  });

  it('inserts variable helper placeholder at cursor position', async () => {
    render(<TemplateEditorPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Editor HTML/i)).toBeInTheDocument();
    });

    const htmlTextarea = screen.getByLabelText(/Editor HTML/i) as HTMLTextAreaElement;
    htmlTextarea.focus();
    htmlTextarea.setSelectionRange(17, 17); // End of value

    const varButton = screen.getByRole('button', { name: /\{\{fecha\}\}/i });
    fireEvent.click(varButton);

    expect(htmlTextarea.value).toContain('{{fecha}}');
  });

  it('validates required fields on save', async () => {
    render(<TemplateEditorPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Asunto/i)).toBeInTheDocument();
    });

    const subjectInput = screen.getByLabelText(/Asunto/i) as HTMLInputElement;
    const saveButton = screen.getByRole('button', { name: /Guardar Plantilla/i });

    // Empty subject
    fireEvent.change(subjectInput, { target: { value: '' } });
    fireEvent.click(saveButton);

    // Should render warning borders / error toasts
    await waitFor(() => {
      expect(subjectInput.className).toContain('border-rose-500');
    });
  });

  it('sends test email when clicking send test button', async () => {
    render(<TemplateEditorPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Enviar Correo de Prueba/i })).toBeInTheDocument();
    });

    const sendTestButton = screen.getByRole('button', { name: /Enviar Correo de Prueba/i });
    fireEvent.click(sendTestButton);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/notifications/send-test', expect.any(Object));
    });
  });
});
