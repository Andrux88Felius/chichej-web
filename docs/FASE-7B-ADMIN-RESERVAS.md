# Fase 7B — Administración de reservas

## Original y alcance

Se revisaron `admin/reservas.php`, `includes/views/admin-reservations-ux.php`, `api/admin/reservations/update-status.php`, `services/ReservationService.php`, `services/AdminAuthorizationService.php`, `includes/auth.php`, `includes/reservations.php`, `includes/admin-nav.php`, la lista admin_roles de `config/firebase.php`, filtros de `assets/js/admin.js`, acciones de `assets/js/reservations.js` y estilos de reservas ya analizados en 7A. No se modificaron los originales.

Roles administrativos encontrados: **admin y admin_principal**, declarados tanto en auth.php como en config/firebase.php y utilizados por la autorización del servidor. No se inventan otros roles.

El original consulta Firestore `reservas`, ordena por fechaCreacion (fallback fechaSolicitada), muestra datos del cliente contenidos en cada reserva y permite búsqueda/filtros locales. Aceptar y rechazar requieren pendiente; actualizan estado y fechaActualizacion. No existe motivoRechazo en esa operación. El original también ofrece cancelación administrativa y escribe auditoria_admin; esas dos capacidades no se trasladan porque el alcance autorizado de 7B limita las escrituras a aceptar/rechazar reservas. Se conserva el historial documental de reservas, pero no se reproduce el registro de eventos separado de auditoría. No se migra el dashboard ni otros módulos.

## Página y acceso

Nueva ruta `public/admin/reservas.html`. `admin-guard.js` reutiliza la sesión validada y el guard privado, pero exige rol admin/admin_principal. Cliente se redirige a Mi Cuenta sin mostrar datos; sin sesión se redirige a Login. El perfil propio de RTDB se valida mediante profileForUser y requireAdminProfile: bloqueo ausente conserva false; bloqueo activo o perfil inválido impide acceso según la lógica existente.

El enlace Administración aparece solo con sesión y rol administrativo en la navegación. Ocultarlo no constituye la autorización: el módulo de datos vuelve a leer el perfil antes de cualquier lectura global o transición. La vista cliente de 7A conserva su consulta por usuarioId y sus acciones propias, sin Aceptar/Rechazar.

## Datos, búsquedas y detalle

Solo el adaptador administrativo consulta globalmente Firestore `reservas`, mediante getDocsFromServer. Se verifica rol antes y después de la lectura para descartar resultados si el acceso cambió. La instancia se vincula al objeto de identidad Auth y rechaza cambios de cuenta. No hay UID ni rol obtenido de URL, formulario o almacenamiento manual.

Se usan nombreCliente, correoCliente (fallback email), usuarioId, telefono, direccion, lugarEvento, referenciasLugar y observaciones contenidos en la reserva. No se leen perfiles de otros clientes. El detalle también muestra cantidadSolicitada (fallback cantidad), fechaSolicitada, fechaCreacion y fechaActualizacion. Los textos se insertan con textContent.

Búsqueda local por nombre, correo, UID, teléfono, dirección, lugar, ID, detalle y referencias/observaciones; no realiza consultas en cada tecla. Normaliza mayúsculas y acentos. Filtros Todas, Pendientes, Aceptadas, Rechazadas y Canceladas, con conteo visible. Orden descendente por creación, como PHP; sin índice compuesto nuevo. Se conservan estados históricos y su normalización de presentación de 7A.

## Transiciones y concurrencia

Únicamente pendiente → aceptada y pendiente → rechazada, mediante acciones cerradas aceptar/rechazar; no se acepta un estado arbitrario ni payload externo. Los IDs deben proceder del listado administrativo cargado. Reservas aceptadas, rechazadas, canceladas y estados desconocidos siguen visibles sin acciones.

Antes de cada acción se relee el perfil administrativo. Dentro de cada ejecución/reintento de la transacción se vuelve a validar el acceso, se lee el documento y se exige estado pendiente. Solo se actualizan estado y fechaActualizacion (serverTimestamp). Si el cliente canceló entre la lectura y el commit, Firestore reintenta y el nuevo estado impide aceptar/rechazar. Nunca se elimina un documento ni se cambia propietario o datos personales.

La confirmación identifica cliente, reserva y fecha; foco inicial en Volver sin cambios. Escape permite salir sin escritura antes de procesar. Mientras se procesa se bloquean controles y existe un segundo bloqueo en el módulo de datos. Al finalizar se actualiza la lista y se anuncia resultado. Si falla, se muestra un mensaje sin stack trace y se relee el estado. Una respuesta incierta requiere revisar el listado antes de reintentar; no se fuerza una transición terminal.

## Reglas, permisos y límites

No se consultaron ni cambiaron reglas remotas ni se utilizaron credenciales administrativas. Los permisos reales de lectura global y actualización administrativa quedan para la primera prueba manual de Eduardo. La validación real de 7A no acredita por sí sola permisos de 7B.

Firebase Rules debe ser la protección definitiva: permitir lectura global solo a administradores autorizados, validar pendiente → aceptada/rechazada y restringir el cambio a estado/fechaActualizacion, conservando todos los demás campos. La lista de roles frontend no sustituye esa protección.

Los roles y bloqueo existentes residen en RTDB; Firestore Rules no puede consultar RTDB directamente. El control definitivo requiere un mecanismo de servidor autorizado y coherente (por ejemplo claims confiables), que no se introduce en esta fase. La comprobación de perfil y el commit Firestore no son atómicos entre ambas bases: el rol/bloqueo podría cambiar en ese intervalo. Una operación ya emitida no se revoca por cerrar sesión. Se revalida en cada operación/reintento; no hay suscripción permanente a cambios del perfil. La interfaz limpia datos al cambiar sesión, salir de la página o restaurarse desde historial.

Permission-denied se simuló al listar: Auth presente, rol admin_principal, lectura global de reservas; se mostró el error y se retiraron las filas visibles sin cambiar reglas. No se confirmó un rechazo remoto. Si ocurre en la prueba real, registrar operación (listar o transición transaccional), ruta reservas o reservas/{id}, Auth presente/ausente, rol y código; no registrar tokens/contraseñas ni ampliar reglas automáticamente.

## Validación

Ocho checks correctos con servidor estático activo:

- `node scripts/check-static.mjs`: 10 páginas, 91 recursos HTTP correctos, anclas y rutas privadas.
- `node scripts/check-auth.mjs`.
- `node scripts/check-products.mjs`.
- `node scripts/check-register.mjs`.
- `node scripts/check-account.mjs`.
- `node scripts/check-profile-edit.mjs`.
- `node scripts/check-reservations.mjs`.
- `node scripts/check-admin-reservations.mjs`: roles, denegación cliente/bloqueo antes de consulta global, filtros, transiciones cerradas, conservación de datos, doble envío, estados terminales, revocación de rol/identidad y reintento concurrente que detecta cancelación.

Navegador con HTML y lógica reales y adaptadores solo en memoria: búsqueda, filtro canceladas sin acciones, aceptación y rechazo en dos reservas simuladas (solo estado/fechaActualizacion), confirmación cerrada sin escribir, permission-denied, cliente redirigido y enlace administrativo oculto. Sin errores/avisos de consola. Los archivos temporales se eliminaron antes del commit. No se realizaron escrituras reales. Ruta real anónima: redirección a Login.

Responsive probado a 360, 390, 430, 768, 1024 y 1280 px, con detalle y confirmación abiertos: sin scroll horizontal. Inspección visual móvil de cards y detalle; labels de búsqueda/estado, botones, foco, details/dialog nativos y anuncios accesibles. La comprobación en un dispositivo físico queda pendiente.

## Archivos y compatibilidad

Nuevos: página admin/reservas.html; módulos admin-guard y admin-reservations-{store,firebase,view,ui} bajo public/assets/js; check-admin-reservations.mjs y este informe. Modificados: auth-view.js para visibilidad del enlace, navegación HTML, pilot.css, check-auth/check-static y README. Los módulos de datos de 7A, perfil, registro, recuperación y productos permanecen intactos.

Eduardo confirmó previamente interoperabilidad real de 7A: Web creó y canceló, Firestore conservó el documento y Flutter admin mostró cancelada. 7B conserva la misma colección, campos y strings aceptada/rechazada; Eduardo debe confirmar el mismo estado en Flutter después de la primera transición Web. No se modificó Flutter ni se duplicaron datos.

## Qué debe verificar Eduardo

1. Crear una reserva nueva con cliente y confirmar pendiente.
2. Iniciar sesión como admin_principal y abrir Administración → Reservas; confirmar el listado global, buscar esa reserva y abrir detalle.
3. Aceptarla O rechazarla, comprobar el nuevo estado en Firestore y luego en Flutter admin.
4. Confirmar que canceladas no muestran Aceptar/Rechazar; probar búsqueda y los cinco filtros.
5. Abrir admin/reservas.html como cliente: debe denegar acceso y volver a Mi Cuenta. Probar Volver sin cambios en confirmación.
6. Ejecutar los ocho checks; confirmar commit `feat: add admin reservation management`, push a main de Andrux88Felius/chichej-web y Git limpio.
7. Confirmar cero cambios de reglas y proyectos protegidos.

Se trabajó únicamente en chichej-web. servidor-linux, CHICHEJ/app, CHICHEJ/esp32 y CHICHEJ/firebase permanecen intactos, al igual que los PHP originales. Sin deploy, QR ni migración de otros módulos.

Siguiente paso: validación manual de permisos y aceptación/rechazo con Firestore y Flutter antes de planificar otra fase.
