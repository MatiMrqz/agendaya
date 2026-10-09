import { describe, it, expect } from 'vitest';
import { interpolateVariables, buildEmail } from '../notification-logic';

describe('interpolateVariables', () => {
  it('replaces a known variable with its value', () => {
    // Arrange
    const text = 'Hola {{nombre}}';
    const vars = { nombre: 'Juan' };

    // Act
    const result = interpolateVariables(text, vars);

    // Assert
    expect(result).toBe('Hola Juan');
  });

  it('replaces every occurrence of a repeated variable', () => {
    // Arrange
    const text = '{{nombre}}, te esperamos. ¡Gracias {{nombre}}!';
    const vars = { nombre: 'Ana' };

    // Act
    const result = interpolateVariables(text, vars);

    // Assert
    expect(result).toBe('Ana, te esperamos. ¡Gracias Ana!');
  });

  it('leaves unknown variables unchanged', () => {
    // Arrange
    const text = 'Tu cita es el {{fecha}}';
    const vars = { nombre: 'Juan' };

    // Act
    const result = interpolateVariables(text, vars);

    // Assert
    expect(result).toBe('Tu cita es el {{fecha}}');
  });

  it('replaces a variable whose value is an empty string', () => {
    // Arrange
    const text = 'Hola {{nombre}}!';
    const vars = { nombre: '' };

    // Act
    const result = interpolateVariables(text, vars);

    // Assert
    expect(result).toBe('Hola !');
  });
});

describe('buildEmail', () => {
  it('builds subject, preheader and html, using an empty preheader when missing', () => {
    // Arrange
    const template = { subject: 'Reserva de {{nombre}}', html: '<p>Cita el {{fecha}}</p>' };
    const vars = { nombre: 'Juan', fecha: '15/10/2026' };

    // Act
    const email = buildEmail(template, vars);

    // Assert
    expect(email).toEqual({
      subject: 'Reserva de Juan',
      preheader: '',
      html: '<p>Cita el 15/10/2026</p>',
    });
  });
});
