import { describe, it, expect } from 'vitest';
import { isValidEmail, validateSendTestRequest } from '../notification-logic';

describe('isValidEmail', () => {
  it('accepts a well-formed email address', () => {
    // Arrange
    const email = 'cliente@example.com';

    // Act
    const result = isValidEmail(email);

    // Assert
    expect(result).toBe(true);
  });

  it('rejects an address without @', () => {
    // Arrange
    const email = 'cliente.example.com';

    // Act
    const result = isValidEmail(email);

    // Assert
    expect(result).toBe(false);
  });

  it('rejects an empty or whitespace-only address', () => {
    // Arrange
    const empty = '';
    const spaces = '   ';

    // Act
    const resultEmpty = isValidEmail(empty);
    const resultSpaces = isValidEmail(spaces);

    // Assert
    expect(resultEmpty).toBe(false);
    expect(resultSpaces).toBe(false);
  });
});

describe('validateSendTestRequest', () => {
  it('accepts a request with a valid recipient and template id', () => {
    // Arrange
    const body = { to: 'cliente@example.com', templateId: 'new-booking' };

    // Act
    const error = validateSendTestRequest(body);

    // Assert
    expect(error).toBeNull();
  });

  it('rejects a request without templateId', () => {
    // Arrange
    const body = { to: 'cliente@example.com' };

    // Act
    const error = validateSendTestRequest(body);

    // Assert
    expect(error).toBe('El identificador de plantilla es obligatorio');
  });
  it('rejects a request without recipient', () => {
    // Arrange
    const body = { templateId: 'new-booking' };

    // Act
    const error = validateSendTestRequest(body);

    // Assert
    expect(error).toBe('La dirección de correo de destino es obligatoria');
  });

  it('rejects a request with a malformed recipient', () => {
    // Arrange
    const body = { to: 'cliente.example.com', templateId: 'new-booking' };

    // Act
    const error = validateSendTestRequest(body);

    // Assert
    expect(error).toBe('La dirección de correo de destino no es válida');
  });
});
