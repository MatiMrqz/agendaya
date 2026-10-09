import { describe, it, expect } from 'vitest';
import { extractVariables, findMissingVariables } from '../notification-logic';

describe('extractVariables', () => {
  it('returns each variable once, in order of appearance', () => {
    // Arrange
    const text = 'Hola {{nombre}}, tu cita es el {{fecha}}. ¡Te esperamos, {{nombre}}!';

    // Act
    const result = extractVariables(text);

    // Assert
    expect(result).toEqual(['nombre', 'fecha']);
  });

  it('returns an empty list when the text has no variables', () => {
    // Arrange
    const text = '<p>Gracias por tu reserva.</p>';

    // Act
    const result = extractVariables(text);

    // Assert
    expect(result).toEqual([]);
  });

  it('ignores malformed variables such as {nombre} or {{ nombre }}', () => {
    // Arrange
    const text = 'Hola {nombre}, tu cita es el {{ fecha }} a las {{hora}}';

    // Act
    const result = extractVariables(text);

    // Assert
    expect(result).toEqual(['hora']);
  });
});

describe('findMissingVariables', () => {
  it('returns an empty list when every variable has a value', () => {
    // Arrange
    const text = 'Hola {{nombre}}, tu cita es el {{fecha}}';
    const vars = { nombre: 'Juan', fecha: '15/10/2026' };

    // Act
    const missing = findMissingVariables(text, vars);

    // Assert
    expect(missing).toEqual([]);
  });

  it('returns the variable that has no value', () => {
    // Arrange
    const text = 'Hola {{nombre}}, tu cita es a las {{hora}}';
    const vars = { nombre: 'Juan' };

    // Act
    const missing = findMissingVariables(text, vars);

    // Assert
    expect(missing).toEqual(['hora']);
  });
  it('treats a variable with an empty value as available', () => {
    // Arrange
    const text = 'Hola {{nombre}}';
    const vars = { nombre: '' };

    // Act
    const missing = findMissingVariables(text, vars);

    // Assert
    expect(missing).toEqual([]);
  });
});
