import { describe, it, expect } from 'vitest';
import { validateTemplate, applyTemplateUpdate, type Template } from '../notification-logic';

describe('validateTemplate', () => {
  it('returns no errors for a template with subject and html', () => {
    // Arrange
    const input = { subject: 'Reserva de {{nombre}}', html: '<p>Hola {{nombre}}</p>' };

    // Act
    const errors = validateTemplate(input);

    // Assert
    expect(errors).toEqual([]);
  });

  it('rejects a subject composed only of whitespace', () => {
    // Arrange
    const input = { subject: '   ', html: '<p>Contenido</p>' };

    // Act
    const errors = validateTemplate(input);

    // Assert
    expect(errors).toEqual(['El asunto es obligatorio']);
  });

  it('rejects an empty html body', () => {
    // Arrange
    const input = { subject: 'Asunto', html: '' };

    // Act
    const errors = validateTemplate(input);

    // Assert
    expect(errors).toEqual(['El cuerpo de la plantilla es obligatorio']);
  });
});

describe('applyTemplateUpdate', () => {
  const templates: Template[] = [
    { id: 'new-booking', subject: 'Reserva', html: '<p>Hola</p>' },
    { id: 'cancellation', subject: 'Cancelación', html: '<p>Chau</p>' },
  ];

  it('updates the matching template without mutating the original list', () => {
    // Arrange
    const update = { id: 'new-booking', subject: 'Nuevo asunto' };

    // Act
    const result = applyTemplateUpdate(templates, update);

    // Assert
    expect(result).not.toBeNull();
    expect(result![0].subject).toBe('Nuevo asunto');
    expect(result![0].html).toBe('<p>Hola</p>');
    expect(result![1]).toEqual(templates[1]);
    expect(templates[0].subject).toBe('Reserva');
    expect(result).not.toBe(templates);
  });

  it('returns null when the template id does not exist', () => {
    // Arrange
    const update = { id: 'template-inexistente', subject: 'Asunto' };

    // Act
    const result = applyTemplateUpdate(templates, update);

    // Assert
    expect(result).toBeNull();
  });
});
