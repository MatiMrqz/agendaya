import { describe, it, expect } from 'vitest';
import { validatePreferences, mergeWithDefaults } from '../notification-logic';

describe('validatePreferences', () => {
  it('accepts preferences with boolean values', () => {
    // Arrange
    const body = { newBooking: false, cancellation: true };

    // Act
    const error = validatePreferences(body);

    // Assert
    expect(error).toBeNull();
  });

  it('rejects a non-boolean value', () => {
    // Arrange
    const body = { newBooking: 'yes', cancellation: true };

    // Act
    const error = validatePreferences(body);

    // Assert
    expect(error).toBe('La preferencia newBooking debe ser booleana');
  });

  it('rejects preferences with a missing field', () => {
    // Arrange
    const body = { newBooking: true };

    // Act
    const error = validatePreferences(body);

    // Assert
    expect(error).toBe('Falta la preferencia cancellation');
  });
});

describe('mergeWithDefaults', () => {
  it('returns the default preferences when nothing is saved', () => {
    // Arrange
    const saved = null;

    // Act
    const result = mergeWithDefaults(saved);

    // Assert
    expect(result).toEqual({ newBooking: true, cancellation: true });
  });

  it('completes partial preferences with the defaults', () => {
    // Arrange
    const saved = { newBooking: false };

    // Act
    const result = mergeWithDefaults(saved);

    // Assert
    expect(result).toEqual({ newBooking: false, cancellation: true });
  });
});
