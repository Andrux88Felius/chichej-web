# Fase 7A — Reservas del cliente

## Alcance y análisis del original

Se analizaron `usuario/reservas.php` y su vista activa `includes/views/user-reservations-ux.php`, `api/user/reservations/create.php`, `api/user/reservations/cancel.php`, `services/ReservationService.php`, `includes/reservations.php`, la lectura de `includes/firebase-data.php` / `services/FirebaseReadService.php`, `assets/js/reservations.js` y los estilos de reservas en `assets/css/styles.css`. Se distinguieron las vistas antiguas de la vista activa. Los originales permanecen intactos.

El origen definido por el PHP es **Firestore, colección reservas**, con `usuarioId` como propietario. Los perfiles siguen en RTDB `usuarios/{uid}`. El PHP usa credenciales de servidor; esas credenciales no se trasladan al cliente Web. El esquema está confirmado en el código original, no mediante una descarga de reservas reales. No se consultaron reservas ajenas ni se crearon reservas remotas para esta migración; el contraste con documentos reales y reglas vigentes queda para Eduardo con su cuenta.

## Esquema conservado

| Campo | Origen / validación |
| --- | --- |
| reservaId | `res_` + 12 bytes criptográficos en hexadecimal (24 caracteres), usado también como ID del documento. Generado internamente. |
| usuarioId | Identidad actual del SDK Auth; nunca formulario, URL ni almacenamiento manual. |
| nombreCliente, correoCliente | Perfil validado de la sesión actual, con correo de Auth prioritario. |
| detalle | Obligatorio; trim; 3–300 caracteres. |
| fechaSolicitada | Fecha real desde hoy hasta dos años, en America/La_Paz; Timestamp a las 12:00 de Bolivia (16:00 UTC), como el PHP. |
| cantidadSolicitada | Entero de 1 a 10000. |
| telefono | Obligatorio; 7–30 caracteres de números, +, puntos, paréntesis, espacios o guiones; 7–15 dígitos. Precarga desde Perfil cuando existe. |
| lugarEvento | Obligatorio; trim; 3–160 caracteres. |
| direccion | Opcional; trim; máximo 220 caracteres. |
| referenciasLugar | Opcional; trim; máximo 300 caracteres. |
| observaciones | Opcional; trim; máximo 600 caracteres. |
| estado | Siempre `pendiente` al crear; no existe control para elegirlo. |
| fechaCreacion, fechaActualizacion | Timestamp de servidor Firestore. Se conserva el tipo y nombre históricos; se sustituye el reloj del servidor PHP por serverTimestamp del SDK. |

No se cambia el perfil por escribir otro teléfono en el formulario. No se añaden colecciones, campos de administración ni datos duplicados para Web. Las fechas se muestran en es-BO/America/La_Paz. La suma de dos años conserva el comportamiento de normalización del 29 de febrero del PHP. La lectura admite el alias histórico `cantidad` como fallback y los estados aceptado/aprobada/aprobado, rechazado y cancelado solo para presentación; no reescribe documentos históricos.

## Implementación y navegación

Nueva ruta `public/usuario/reservas.html`, con el mismo `protectAccount` que Mi Cuenta/Perfil. Sin sesión redirige a Login; sesión inválida o bloqueada limpia la interfaz según el guard existente. Se habilita la tarjeta Reservas de Mi Cuenta y el acceso entre Mi Cuenta, Perfil y Reservas, además de los enlaces autenticados de esas páginas. Pedidos y Promociones permanecen deshabilitados.

El formulario ofrece los ocho campos reales y «Descartar formulario», que restablece valores sin escribir. El listado muestra fecha, destino, estado e ID; «Ver detalle» expande cantidad, teléfono, dirección, referencias, observaciones y fechas. Los estados se muestran con etiquetas de texto. Cargando, sin reservas, creando, cancelando y error tienen mensajes accesibles sin stack traces. «Actualizar listado» permite reintentar también una inicialización fallida.

Cada operación obtiene la identidad desde Auth y valida otra vez el perfil propio, incluyendo bloqueo histórico (ausente = false). La instancia se vincula a esa identidad y rechaza un cambio de cuenta antes o después de operaciones asíncronas. Las respuestas de una sesión anterior se descartan y salir de la página elimina datos y borradores. Los permisos de rol cliente/admin/admin_principal conservan el guard existente; incluso un administrador solo obtiene su propio listado y las mismas acciones cliente.

## Creación, listado y detalle

La creación construye el payload internamente, ignora UID/estado/campos extra del formulario y utiliza una transacción que comprueba que el nuevo ID no existe antes de escribir. Doble envío bloqueado tanto en la interfaz como en el controlador. Tras éxito se limpia el formulario, se confirma y se refresca el listado; si solo falla el refresco se informa que la creación se confirmó.

Si la respuesta de creación es incierta, se retienen ID y payload en memoria. Un reintento con los mismos datos reutiliza ese ID y reconoce el documento ya creado por el mismo usuario sin sobrescribirlo. Se rechazan datos distintos mientras exista esa creación sin confirmar. Tras recargar se pierde esa memoria; por eso se indica revisar el listado antes de volver a crear. No se introduce almacenamiento local de datos personales. No se garantiza deduplicación entre distintas pestañas o recargas.

La consulta usa `getDocsFromServer(query(collection(db, 'reservas'), where('usuarioId', '==', auth.currentUser.uid)))`. La restricción está en la consulta remota, no en un filtro de toda la colección descargada. Como defensa adicional se rechaza una respuesta con propietarios distintos. Se ordena localmente por fechaCreacion (fallback fechaSolicitada), más recientes primero. No se añade orderBy compuesto ni índices nuevos; si el índice simple fue deshabilitado habrá que revisar el error sin cambiarlo automáticamente.

El detalle usa únicamente documentos de ese resultado propio, en un details nativo. No acepta ID ni UID desde URL. Las acciones de cancelación solo admiten IDs presentes en el listado propio previamente obtenido.

## Cancelación e historial

Regla PHP confirmada: **solo pendiente → cancelada** en vista cliente. Aceptada, rechazada, cancelada y estados desconocidos no ofrecen cancelación. Incluso admin_principal usa esa misma regla aquí; las acciones administrativas no se implementan en 7A.

Antes de ejecutar se abre un diálogo con descripción de la reserva y botones «Volver sin cancelar» / «Sí, cancelar reserva». El foco inicial queda en volver, Escape cierra sin escribir y el foco vuelve al botón original. Mientras se procesa se bloquean nuevas acciones.

La transacción relee el documento, comprueba `usuarioId` y estado pendiente, y actualiza únicamente `estado: cancelada` y `fechaActualizacion`. Nunca elimina el documento ni acepta/rechaza solicitudes. Una modificación concurrente obliga al SDK a reevaluar la transacción; si dejó de estar pendiente se rechaza la cancelación. Referencia técnica: [transacciones Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions). La consulta de propietario sigue las [consultas simples oficiales](https://firebase.google.com/docs/firestore/query-data/queries).

## Reglas y límites

No se leyeron credenciales administrativas, no se cambiaron reglas y no hubo deploy. Las reglas reales de Firestore y permisos de este flujo quedan pendientes de la prueba manual. No se puede deducir que una operación permitida al PHP con cuenta de servicio también esté permitida al SDK Web.

Las reglas deben permitir únicamente consultas de reservas propias y documentos cuyo usuarioId coincida con request.auth.uid; validar todos los campos y estado inicial de creación; y restringir la actualización a pendiente → cancelada con conservación de propietario, ID y demás campos. La comprobación de documento inexistente en la transacción de creación también requiere una lectura autorizada para ese caso; no se debe abrir la lectura de documentos existentes ajenos para resolverla. No usar permisos públicos globales.

El bloqueo se lee en RTDB antes de operar. Firestore Rules no puede consultar directamente RTDB para garantizar ese bloqueo de forma atómica; una restricción de servidor equivalente necesitaría un mecanismo autorizado y coherente con la arquitectura, como identidad/claims mantenidos por un backend confiable. No se crea dicho mecanismo ni se duplican perfiles en esta fase. Existe un intervalo entre lectura del perfil y commit en el que el bloqueo podría cambiar. La seguridad definitiva no debe depender solo de JavaScript. Las reglas deben volver a comprobar propiedad/estado del documento aun cuando estaba en un listado propio anterior. Una operación ya emitida no se revoca simplemente cerrando la sesión.

En pruebas simuladas se provocó permission-denied al listar: usuario autenticado, ruta Firestore reservas, consulta por usuarioId; se mostró el mensaje sin alterar reglas ni escribir. No hay un permission-denied remoto confirmado. Si Eduardo encuentra uno, registrar operación (listar, lectura transaccional de ID nuevo, crear o cancelar), ruta `reservas/{id}`, sesión presente/ausente y código de error sin credenciales; preparar una propuesta específica para aprobación, sin ampliar reglas automáticamente.

## Archivos

Creados: `public/usuario/reservas.html`, `public/assets/js/reservations-data.js`, `reservations-store.js`, `reservations-firebase.js`, `reservations-view.js`, `reservations-ui.js` (estos cuatro también bajo public/assets/js), `scripts/check-reservations.mjs` y este informe.

Modificados: `public/usuario/index.html`, `public/usuario/perfil.html`, `public/assets/css/pilot.css`, `scripts/check-static.mjs`, `scripts/check-auth.mjs`, `scripts/check-account.mjs` y README. Los checks permiten exclusivamente la nueva ruta y el adaptador transaccional de Reservas; conservan las restricciones sobre los demás módulos.

## Verificación

Siete checks correctos, con el servidor estático local activo:

- `node scripts/check-static.mjs`: 9 páginas, 85 recursos HTTP 200, anclas válidas y rutas privadas bloqueadas.
- `node scripts/check-auth.mjs`.
- `node scripts/check-products.mjs`.
- `node scripts/check-register.mjs`.
- `node scripts/check-account.mjs`.
- `node scripts/check-profile-edit.mjs`.
- `node scripts/check-reservations.mjs`: validaciones, inyección de UID/estado, payload de 15 campos, doble envío, respuesta incierta/reintento idempotente, bloqueo, cambio de identidad, administrador propio, exclusión de terceros, propiedad/estado antes de cancelar, actualización parcial sin eliminar y restricciones estáticas.

Navegador con HTML y módulos reales, pero adaptadores solo en memoria: creación propia pendiente, detalle con los ocho campos, confirmación cerrada sin escribir, cancelación con conservación del historial, descarte del formulario, admin_principal sin reservas ajenas, permission-denied y logout con ocultación de datos. No se usaron cuentas ni reservas reales. Los archivos temporales de pruebas se retiraron.

Se probaron 360, 390, 430, 768, 1024 y 1280 px con formulario, lista, detalle abierto y diálogo. Sin scroll horizontal; inspección visual móvil del diálogo; labels, textarea, foco, controles nativos y mensajes accesibles. Teclado físico móvil pendiente. Console: sin errores/avisos en la prueba simulada. Network local: recursos correctos por check-static; no se envió ninguna escritura Firebase desde el arnés. La ruta real sin sesión redirigió a Login; no se hicieron consultas globales de reservas.

## Qué debe verificar Eduardo

1. Iniciar sesión como cliente y abrir Mi Cuenta → Reservas.
2. Crear UNA reserva de prueba y confirmar en Firestore reservas que existe, con usuarioId propio y estado pendiente. Revisar teléfono, dirección, referencias, observaciones y demás datos ingresados.
3. Pulsar F5, comprobar persistencia y abrir Ver detalle; no deben aparecer reservas de terceros.
4. Cancelar si está pendiente, confirmar el estado cancelada en Firebase y que el documento sigue existiendo. Aceptadas/rechazadas/canceladas no deben ofrecer cancelación cliente.
5. Probar Volver sin cancelar y Descartar formulario: ninguna escritura.
6. Abrir con admin_principal: solo solicitudes del mismo UID, sin acceso global ni acciones administrativas.
7. Ejecutar los siete checks, comprobar el commit `feat: migrate client reservations` en origin/main de Andrux88Felius/chichej-web y Git limpio.
8. Confirmar cero cambios de reglas, deploy o proyectos protegidos. Verificar el uso compartido del modelo con la administración/Flutter sin modificar esas aplicaciones.

Solo se trabajó en chichej-web. servidor-linux, CHICHEJ/app, CHICHEJ/esp32 y CHICHEJ/firebase no se modificaron; tampoco los PHP originales. Sin QR, pedidos, promociones, contacto, dispensar, reportes, PDF, SMTP ni panel admin.

Siguiente paso: validación manual de permisos, creación, persistencia y cancelación propias. Después podrá planificarse Fase 7B, sin activarla en este cierre.
