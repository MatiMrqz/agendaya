import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import TemplatesGridPage from '../page';

// Mock fetch API globally
const mockTemplates = [
  {
    id: 'new-booking',
    name: 'Nueva Reserva',
    subject: '¡Nueva reserva!',
    preheader: 'Preheader text',
    html: '<p>Body</p>',
    status: 'active',
    lastModified: '2026-06-20T18:00:00.000Z',
    lastModifiedBy: 'Admin'
  },
  {
    id: 'cancellation',
    name: 'Cancelación de Cita',
    subject: 'Cita cancelada',
    preheader: 'Preheader text',
    html: '<p>Body</p>',
    status: 'draft',
    lastModified: '2026-06-20T18:00:00.000Z',
    lastModifiedBy: 'System'
  }
];

describe('TemplatesGridPage Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTemplates
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and displays templates in a grid table', async () => {
    render(<TemplatesGridPage />);

    // Verify it fetches from the API
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/notifications/templates');

    // Wait for the templates to load and render
    await waitFor(() => {
      expect(screen.getByText('Nueva Reserva')).toBeInTheDocument();
      expect(screen.getByText('Cancelación de Cita')).toBeInTheDocument();
    });

    // Check destinatario
    const destinatarios = screen.getAllByText('Usuario Invitado');
    expect(destinatarios.length).toBeGreaterThanOrEqual(2);

    // Check status badges
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();

    // Check edit buttons
    const editButtons = screen.getAllByRole('link', { name: /Editar/i });
    expect(editButtons).toHaveLength(2);
    expect(editButtons[0].getAttribute('href')).toBe('/admin/templates/new-booking');
  });
});
