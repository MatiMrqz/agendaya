import { describe, it, expect } from 'vitest';
import { insertAtCursor, isAtDefaults } from '../notification-logic';

describe('insertAtCursor', () => {
  it('inserts the value in the middle of the text', () => {
    // Arrange
    const text = '<p>Hola </p>';

    // Act
    const result = insertAtCursor(text, '{{nombre}}', 8);

    // Assert
    expect(result).toBe('<p>Hola {{nombre}}</p>');
  });

  it('inserts the value at the beginning of the text', () => {
    // Arrange
    const text = ', te esperamos.';

    // Act
    const result = insertAtCursor(text, '{{nombre}}', 0);

    // Assert
    expect(result).toBe('{{nombre}}, te esperamos.');
  });

  it('appends the value when the position is greater than the text length', () => {
    // Arrange
    const text = 'Tu cita es el ';

    // Act
    const result = insertAtCursor(text, '{{fecha}}', 999);

    // Assert
    expect(result).toBe('Tu cita es el {{fecha}}');
  });
  it('inserts the value at the beginning when the position is negative', () => {
    // Arrange
    const text = ', te esperamos.';

    // Act
    const result = insertAtCursor(text, '{{nombre}}', -1);

    // Assert
    expect(result).toBe('{{nombre}}, te esperamos.');
  });
});

describe('isAtDefaults', () => {
  it('returns true when preferences match the defaults', () => {
    // Arrange
    const current = { newBooking: true, cancellation: true };

    // Act
    const result = isAtDefaults(current);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when one preference differs from the defaults', () => {
    // Arrange
    const current = { newBooking: true, cancellation: false };

    // Act
    const result = isAtDefaults(current);

    // Assert
    expect(result).toBe(false);
  });
  it('returns false when the booking preference differs from the defaults', () => {
    // Arrange
    const current = { newBooking: false, cancellation: true };

    // Act
    const result = isAtDefaults(current);

    // Assert
    expect(result).toBe(false);
  });
});
