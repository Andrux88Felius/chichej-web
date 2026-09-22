# Cierre de preparación portable CHICHEJ

## Estado y alcance

Repositorio Andrux88Felius/chichej-web, rama main. Se trabajó únicamente en esta copia. PHP original, servidor-linux, Flutter, ESP32 y proyecto Firebase protegido no fueron modificados. No hubo operaciones remotas de escritura durante esta intervención, cambios de reglas ni deploy. La dispensación física todavía no está habilitada en la web.

## Módulos disponibles

- Públicos: Inicio, Nosotros, Productos, Promociones, Información, Login, Registro y recuperación (dentro de Login).
- Contacto: formulario con campos del original y enlace al WhatsApp oficial con texto preparado. El usuario confirma el envío en WhatsApp. No se afirma entrega, no se envía SMTP ni se crea una bandeja Firebase.
- Dispensar: selector de presentaciones reales del catálogo existente; último estado de máquina con sesión; enlace a pedidos propios. No crea pedidos ni concede muestras.
- Cliente: Mi Cuenta, Perfil, edición, avatares, reservas y consulta de pedidos propios.
- Administración: reservas existentes, consulta de máquina y pedidos globales con búsqueda, filtro y detalle. Roles permitidos admin y admin_principal.
- Navegación común: todos los módulos habilitados apuntan a HTML existente; identidad y logout conservados. Mi Cuenta exige sesión. Administración y sus enlaces internos exigen rol administrativo.

## Arquitectura y Firebase

Navegador HTML/CSS/JS → Firebase Web SDK existente → Authentication, Firestore y RTDB, proyecto chichej-2026. La configuración del navegador es la pública oficial suministrada; no se añadieron credenciales de servidor ni measurementId.

Authentication y el perfil propio RTDB validan identidad, rol y bloqueo. Bloqueado ausente sigue equivaliendo a false. No se modificaron cuentas, roles ni perfiles reales durante las pruebas.

Firestore mantiene productos, mensajes, reservas y pedidos. Productos conserva el normalizador anterior: activo, agotado, esGratis, precio, cantidadMl y opcion. En la consulta real de Dispensar aparecieron seis presentaciones activas disponibles y se verificó Chicha 250ml, 250 ml, Bs 5,00. No se modificó el catálogo.

Promociones mantiene la lógica anterior: mensajes activos; público solo tipo promocion y avisos para autenticados. La validación previa aportada por Eduardo fue dos promociones inactivas y un informativo activo. No se inventaron imágenes, beneficios ni vencimientos.

RTDB dispensador/principal aporta estado, bomba, agitador, nivelliquido, distanciaCm y productoactual según el PHP revisado. Se muestran valores registrados, sin afirmar conectividad actual. El esquema disponible no confirma heartbeat, timestamp fiable ni pedido actual correlacionado.

## Flutter, ESP32 y reservas

La interoperabilidad Web ↔ Firestore ↔ Flutter de reservas fue validada por Eduardo antes de esta intervención. Se preservaron los módulos de creación, cancelación y aceptación/rechazo; esta fase solo cambió su navegación y presentación administrativa.

Las nuevas consultas no alteran documentos ni actuadores. El PHP dispensar.php es una demostración sin protocolo de órdenes. No se examinó ni cambió firmware fuera del repositorio permitido. Por ello no se presenta como validada la comunicación de órdenes Web → Firebase → ESP32.

## Pedidos y recuperación

Cliente consulta Firestore pedidos con usuarioId == UID autenticado; nunca descarga todo para filtrar después. Admin consulta el listado global tras validar su rol. Se conservan registros físicos sin UID y campos históricos: pedidoId/ID, usuarioId, nombreUsuario, tipoUsuario, origenPedido, origen, items, total, estado, estadoPago, metodoPago, fechaCreacion y procesado. Las vistas muestran los campos existentes sin persistir normalizaciones.

La búsqueda incluye productos de items y el detalle conserva su cantidad, mililitros y precio. No se exige UID a registros físicos. No se cambian estados de pedidos desde estas páginas.

Recuperación manual/automática bloqueada: faltan correlación pedido-actuador, acuse de finalización y prueba fiable de inactividad. No se inventó un umbral temporal. No hay eliminación, marcado ficticio como entregado ni retorno a pendiente. No se habilitó un botón de recuperación inseguro. Para avanzar se necesita revisar y confirmar el protocolo real y sus garantías atómicas con la máquina detenida.

## Contacto y pendientes

Se reutiliza WhatsApp, ya presente en el PHP, como alternativa segura. El formulario conserva nombre, organización, correo, motivo y mensaje; valida campos y longitudes, permite precarga de nombre/correo y no actualiza el perfil. Preparar repetidamente el enlace no transmite mensajes. El texto permanece mientras la página siga abierta; no se guarda en almacenamiento persistente del equipo. No hay confirmación automática de recepción.

Correo automático y bandeja administrativa quedan pendientes: no hay infraestructura de Functions/SMTP portable ni almacenamiento con permisos confirmados. No se crearon colecciones desprotegidas. El acceso y envío final en WhatsApp dependen del usuario y de ese servicio.

No se migró la edición administrativa de usuarios, productos o promociones ni herramientas secundarias (PDF, reportes, SMTP). Las reglas absolutas de esta intervención prohíben modificar usuarios y roles existentes. Las operaciones de dispensación y recuperación requieren una fase posterior con protocolo confirmado.

## Seguridad y límites

Los nuevos módulos Firebase solo leen. Guards ocultan datos mientras se valida sesión y descartan respuestas tardías tras logout; pruebas locales comprueban ambos roles administrativos, cliente denegado, aislamiento por UID, registros físicos y permission-denied. Ninguna prueba creó cuentas, reservas, pedidos o movimientos físicos.

La seguridad de datos sigue dependiendo de las reglas desplegadas: la interfaz no reemplaza autorización del servidor. No se probaron las nuevas lecturas con credenciales administrativas reales ni se cambiaron reglas para permitirlas. Eduardo debe comprobar esos permisos. No se observó permission-denied en las consultas públicas realizadas; el caso denegado de monitoreo se probó con dobles locales.

Revisión de archivos públicos y candidatos Git: sin claves privadas, service accounts, contraseñas SMTP, .env reales ni temporales/logs añadidos. Se retiraron todos los archivos de simulación antes del commit. Los archivos PHP originales no forman parte de public ni del despliegue.

## Responsive y comprobaciones

Anchos comprobados: 360, 390, 430, 768, 1024, 1280, 1366, 1440 y 1920 px. Páginas públicas con datos reales disponibles; vistas privadas con sesión/datos simulados locales. Sin scroll horizontal detectado. Se revisaron nombres largos, navbar, menú móvil, formulario de perfil/avatar y modal de reservas. Nombre completo disponible mediante title y perfil; no se recortaron valores almacenados. El control de música fue retirado de las tres páginas administrativas y conservado en públicas.

La comprobación responsive de vistas privadas no equivale a una prueba de permisos de producción. No hubo errores de consola observados durante las sesiones revisadas. Check estático: 16 páginas, 104 recursos HTTP 200 y rutas de servidor sensibles no expuestas.

Ejecutar el servidor local en una terminal y los checks en otra:

```powershell
node scripts/serve-static.mjs
node scripts/check-all.mjs
```

Resultado final: **12/12 checks aprobados**. El agregador ejecuta los nueve checks previos, navegación final, monitoreo y configuración Hosting. Los casos de escritura existentes se verifican con dobles locales, sin ejecutarlos en Firebase real.

## Hosting, publicación y rollback

firebase.json ya apunta exclusivamente a public y excluye archivos ocultos, dependencias y PHP. .firebaserc fija chichej-2026. El check de Hosting valida esos archivos locales, no acredita acceso remoto ni sesión CLI.

No se encontró Firebase CLI en PATH ni en node_modules/.bin. No se pudo confirmar su sesión ni destino remoto. Conforme a la condición de la fase J, **no se desplegó**. No existe una URL pública obtenida por esta intervención ni una validación HTTPS/producción; no se generó QR ni se declaró aptitud para QR.

Cuando la CLI oficial esté disponible y autenticada, confirmar acceso al proyecto existente, validar manualmente las lecturas privadas y ejecutar todos los checks con Git limpio. El comando limitado a Hosting es:

```powershell
firebase deploy --only hosting --project chichej-2026
```

No ejecutar deploy general. No desplegar reglas, Storage ni Functions. Usar exclusivamente la URL devuelta por la CLI y revisar allí las páginas, Auth, recursos y consultas Firebase antes de considerar QR.

Rollback Git: revertir el commit afectado (sin reset destructivo), ejecutar checks y subir la reversión a main. Si posteriormente se publica, revertir también la versión de Hosting al release conocido desde su historial. Un rollback de Hosting no revierte datos Firebase; esta fase no modifica datos.

Commits previos de este cierre: aa2ebf3 (Contacto) y f4cc597 (consultas de dispensador/pedidos, ajustes visuales y navegación), ambos subidos a origin/main con árbol limpio entre bloques. El informe y el check de Hosting se registran en un commit final independiente.
