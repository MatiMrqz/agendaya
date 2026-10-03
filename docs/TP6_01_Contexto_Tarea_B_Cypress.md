# TP6 — Contexto para implementar la Tarea B en AgendaYA

## Proyecto y alcance

- Repositorio: https://github.com/MatiMrqz/agendaya
- Rama base: `main`. Antes de trabajar, actualizarla y crear una rama de trabajo para Cypress.
- Módulo asignado: M06 — Notificaciones. Las notificaciones del proyecto son por correo electrónico.
- Frontend existente: Next.js y React. No construir otro frontend. Los flujos obligatorios ya están en `/admin/templates` y en el editor `/admin/templates/[id]`.
- El informe del TP6 ya contiene carátula, repositorio, Tarea A y reflexiones; la sección B está pendiente. La Tarea C y las lecciones aprendidas se completan por separado.

## Consigna de la Tarea B

Cada integrante debe desarrollar al menos **un test E2E con Cypress**. Para el equipo de seis integrantes, se necesitan al menos seis tests. Cada test debe recorrer un flujo completo desde la interfaz y verificar el estado final. Se permiten variantes del mismo flujo, pero no seis copias del mismo escenario.

En el código de **cada test** deben figurar los comentarios `Arrange`, `Act` y `Assert`. Configurar `baseUrl` una sola vez y visitar rutas relativas. Usar los atributos `data-cy` disponibles para los controles y mensajes. Ejecutar con `npx cypress run` o `npx cypress open` y reunir capturas o videos. Si falla algún test, conservar el mensaje completo y explicar causa y decisión tomada. El informe debe incluir el código de cada test, evidencia y análisis de resultados. La presentación requiere ejecutar en vivo dos tests: uno exitoso y otro de error o borde.

## Seis escenarios aprobados por el grupo

1. Abrir una plantilla desde la grilla, editarla, guardar y verificar confirmación y valores persistidos.
2. Abrir una plantilla, dejar el asunto vacío, intentar guardar y verificar el error visible sin persistir cambios.
3. Abrir una plantilla, dejar el cuerpo HTML vacío, intentar guardar y verificar el error visible sin persistir cambios.
4. Abrir una plantilla, ingresar destinatario, simular el envío de prueba y verificar la respuesta final visible. No enviar correos reales.
5. Abrir una plantilla, intentar el envío sin destinatario y verificar el error visible.
6. Abrir una plantilla, insertar una variable dinámica, guardar y verificar el contenido resultante visible y persistido.

Cada escenario debe empezar en la interfaz y terminar con una aserción sobre el resultado. Usar datos de prueba independientes; restaurar cualquier plantilla modificada para que los tests no dependan del orden ni alteren el repositorio. Si hace falta simular respuestas externas, explicar el alcance de esa simulación y mantener verificable el flujo de la interfaz.

## Pistas del código existente

- La grilla usa `data-cy` como `templates-table` y `edit-template-${id}`.
- El editor usa `subject-input`, `html-textarea`, `save-template-btn`, `subject-error`, `html-error`, `save-success-msg`, `test-email-input`, `send-test-btn`, `test-error-msg`, `test-success-msg` e `insert-var-${nombre}`.
- La API de envío de prueba simula en consola cuando no está configurada `RESEND_API_KEY`. Verificar la respuesta observable sin atribuir un envío real a ese modo.
- En la revisión del 3 de octubre de 2026, `main` tenía 30 tests de Vitest y no incluía Cypress. Comprobar el estado actual antes de editar.

## Entrega esperada de la implementación

1. Configuración de Cypress, dependencia y scripts de ejecución en el repositorio.
2. Seis tests E2E distintos con comentarios `Arrange`, `Act` y `Assert`.
3. Instrucciones breves para levantar la aplicación y ejecutar Cypress.
4. Resultado real de cada test y ubicación de capturas o videos para el informe.
5. Resultado de los tests de Vitest existentes y explicación de cualquier fallo.

No asignar autorías ficticias: el equipo debe identificar qué test desarrolló y revisó cada integrante antes de completar esa parte del informe.
