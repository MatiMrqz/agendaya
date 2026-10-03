const get = (name) => cy.get(`[data-cy="${name}"]`);
const id = 'new-booking';
let original;

function openEditor() {
  cy.visit('/admin/templates');
  get('templates-table').should('be.visible');
  get(`edit-template-${id}`).click();
  cy.location('pathname').should('eq', `/admin/templates/${id}`);
  get('subject-input').should('have.value', original.subject);
}

function verifyPersisted(subject, html) {
  cy.task('templates:read').then((templates) => {
    const saved = templates.find((t) => t.id === id);
    expect(saved.subject).to.equal(subject);
    expect(saved.html).to.equal(html);
  });
  cy.reload();
  get('subject-input').should('have.value', subject);
  get('html-textarea').should('have.value', html);
}

function unchanged() {
  cy.task('templates:read').then((templates) => {
    expect(templates.find((t) => t.id === id)).to.deep.equal(original);
  });
  verifyPersisted(original.subject, original.html);
}

describe('M06 — Plantillas de notificaciones', () => {
  beforeEach(() => {
    cy.task('templates:restore');
    cy.task('templates:read').then((templates) => {
      original = templates.find((t) => t.id === id);
      expect(original, 'plantilla existente').to.be.an('object');
    });
    // Bloqueo global: ningún escenario puede enviar correos reales.
    cy.intercept('POST', '/api/notifications/send-test', {
      statusCode: 200, body: { success: true, simulated: true },
    }).as('sendTest');
    cy.intercept('POST', '/api/notifications/templates').as('save');
  });
  afterEach(() => { cy.task('templates:restore'); });

  it('01 — edita, guarda y conserva los valores al recargar', () => {
    // Arrange
    openEditor();
    const subject = 'TP6 escenario 01 — reserva';
    const html = '<p>Contenido independiente del escenario 01</p>';
    // Act
    get('subject-input').clear().type(subject);
    get('html-textarea').clear().type(html);
    get('save-template-btn').click();
    // Assert
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    get('save-success-msg').should('be.visible').and('contain.text', 'se guardó correctamente');
    cy.screenshot('01-confirmacion-guardado');
    verifyPersisted(subject, html);
    cy.screenshot('01-valores-persistidos');
  });

  it('02 — rechaza asunto vacío sin persistir cambios', () => {
    // Arrange
    openEditor();
    // Act
    get('subject-input').clear();
    get('save-template-btn').click();
    // Assert
    get('subject-error').should('be.visible').and('have.text', 'El asunto es obligatorio.');
    get('save-success-msg').should('not.exist');
    cy.get('@save.all').should('have.length', 0);
    cy.screenshot('02-asunto-obligatorio');
    unchanged();
  });

  it('03 — rechaza cuerpo HTML vacío sin persistir cambios', () => {
    // Arrange
    openEditor();
    // Act
    get('html-textarea').clear();
    get('save-template-btn').click();
    // Assert
    get('html-error').should('be.visible').and('contain.text', 'obligatorio');
    get('save-success-msg').should('not.exist');
    cy.get('@save.all').should('have.length', 0);
    cy.screenshot('03-html-obligatorio');
    unchanged();
  });

  it('04 — simula envío con destinatario y muestra confirmación', () => {
    // Arrange
    openEditor();
    const recipient = 'escenario04@example.test';
    // Act
    get('test-email-input').clear().type(recipient);
    get('send-test-btn').click();
    // Assert
    cy.wait('@sendTest').then(({ request, response }) => {
      expect(request.body).to.include({ to: recipient, templateId: id, subject: original.subject, html: original.html });
      expect(response.body).to.deep.equal({ success: true, simulated: true });
    });
    get('test-success-msg').should('be.visible').and('contain.text', 'Correo de prueba enviado con éxito');
    get('test-error-msg').should('not.exist');
    cy.screenshot('04-envio-simulado');
  });

  it('05 — rechaza envío sin destinatario', () => {
    // Arrange
    openEditor();
    // Act
    get('test-email-input').clear();
    get('send-test-btn').click();
    // Assert
    get('test-error-msg').should('be.visible').and('have.text', 'Error: El correo es obligatorio');
    get('test-success-msg').should('not.exist');
    cy.get('@sendTest.all').should('have.length', 0);
    cy.screenshot('05-destinatario-obligatorio');
  });

  it('06 — inserta variable dinámica, guarda y conserva el contenido', () => {
    // Arrange
    openEditor();
    const html = '<p>Hola </p>';
    const expected = '<p>Hola {{nombre}}</p>';
    get('html-textarea').clear().type(html).then(($textarea) => {
      $textarea[0].setSelectionRange(8, 8);
    });
    // Act
    get('insert-var-nombre').click();
    get('html-textarea').should('have.value', expected);
    get('save-template-btn').click();
    // Assert
    cy.wait('@save').its('response.statusCode').should('eq', 200);
    get('save-success-msg').should('be.visible');
    cy.screenshot('06-variable-guardada');
    verifyPersisted(original.subject, expected);
    cy.screenshot('06-variable-persistida');
  });
});
