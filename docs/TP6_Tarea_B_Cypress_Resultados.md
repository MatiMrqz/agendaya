# TP6 — Tarea B: Cypress sobre AgendaYA

## Implementación

Se actualizó `main` con `git pull --ff-only origin main` (ya estaba al día) y se creó la rama `test/tp6-cypress`. Se usaron la grilla y el editor existentes, sin cambiar el frontend ni las APIs de producción.

Se agregó Cypress 16.1.1, scripts `cy:run` y `cy:open`, configuración con una única `baseUrl` y seis tests distintos con comentarios Arrange, Act y Assert. Todos empiezan en `/admin/templates`, seleccionan Editar por `data-cy` y terminan verificando el resultado. El archivo de configuración usa módulos ESM. Vitest quedó limitado a los tests de `app` para separar las suites.

## Ejecución

```sh
npm ci
npm run dev
# En otra terminal, con la aplicación disponible en localhost:3000:
npx cypress run
# Alternativa interactiva:
npm run cy:open
# Suite existente (ejecutar por separado de Cypress):
npm test
```

En PowerShell con ejecución de scripts deshabilitada, usar `npm.cmd` y `npx.cmd`. También está sincronizado `pnpm-lock.yaml` para quienes instalen con pnpm.

Para la presentación en vivo, ejecutar los escenarios 01 (guardado exitoso) y 02 (rechazo de asunto vacío), seleccionándolos en el runner interactivo. El segundo prueba un error de validación esperado: su test debe aprobar. No se realizó la presentación en vivo en esta implementación.

## Datos y simulación

Los textos de los escenarios 01 y 06 son independientes. Antes de cada test se restaura la base y se consulta la plantilla original. Los guardados utilizan la API real y se verifican leyendo `data/templates.json` y recargando el editor. Los casos inválidos verifican el mensaje visible, que no haya POST de guardado y que la plantilla completa permanezca igual.

El proceso de Cypress conserva los bytes originales de `data/templates.json` al comenzar la spec y los restaura después de cada test, al terminar la spec y al terminar la ejecución. Esto incluye metadatos y saltos de línea. Ejecutar sobre una instancia local de pruebas, sin edición simultánea de plantillas ni otra suite: Vitest también accede a archivos de datos. Un cierre forzado del proceso puede impedir ejecutar los hooks de restauración; no interrumpir el runner durante el guardado.

Todos los POST a `/api/notifications/send-test` del navegador están interceptados y reciben `{ success: true, simulated: true }`. El escenario 04 verifica destinatario, identificador, asunto y HTML enviados por la interfaz, y su confirmación visible. Esta simulación no verifica Resend ni la ruta real de envío ni la entrega de un correo. No se enviaron correos reales. El escenario 05 comprueba que la validación detiene la petición cuando falta destinatario.

## Resultados reales

Entorno: Windows, Node 24.14.0, Next.js 16.2.9 en modo desarrollo, Cypress 16.1.1, Electron 146 headless y Vitest 4.1.11 instalado con npm.

| Escenario | Resultado final | Verificación |
| --- | --- | --- |
| 01 Editar y guardar | APROBADO | POST 200, confirmación, asunto y HTML en disco y tras recarga |
| 02 Asunto vacío | APROBADO | Error visible, sin POST, sin persistir cambios |
| 03 HTML vacío | APROBADO | Error visible, sin POST, sin persistir cambios |
| 04 Envío simulado | APROBADO | Payload correcto, respuesta simulada y confirmación visible |
| 05 Sin destinatario | APROBADO | Error visible y sin solicitud de envío |
| 06 Variable dinámica | APROBADO | Inserción de `{{nombre}}`, POST 200 y contenido persistido |

Ejecución final: **6 aprobados, 0 fallos**, aproximadamente 10 segundos. Vitest: **30 aprobados en 8 archivos**, salida 0 en ejecución directa. ESLint sobre los archivos de configuración y tests agregados/modificados, `npx tsc --noEmit` y `git diff --check`: sin errores. Se verificó con Git que ambos archivos de datos quedaron sin cambios. Vitest muestra una advertencia de Vite sobre ESM en `vitest.config.ts` para un futuro cambio de loader; no produjo fallos.

### Fallo observado y decisión

Primera ejecución: 5 aprobados y 1 fallo. Se conserva el log completo en `cypress/results/cypress-first-run.txt`, el video inicial y la captura automática del fallo. Mensaje de la aserción:

```text
1) M06 — Plantillas de notificaciones
     05 — rechaza envío sin destinatario:

    Timed out retrying after 15000ms
    + expected - actual

    -'Error: El correo es obligatorio'
    +'El correo es obligatorio'

    at Context.eval (webpack://agendaya/./cypress/e2e/templates.cy.js:115:47)
```

Causa: la aserción esperaba el mensaje sin el prefijo `Error:` renderizado por el componente. Decisión: corregir la expectativa exacta a `Error: El correo es obligatorio`, sin modificar la aplicación ni ocultar el fallo. Se volvieron a ejecutar los seis escenarios y aprobaron.

La primera prueba de arranque del navegador dentro del sandbox falló con código 3221225477 en `Cypress.exe --smoke-test`; no había ejecutado tests. Con autorización para ejecutar fuera del sandbox, Cypress verificó el binario y ejecutó la suite. La instalación también necesitó autorización para escribir las cachés de npm/Cypress.

## Evidencia local

- Log final: `cypress/results/cypress.txt`.
- Log de la primera ejecución: `cypress/results/cypress-first-run.txt`.
- Log de Vitest: `cypress/results/vitest.txt` (30 aprobados; contiene también el formato de advertencia de PowerShell al redirigir stderr).
- Capturas: `cypress/screenshots/templates.cy.js/`. Las capturas finales de 01, 02, 03, 04 y 06 tienen sufijo ` (1)`; la de 05 se llama `05-destinatario-obligatorio.png`.
- Video final: `cypress/videos/templates.cy.js (1).mp4`.
- Video inicial: `cypress/videos/templates.cy.js.mp4`.
- Captura del fallo: `cypress/screenshots/templates.cy.js/M06 — Plantillas de notificaciones -- 05 — rechaza envío sin destinatario (failed).png`.

Las evidencias se conservan localmente y están ignoradas por Git. `trashAssetsBeforeRuns: false` evita que otra ejecución borre las pruebas anteriores. Copiar los archivos requeridos al informe antes de entregar.

## Archivos de la implementación

`package.json`, `package-lock.json` (ya existía sin seguimiento y se actualizó), `pnpm-lock.yaml`, `.gitignore`, `vitest.config.ts`, `cypress.config.mjs`, `cypress/e2e/templates.cy.js` y este documento. La consigna y los demás archivos de `docs/` ya estaban presentes sin seguimiento. No se asignaron autorías: el equipo debe identificar quién desarrolló y revisó cada escenario.

## Código completo de los seis tests

Fuente ejecutable: `cypress/e2e/templates.cy.js`. Se reproduce a continuación, incluidos los helpers y la restauración.

```javascript
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

```
