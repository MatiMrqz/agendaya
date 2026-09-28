import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NotificationPreferencesPage from '../page';

describe('NotificationPreferencesPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('when preferences load successfully', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === '/api/notifications/preferences' && !init) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ newBooking: false, cancellation: true }),
          });
        }
        if (url === '/api/notifications/preferences' && init?.method === 'POST') {
          const body = JSON.parse(init.body as string);
          if (body.reset) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ newBooking: true, cancellation: true }),
            });
          }
          return Promise.resolve({
            ok: true,
            json: async () => body,
          });
        }
        return Promise.reject(new Error('Unknown url'));
      }));
    });

    // US-06 positive — page renders with all notification preference controls
    it('renders heading, toggle controls, and reset button', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByText('Preferencias de Notificación')).toBeInTheDocument();
      });

      expect(screen.getByRole('switch', { name: /nueva reserva/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /cancelación de reserva/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restablecer/i })).toBeInTheDocument();
    });

    // US-07 positive — toggle booking notification and save
    it('toggles booking notification on and saves via API', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /nueva reserva/i })).toBeInTheDocument();
      });

      const bookingToggle = screen.getByRole('switch', { name: /nueva reserva/i });
      expect(bookingToggle).toHaveAttribute('aria-checked', 'false');

      fireEvent.click(bookingToggle);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/notifications/preferences',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ newBooking: true, cancellation: true }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/preferencias actualizadas/i)).toBeInTheDocument();
      });
    });

    // US-08 positive — toggle cancellation notification and save
    it('toggles cancellation notification off and saves via API', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /cancelación de reserva/i })).toBeInTheDocument();
      });

      const cancellationToggle = screen.getByRole('switch', { name: /cancelación de reserva/i });
      expect(cancellationToggle).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(cancellationToggle);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          '/api/notifications/preferences',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ newBooking: false, cancellation: false }),
          })
        );
      });
    });

    // US-09 Scenario 1 — reset to defaults on confirmation
    it('resets preferences to defaults when user confirms', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        const bookingToggle = screen.getByRole('switch', { name: /nueva reserva/i });
        expect(bookingToggle).toHaveAttribute('aria-checked', 'false');
      });

      fireEvent.click(screen.getByRole('button', { name: /restablecer/i }));

      await waitFor(() => {
        expect(screen.getByText(/¿Restablecer configuración predeterminada\?/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));

      await waitFor(() => {
        expect(screen.getByText(/restablecida/i)).toBeInTheDocument();
      });

      const bookingToggle = screen.getByRole('switch', { name: /nueva reserva/i });
      expect(bookingToggle).toHaveAttribute('aria-checked', 'true');
    });

    // US-09 Scenario 2 — cancel reset preserves current preferences
    it('closes reset dialog and preserves preferences when user cancels', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /nueva reserva/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /restablecer/i }));

      await waitFor(() => {
        expect(screen.getByText(/¿Restablecer configuración predeterminada\?/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

      await waitFor(() => {
        expect(screen.queryByText(/¿Restablecer configuración predeterminada\?/)).not.toBeInTheDocument();
      });

      const bookingToggle = screen.getByRole('switch', { name: /nueva reserva/i });
      expect(bookingToggle).toHaveAttribute('aria-checked', 'false');
    });
  });

  // US-06 negative — error state when preferences fail to load
  describe('when preferences fail to load', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    });

    it('shows error message when API is unreachable', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  describe('when save fails', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === '/api/notifications/preferences' && !init) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ newBooking: true, cancellation: true }),
          });
        }
        if (url === '/api/notifications/preferences' && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'Error del servidor' }),
          });
        }
        return Promise.reject(new Error('Unknown url'));
      }));
    });

    // US-07 negative — reverts toggle when save fails
    it('reverts booking toggle and shows error when save fails', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /nueva reserva/i })).toBeInTheDocument();
      });

      const bookingToggle = screen.getByRole('switch', { name: /nueva reserva/i });
      expect(bookingToggle).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(bookingToggle);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(bookingToggle).toHaveAttribute('aria-checked', 'true');
    });

    // US-08 negative — reverts toggle when save fails
    it('reverts cancellation toggle and shows error when save fails', async () => {
      render(<NotificationPreferencesPage />);

      await waitFor(() => {
        expect(screen.getByRole('switch', { name: /cancelación de reserva/i })).toBeInTheDocument();
      });

      const cancellationToggle = screen.getByRole('switch', { name: /cancelación de reserva/i });
      expect(cancellationToggle).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(cancellationToggle);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      expect(cancellationToggle).toHaveAttribute('aria-checked', 'true');
    });
  });
});
