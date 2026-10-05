# TP5 - Revision M06 Gestion de Notificaciones

Revisado en modo solo lectura. No se modificaron archivos de codigo ni se hicieron commits.

Se encontraron 15 tests en total: 14 relacionados con M06 y 1 ejemplo ajeno (`app/__tests__/example.test.tsx`).

## Estado general

- **Implementado:** ABM parcial de edicion de plantillas existentes por JSON, listado admin, editor HTML, preview en iframe, envio de correo de prueba por Resend o simulacion por consola.
- **Simulado/mockeado:** variables de plantilla (`nombre`, `fecha`, `hora`, `enlace`), Resend en tests, `fetch` de componentes, base JSON en tests unitarios.
- **No implementado:** preferencias del administrador, disparo automatico por confirmacion/cancelacion/recordatorio 24h, scheduler/cron, integracion con reservas reales, validacion de emails real, medicion del requisito <60s.

## Matriz de cobertura M06

| requisito M06 | archivos de implementacion | tests existentes | cobertura actual | faltantes |
|---|---|---|---|---|
| M06-F01: admin configura/edita plantillas de correo para usuario invitado | `app/api/notifications/templates/route.ts`, `app/admin/templates/page.tsx`, `app/admin/templates/[id]/page.tsx`, `data/templates.json` | `route.test.ts`: GET lista plantillas, POST guarda, POST falla sin asunto/html. `grid.test.tsx`: muestra grilla. `editor.test.tsx`: carga campos, valida asunto. `notifications.test.ts`: flujo listar-editar-enviar prueba. | Parcial positiva y negativa. Permite listar y actualizar plantillas existentes. Destinatario "Usuario Invitado" esta hardcodeado en UI. | No hay creacion/eliminacion, auth/rol admin, validacion de `id` faltante, test de plantilla inexistente 404, persistencia real end-to-end robusta, control especifico de "solo usuario invitado". |
| M06-F02: admin configura preferencias de notificaciones | No se encontro implementacion | No hay tests | Sin cobertura | Falta modelo/API/UI de preferencias, persistencia, validaciones y efecto sobre envios. |
| M06-F03: sistema envia correos automaticos ante confirmacion, cancelacion y recordatorio 24h | `app/api/notifications/send-test/route.ts`, plantillas `cancellation` y `confirmation` en `data/templates.json` | `send-test/route.test.ts`: envia via Resend mock, simula por consola sin API key, falla sin `to`, falla sin `templateId`. `notifications.test.ts`: envio de prueba tras edicion. | Solo envio manual/de prueba. Hay templates para confirmacion y cancelacion, pero no disparadores automaticos. | Falta integracion con eventos reales de reserva, cancelacion y recordatorio 24h; falta template `reminder-24h`; falta cola/scheduler; falta verificar que solo se use email; falta manejo de usuario invitado real. |
| M06-F04: admin edita HTML y previsualiza correo | `app/admin/templates/[id]/page.tsx` | `editor.test.tsx`: carga HTML, inserta variable, valida asunto, dispara envio de prueba. | Parcial. Existe textarea HTML y preview en vivo con datos mock. | No hay test directo de iframe/preview renderizado, preheader interpolado, HTML vacio negativo, reset a default, error de API al guardar/enviar. |
| M06-NF01: generacion del correo <60s | Interpolacion simple en `app/api/notifications/send-test/route.ts` y `app/admin/templates/[id]/page.tsx` | No hay tests de performance | Sin cobertura formal | Falta test cronometrado de generacion/interpolacion y posiblemente envio excluido o mockeado para medir solo generacion. |

## Tests existentes M06

### `app/api/notifications/templates/__tests__/route.test.ts`

- Positivo M06-F01: `GET` devuelve 3 plantillas desde DB mock.
- Positivo M06-F01: `POST` actualiza una plantilla.
- Negativo M06-F01: falla si falta `subject`.
- Negativo M06-F01/F04: falla si falta `html`.

### `app/api/notifications/send-test/__tests__/route.test.ts`

- Positivo M06-F03 simulado: interpola variables y llama a Resend mock.
- Positivo/simulacion M06-F03: sin `RESEND_API_KEY`, no envia real y loguea por consola.
- Negativo M06-F03: falla si falta destinatario `to`.
- Negativo M06-F03: falla si falta `templateId`.

### `app/admin/templates/__tests__/grid.test.tsx`

- Positivo M06-F01: la grilla carga templates por `fetch`, muestra destinatario "Usuario Invitado", estados y links de edicion.

### `app/admin/templates/[id]/__tests__/editor.test.tsx`

- Positivo M06-F01/F04: carga datos de la plantilla en asunto, preheader y HTML.
- Positivo M06-F04: inserta variable helper en el HTML.
- Negativo M06-F01/F04: valida asunto requerido antes de guardar.
- Positivo M06-F03 simulado/F04: boton de prueba llama `/api/notifications/send-test`.

### `app/api/notifications/__tests__/notifications.test.ts`

- Positivo integracion M06-F01 + M06-F03 simulado: lista plantillas, edita una y envia correo de prueba con variables interpoladas. Usa Resend mock y toca `data/templates.json`, restaurandolo al final.

## Casos TP5 iniciales propuestos

| integrante/caso | positivo | negativo |
|---|---|---|
| Caso 1 - Plantillas API | Listar plantillas y verificar `new-booking`, `confirmation`, `cancellation`. | Intentar actualizar plantilla con `subject` vacio y esperar 400. |
| Caso 2 - Edicion API | Actualizar `subject`, `html`, `status`, `lastModifiedBy` y verificar respuesta. | Actualizar `id` inexistente y esperar 404 `Plantilla no encontrada`. |
| Caso 3 - Grilla admin | Renderizar grilla y verificar destinatario "Usuario Invitado", estado y link Editar. | Mockear fallo de `fetch` y verificar mensaje de error. |
| Caso 4 - Editor HTML | Cargar plantilla y verificar textarea HTML + preview interpolado. | Vaciar HTML y verificar validacion antes de guardar. |
| Caso 5 - Envio de prueba | Con `RESEND_API_KEY`, verificar llamada a Resend mock con variables reemplazadas. | Sin `to`, esperar 400 y que Resend no sea llamado. |
| Caso 6 - Simulacion sin API key | Sin `RESEND_API_KEY`, verificar respuesta `{ simulated: true }` y `console.log`. | Sin `templateId`, esperar 400. |
| Caso 7 - Eventos automaticos | Definir test pendiente/documentado para confirmacion/cancelacion disparando email desde evento de reserva. | Evento cancelado sin email de invitado no deberia enviar. Actualmente no implementable sin agregar codigo. |
| Caso 8 - NF01 performance | Medir generacion/interpolacion de email con template real y exigir <60s. | Template extremadamente grande o invalido no deberia superar tiempo ni romper sin respuesta controlada. Actualmente falta test. |

## Conclusion

M06-F01 y M06-F04 estan parcialmente implementados y testeados. M06-F03 existe solo como envio manual/de prueba, no automatico. M06-F02 y M06-NF01 no tienen implementacion ni cobertura real.
