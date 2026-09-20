# CHICHEJ Web

## Edición del perfil propio — Fase 6B

Perfil permite editar nombre, teléfono y avatar del catálogo local mediante una actualización parcial del usuario autenticado en RTDB. Correo, rol, bloqueo y campos administrativos quedan fuera del formulario y del payload. Cancelar descarta el borrador y recarga los datos. La primera escritura real y los permisos remotos quedan para la verificación manual de Eduardo; no hubo cambios de reglas ni deploy.

Ejecutar también `node scripts/check-profile-edit.mjs` junto con los cinco checks anteriores. [Informe, límites de seguridad y lista de verificación](docs/FASE-6B-EDICION-PERFIL.md).

## Mi Cuenta y Perfil de consulta — Fase 6A

`public/usuario/index.html` y `public/usuario/perfil.html` muestran únicamente el perfil propio de la sesión Firebase. Sin sesión, redirigen a Login. La navegación autenticada permite entrar a Mi cuenta; logout limpia los datos y vuelve al Inicio público. Edición, pedidos, reservas y promociones siguen pendientes. Se mantiene el acceso de admin/admin_principal a su propio perfil, como en requireUser del original, sin panel administrativo ni cambio de rol.

Con `node scripts/serve-static.mjs`, abrir [Mi cuenta](http://localhost:8080/usuario/). Ejecutar también `node scripts/check-account.mjs`, además de los cuatro checks anteriores. [Informe y pruebas manuales de Fase 6A](docs/FASE-6A-MI-CUENTA-PERFIL.md). Sin nuevas escrituras Firebase ni deploy. Eduardo confirmó el registro, perfil cliente, sesión, logout, nuevo login y recuperación/cambio de contraseña de Fase 5B; las pruebas reales de estas páginas privadas quedan pendientes de su validación.

## Registro y recuperación — Fase 5B

`public/registro.html` crea una identidad nueva con Firebase Authentication y su perfil cliente en RTDB `usuarios/{uid}`, sin reemplazar perfiles existentes. Recuperación está integrada en Login y utiliza el correo seguro de Firebase. El esquema conserva los seis campos del registro PHP; no concede muestras iniciales (Flutter las inicializa de otra manera, según el análisis documentado).

Ejecutar `node scripts/serve-static.mjs` y abrir [Registro](http://localhost:8080/registro.html). Checks: `check-static.mjs`, `check-auth.mjs`, `check-products.mjs` y `check-register.mjs`, todos bajo `scripts/`. No se crearon cuentas ni se enviaron correos reales durante las pruebas automáticas. Eduardo debe efectuar el registro de una cuenta propia y la recuperación; ver [informe Fase 5B](docs/FASE-5B-REGISTRO-RECUPERACION.md). Sin cambios de reglas ni deploy.

## Login, sesión y logout — Fase 5A

`public/login.html` permite el ingreso de cuentas existentes con Firebase Authentication modular. La sesión se muestra solo después de leer el perfil propio en RTDB `usuarios/{uid}` y validar rol y bloqueo. Las cinco páginas públicas reconocen la sesión; el cierre regresa a Inicio. Registro, recuperación y áreas privadas continúan pendientes.

Ejecutar `node scripts/serve-static.mjs` y abrir [Login](http://localhost:8080/login.html). Validaciones: `node scripts/check-static.mjs`, `node scripts/check-auth.mjs` y `node scripts/check-products.mjs`. Eduardo confirmó posteriormente el ingreso real de cliente y admin_principal, lectura de perfil, persistencia con F5 y logout; también confirmó navegación persistente del cliente. Ver [informe y comprobaciones de Fase 5A](docs/FASE-5A-LOGIN-FIREBASE.md). Durante esa implementación no hubo deploy, creación de cuentas, escrituras de perfiles ni cambios de reglas.

## Productos con Firestore — Fase 4

`public/productos.html` consulta la colección real `productos` con Firebase Web SDK modular, sin PHP ni operaciones de escritura y sin exigir iniciar sesión. La configuración pública oficial está en `public/assets/js/firebase-config.js`. Se muestran solo activos; el catálogo no crea pedidos ni habilita compra.

Ejecutar `node scripts/serve-static.mjs`, abrir [Productos](http://localhost:8080/productos.html) y comprobar con `node scripts/check-static.mjs` y `node scripts/check-products.mjs`. Ver [informe Fase 4](docs/FASE-4-PRODUCTOS-FIREBASE.md) para esquema real, permisos observados, pruebas y límites. No se desplegó Hosting ni se modificaron reglas o datos Firebase.

## Inicio portable — Fase 3

Inicio, Nosotros e Información ya forman una navegación estática en `public/`. Ejecutar `node scripts/serve-static.mjs` y abrir [Inicio](http://localhost:8080/). La raíz sirve Inicio directamente; las opciones pendientes no enlazan a PHP.

Con el servidor activo, `node scripts/check-static.mjs` comprueba las tres páginas, recursos, anclas y aislamiento de la raíz pública. Ver [Fase 3: clasificación, correcciones y cierre Git](docs/FASE-3-INICIO-PORTABLE.md). Sin conexión Firebase ni despliegue en esta fase.

## Piloto estático — Fase 2

Las páginas Nosotros e Información ya tienen copias estáticas en `public/`, conservando el contenido y estilo originales. Iniciar desde esta carpeta con Node.js:

```powershell
node scripts/serve-static.mjs
```

Abrir [Nosotros](http://localhost:8080/nosotros.html) e [Información](http://localhost:8080/informacion.html). No requiere PHP, Apache, MySQL ni instalar paquetes npm. Las demás opciones están identificadas como pendientes; el sistema PHP original sigue intacto.

Consultar [Fase 2: conversiones, pruebas y checklist](docs/FASE-2-PILOTO-PORTABLE.md). `firebase.json` prepara únicamente `public` como raíz futura: **no se ha desplegado** ni vinculado un proyecto Firebase.

## Copia portable — preparación del 17/09/2026

Este proyecto independiente corresponde a `Andrux88Felius/chichej-web` y se trabaja en `C:\Proyectos\chichej-web`. La carpeta original `servidor-linux` no forma parte de esta intervención.

Consultar [el informe de preparación](docs/FASE-1-PORTABILIDAD.md) y [el inventario](docs/INVENTARIO-FASE-1.md) para el estado observado, clasificación PHP, riesgos, arquitectura propuesta y verificaciones manuales. Esta fase conserva toda la lógica y apariencia; todavía necesita PHP y no está desplegada en Firebase Hosting.

Las variables requeridas se documentan en [.env.example](.env.example), sin secretos. PHP las recibe mediante `getenv()`; copiar el ejemplo a `.env` no las carga automáticamente. Conservar las cuentas de servicio fuera del repositorio y del directorio público.

El resto de este README conserva documentación de etapas anteriores: algunas descripciones de contacto, productos, auditoría y reportes quedaron desactualizadas. Para esta inspección prevalece el informe enlazado. Ajustar las instrucciones locales para servir **esta copia**; no usar la URL de servidor-linux que aparece en el historial siguiente.

## Documentación histórica conservada

Base visual corporativa y comercial de CHICHEJ construida con PHP, HTML, CSS y JavaScript para ejecutarse con Apache.

## Alcance actual

- Sitio público responsive con portada, historia, catálogo, promociones, contacto, registro, acceso y experiencia de dispensado.
- Estructura visual para las futuras áreas de usuario y administración.
- Reutilización directa de logotipos, productos, campañas, imágenes institucionales y redes sociales disponibles en `assets/`.
- El formulario público de contacto envía mediante SMTP cuando las variables de correo están configuradas; registro, acceso, recuperación y perfil usan Firebase únicamente cuando el entorno está configurado.

### Correo de Contacto

El envío usa PHPMailer desde el servidor. Configura estas variables en Laragon o en el servicio PHP de Ubuntu; no las expongas al navegador ni las guardes en el repositorio:

- `CHICHEJ_MAIL_HOST` (para Gmail: `smtp.gmail.com`)
- `CHICHEJ_MAIL_PORT` (normalmente `587`)
- `CHICHEJ_MAIL_USERNAME`
- `CHICHEJ_MAIL_PASSWORD` (contraseña de aplicación, nunca la contraseña normal)
- `CHICHEJ_MAIL_ENCRYPTION` (`tls` o `ssl`)
- `CHICHEJ_MAIL_FROM_ADDRESS` (si se omite, usa el usuario SMTP)
- `CHICHEJ_MAIL_FROM_NAME` (opcional; por defecto `Sitio web CHICHEJ`)
- `CHICHEJ_MAIL_TO_ADDRESS` (opcional; por defecto `chichej.bolivia@gmail.com`)

Después de definirlas, reinicia Apache/PHP-FPM para que el proceso reciba el entorno.
- Configuración Firebase obtenida del entorno, sin credenciales dentro del repositorio.

## Ejecución local

1. Copiar o enlazar esta carpeta dentro del directorio público de Apache.
2. Verificar que PHP 8.3 o superior esté habilitado (Kreait 8.4 requiere PHP 8.3–8.5).
3. Abrir `http://localhost/servidor-linux/` (ajustar la URL según el `DocumentRoot` o virtual host configurado).

## Integraciones futuras

Los puntos de extensión se encuentran en `config/` e `includes/auth.php`. Antes de activar funciones reales se deberán definir contratos de datos, permisos, validación del lado del servidor y comunicación segura con el dispensador. Las credenciales deberán llegar mediante variables de entorno y nunca guardarse en el repositorio.

### Arquitectura mixta prevista

La futura integración debe mantener una sola identidad CHICHEJ compartida entre la aplicación móvil y la plataforma web. Un usuario existente no deberá crear otra cuenta ni recibir un rol duplicado.

**Firebase / ecosistema CHICHEJ**

- Firebase Authentication como proveedor compartido de identidad.
- Usuarios y roles existentes como fuente autorizada para permisos.
- Productos, pedidos, promociones, reservas e historial operativo.
- Estado, disponibilidad, nivel y eventos operativos del dispensador.
- Acceso desde app y web utilizando el mismo identificador de usuario.

**MySQL del servidor web**

- Contenido corporativo y comercial propio del sitio.
- Mensajes recibidos desde el formulario de contacto.
- Configuraciones específicas de la plataforma web.
- Catálogo de contenidos multimedia cuando corresponda.
- Auditoría web y otros datos exclusivos del servidor.

MySQL no debe duplicar contraseñas, identidades, roles, productos o pedidos que ya tengan una fuente autorizada en Firebase. Cuando sea necesario relacionar datos web con un usuario, se almacenará únicamente el identificador estable de la identidad compartida.

### Integraciones que siguen desactivadas

- El formulario público de contacto no persiste información.
- Acceso, registro, recuperación de contraseña y edición personal se habilitan automáticamente solo cuando el cliente Firebase y el verificador del servidor están correctamente configurados.
- El dispensado no se comunica con Firebase, ESP32 ni hardware.
- Los reportes no consultan ventas ni generan archivos PDF.
- El avatar se persiste exclusivamente desde la lista cerrada de recursos compatibles de CHICHEJ.
- Los precios y modalidades del sistema CHICHEJ están pendientes de definición comercial.

### Contenido pendiente de proporcionar

- Fotografías y videos reales del dispensador y del sistema en funcionamiento.
- Código QR oficial para la descarga Android, cuando se defina.
- Precios, modalidades y condiciones comerciales aprobadas.

## Seguridad

Esta versión aplica autorización del lado servidor y mantiene cerradas las áreas privadas mientras la autenticación Firebase real no pueda verificarse criptográficamente. Ningún control visual deshabilitado constituye por sí solo una medida de seguridad.

## Fase 1: autenticación compartida

### Estructura real identificada en CHICHEJ

La aplicación utiliza Firebase Authentication con correo y contraseña. El perfil se consulta en Firebase Realtime Database bajo `usuarios/{uid}` y contiene, entre otros, los campos `nombre`, `email`, `rol`, `avatarPath` y `bloqueado`.

- Usuario habitual: rol `cliente`.
- Administración: roles `admin` y `admin_principal`.
- Una cuenta con `bloqueado == true` debe cerrar sesión y no acceder al área privada.
- El avatar administrativo usa la identidad oficial; los demás perfiles pueden conservar `avatarPath`.

### Estado seguro de la integración

Las rutas de `usuario/` ya exigen una sesión PHP autenticada. Las rutas de `admin/` exigen además uno de los roles administrativos reconocidos. La navegación pública adapta sus acciones según la sesión y el cierre utiliza POST, token CSRF y destrucción de la cookie de sesión.

El login implementa el flujo cliente-servidor seguro de la Fase 1. Firebase Authentication valida correo y contraseña en el navegador; el navegador envía únicamente el ID token al endpoint PHP. Kreait verifica criptográficamente ese token, obtiene el UID verificado y consulta en el servidor `usuarios/{uid}`. La sesión PHP se crea solo después de rechazar perfiles inexistentes, bloqueados o con roles distintos de `cliente`, `admin` y `admin_principal`.

El endpoint no acepta UID, rol, estado de bloqueo ni datos de perfil enviados por el navegador. La sesión conserva únicamente UID, nombre, correo, rol y avatar normalizados. El cierre de sesión mantiene POST y CSRF, destruye la sesión PHP e intenta cerrar también la sesión Firebase del navegador.

### Preparación del servidor Ubuntu

Requisitos:

- PHP compatible con Kreait Firebase PHP `^8.4` y las extensiones requeridas por Composer.
- Apache con acceso al directorio `vendor/` generado por Composer.
- Salida HTTPS hacia los servicios de Google/Firebase.
- Reloj del servidor sincronizado para validar correctamente la vigencia de los tokens.

Instalar las dependencias desde la raíz del proyecto en el servidor:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
```

La cuenta de servicio debe permanecer fuera del repositorio en:

```text
/etc/chichej/firebase-service-account.json
```

El usuario de Apache (`www-data`) necesita permiso de lectura sobre ese archivo y permiso de paso sobre `/etc/chichej`, sin conceder permisos de escritura ni hacerlo legible públicamente. La ruta puede sustituirse con `CHICHEJ_FIREBASE_SERVICE_ACCOUNT`. Nunca copiar el JSON a `assets/`, al `DocumentRoot`, al repositorio o a la documentación.

`vendor/` está excluido mediante `.gitignore`; debe instalarse en cada entorno de despliegue y no versionarse.

La configuración cliente se inyectará mediante estas variables del entorno:

- `CHICHEJ_FIREBASE_API_KEY`
- `CHICHEJ_FIREBASE_AUTH_DOMAIN`
- `CHICHEJ_FIREBASE_DATABASE_URL`
- `CHICHEJ_FIREBASE_PROJECT_ID`
- `CHICHEJ_FIREBASE_APP_ID`
- `CHICHEJ_FIREBASE_MESSAGING_SENDER_ID`

No deben almacenarse contraseñas, refresh tokens, cuentas de servicio ni claves privadas en el repositorio. El registro web crea la identidad mediante Firebase Authentication y, tras verificar el ID token en PHP, crea de forma idempotente el perfil `usuarios/{uid}` con rol fijo `cliente`. No se crean usuarios en MySQL.

La autenticación permanece cerrada si falta cualquiera de los valores públicos obligatorios (`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`), `vendor/autoload.php` o acceso de lectura a la cuenta de servicio. `messagingSenderId` es opcional para este flujo de correo y contraseña. Los valores públicos deben copiarse desde la aplicación Web registrada oficialmente en el proyecto Firebase de CHICHEJ; no deben inventarse ni deducirse.

### Contrato del endpoint de sesión

`POST api/auth/session-login.php` acepta exclusivamente JSON con una sola propiedad `idToken`. Sus respuestas no exponen tokens, credenciales, rutas internas ni detalles de excepciones. En caso de éxito devuelve solamente `success`, `role` y la ruta de redirección. Las cuentas bloqueadas reciben el mensaje aprobado: “Tu cuenta no está disponible para acceder en este momento.”

## Fase 2: lectura operativa

La plataforma consume datos reales desde PHP. Reservas incorpora además escrituras autenticadas y acotadas:

- Realtime Database: `usuarios/{uid}`, listado administrativo de `usuarios` y monitoreo privado de `dispensador/principal`.
- Firestore: colecciones `productos`, `pedidos`, `reservas` y `mensajes`.
- Cliente autenticado: el UID se deriva siempre de la sesión PHP. Las páginas no aceptan un UID por URL y filtran pedidos y reservas antes de renderizar.
- Administración: las lecturas globales exigen `admin` o `admin_principal` mediante `requireAdmin()`.

Kreait se utiliza para Realtime Database. Firestore se consulta con su API REST oficial, usando en el servidor el token OAuth de la misma cuenta de servicio y las dependencias ya instaladas con Kreait. Esto evita exponer privilegios administrativos en JavaScript y evita añadir `google/cloud-firestore`, que requiere preparación adicional del servidor.

### Normalización de pedidos

La clasificación de origen conserva los valores reales y aplica estas reglas, en orden:

1. Administrativo: `esDispensacionAdministrativa == true`, `metodoPago == admin` o `estadoPago == no_requerido`.
2. Físico / pulsador: `tipoUsuario == fisico` u `origenPedido == pulsador`.
3. Web: `origenPedido == web`.
4. Cliente / app: origen `app`, `aplicacion`, `movil` o tipo `cliente`/`usuario`.
5. Otros: se muestra el valor real de `origenPedido`; si falta, “Otro / no especificado”.

Los reportes consideran venta válida cuando `estadoPago == aprobado`, el estado no es `cancelado` y `metodoPago != admin`. Total, ticket promedio, producto, presentación, pago y origen se calculan únicamente sobre esas ventas. Los pedidos incluidos respetan el período seleccionado. La generación PDF continúa deshabilitada.

Las escrituras incorporadas son el alta idempotente del perfil, la actualización autenticada de datos personales y el flujo seguro de reservas. MySQL, dispensado real, hardware y las demás operaciones administrativas siguen desconectados.

### Campos pendientes de confirmar con datos de producción

- No se encontró un estado de usuario “inactivo” con contrato estable; se muestran `rol`, `bloqueado` y cualquier estado real disponible, sin inferir inactividad.
- `origenPedido == web` y `esDispensacionAdministrativa` están contemplados por la normalización si aparecen, pero no se inventan cuando faltan.
- Las rutas de imágenes de productos se reutilizan solamente cuando coinciden con assets locales compatibles; no se descargan ni se exponen rutas arbitrarias.
- La telemetría detallada de `dispensador/principal` se muestra únicamente a administradores. La página pública de dispensado conserva su interfaz segura sin controles reales.

## Fase 2.1: administración y analítica

Todas las páginas administrativas incluyen una navegación secundaria persistente con acceso directo a Resumen, Usuarios, Productos, Pedidos, Reservas, Promociones, Reportes, Dispensador y Actividad. Las listas extensas usan contenedores con scroll interno y filtros en el navegador sobre los datos ya cargados; los filtros no generan consultas por fila.

El dashboard admite Hoy, Últimos 7 días, Este mes, Este año y Todos. Los KPI, Top usuarios y gráficas se recalculan en PHP con el mismo conjunto filtrado. El ranking utiliza ventas válidas con `usuarioId` y excluye registros físicos o de pulsador.

`admin/actividad.php` combina cronológicamente pedidos, ventas físicas, reservas, registros de usuario, promociones e informativos cuando tienen timestamps interpretables. Estos son eventos inferidos de datos operativos, no una auditoría de acciones administrativas.

### Auditoría administrativa

La colección Firestore `auditoria_admin` es la fuente de lectura. El normalizador admite estos campos cuando existen:

- `adminUid`
- `adminNombre`
- `adminRol`
- `accion`
- `cantidad`
- `descripcion`
- `fecha` o `fechaHora`
- `modulo`
- `entidadId`
- `productoId`
- `productoNombre`
- `usuarioUid`
- `usuarioNombre`
- `valorAnterior`
- `valorNuevo`

La interfaz muestra registros reales y las transiciones administrativas de reservas crean auditoría en la misma confirmación atómica de Firestore. Las demás áreas continúan sin escribir auditoría.

## Estado funcional de la plataforma web

Clasificación vigente tras la Fase 2.3:

| Módulo | Estado | Alcance actual |
| --- | --- | --- |
| Login | FUNCIONAL | Firebase Authentication en navegador, verificación del ID token y rol en servidor, sujeto a configuración del entorno. |
| Logout | FUNCIONAL | Cierre de Firebase Auth, sesión PHP y cookie mediante POST con CSRF. |
| Registro | FUNCIONAL | Crea la identidad en Firebase Auth y el perfil RTDB idempotente con rol fijo `cliente`, sujeto a configuración del entorno. |
| Perfil | FUNCIONAL | Lee el perfil propio y permite actualizar únicamente nombre, teléfono y avatar autorizado. |
| Avatar | FUNCIONAL | Selector limitado a los avatares compatibles existentes y persistencia RTDB segura. |
| Cambio de contraseña | FUNCIONAL | Solicitud de restablecimiento por correo mediante Firebase Authentication; PHP no recibe contraseñas. |
| Pedidos del usuario | LECTURA REAL | Solo registros cuyo `usuarioId` coincide con el UID de sesión; incluye búsqueda, fecha, período, estado y scroll. |
| Reservas del usuario | FUNCIONAL | Crea, lista y cancela reservas propias cuando están pendientes; la identidad siempre proviene de la sesión. |
| Metas y fidelización | FUNCIONAL | Calcula compras válidas del mes, bebidas históricas y consumo mensual con reglas documentadas; no concede premios. |
| Productos públicos | LECTURA REAL | Firestore con normalización defensiva e imágenes locales verificadas. |
| Promociones públicas/usuario | LECTURA REAL | Lee mensajes activos; no crea ni modifica campañas. |
| Admin usuarios | LECTURA REAL | Consulta y filtros. Bloqueo y cambio de rol no implementados. |
| Admin productos | FUNCIONAL | Crea, consulta, edita, activa/desactiva y cambia disponibilidad con autorización fresca y auditoría atómica. |
| Admin pedidos | LECTURA REAL | Consulta, clasificación y filtros. No crea ni cambia pedidos. |
| Admin reservas | FUNCIONAL | Consulta, acepta, rechaza o cancela según la transición permitida, con autorización fresca y auditoría atómica. |
| Admin promociones | LECTURA REAL | Consulta de mensajes y estado activo. CRUD no implementado. |
| Admin reportes | LECTURA REAL | Métricas y vista previa con datos reales. |
| PDF | NO IMPLEMENTADO | El botón permanece deshabilitado; falta generación segura en servidor. |
| Actividad operativa | LECTURA REAL | Eventos inferidos de usuarios, pedidos, reservas y mensajes. |
| Auditoría administrativa | FUNCIONAL EN RESERVAS | Lee `auditoria_admin`; cada transición administrativa de una reserva agrega un registro trazable. |
| Información del proyecto | FUNCIONAL | Página institucional con responsables, caso de estudio y documentación preparada. |
| Perfil PDF/documentación | FUNCIONAL | Enlaces públicos oficiales al perfil y tríptico incorporados en Información. |
| Google Maps de Gustitos Maggi | FUNCIONAL | Utiliza la URL oficial proporcionada en Información. |
| Dispensador administrativo | LECTURA REAL | Telemetría RTDB en modo consulta. |
| Dispensado web | NO IMPLEMENTADO | No envía órdenes a Firebase, ESP32 o hardware. |
| Pedidos web | NO IMPLEMENTADO | El catálogo no inicia compras. |
| CRUD general | PARCIAL | Reservas tiene alta y cambios de estado sin borrado físico; los demás módulos no incorporan CRUD. |
| Contacto | PREPARADO | Formulario visual sin persistencia. |
| MySQL | NO IMPLEMENTADO | Configuración deliberadamente desconectada. |

### Contratos funcionales de la Fase 2.3

- Registro: el navegador crea o recupera la identidad Firebase Auth y envía un ID token al servidor. PHP deriva UID y correo del token verificado. Si `usuarios/{uid}` no existe, crea una sola vez un perfil con rol fijo `cliente`, avatar invitado y estado no bloqueado; si ya existe, no lo sobrescribe. Esto permite reintentar tras un fallo parcial sin duplicar perfiles ni elevar roles.
- Perfil: `api/user/profile-update.php` deriva el UID de la sesión, exige POST JSON y CSRF, y solo admite `nombre`, `avatarPath` y `telefono`. Nunca acepta cambios de UID, correo, rol o bloqueo.
- Avatar: solo se aceptan `assets/avatares/avatar1.png` a `avatar9.png` y `assets/avatares/invitado.png`.
- Contraseña: Firebase Authentication envía el correo de restablecimiento desde Login o Perfil. PHP nunca recibe ni almacena contraseñas.
- Metas: “Cliente del mes” cuenta pedidos válidos del mes actual con objetivo visual de 5; “Fan CHICHEJ” suma cantidades de bebidas válidas históricas con objetivo visual de 10; el consumo mensual suma `cantidad × cantidadMl` y muestra mililitros y litros. Se exige coincidencia exacta de `usuarioId`, pago aprobado, pedido no cancelado/rechazado, método distinto de `admin` y origen no administrativo ni físico/pulsador. Son indicadores informativos y no crean beneficios, premios o muestras gratis.
- Reservas: `api/user/reservations/create.php` y `cancel.php` derivan el UID de la sesión, exigen POST JSON y CSRF y validan límites y transiciones. El endpoint administrativo vuelve a consultar `usuarios/{uid}` y confirma rol y bloqueo antes de cambiar el estado.
- Nuevas reservas: guardan `cantidadSolicitada` como campo canónico, teléfono obligatorio y los campos opcionales `direccion`, `referenciasLugar` y `observaciones`. La lectura conserva compatibilidad con `cantidad`, `email` y documentos que solo contienen dirección.
- Estados: el valor canónico compatible es `pendiente`, `aceptada`, `rechazada` o `cancelada`; los valores heredados `aprobada`/`aprobado` se interpretan como aceptados. No existe borrado físico.
- Auditoría: el cambio administrativo y su documento en `auditoria_admin` se confirman en una sola operación con precondición `updateTime`, evitando sobrescribir una transición concurrente sin dejar traza.
- Autorización administrativa: Login y las escrituras reutilizan la misma lectura `usuarios/{uid}` y la misma normalización explícita de rol y bloqueo, incluida compatibilidad con perfiles históricos sin el campo `bloqueado`.
- Productos: se administran en Firestore `productos/{documentId}` sin borrado físico. Las nuevas altas usan `productoId` generado por servidor; las ediciones preservan identificadores, timestamps de creación y campos históricos no administrados. Cada escritura usa precondición de versión y auditoría atómica.
- Actividad personal: creación y cancelación por el cliente no se registran en `auditoria_admin`, reservada para acciones administrativas.

### Pendientes posteriores

- Persistencia del formulario público de contacto.
- CRUD administrativo, pedidos web, generación PDF y dispensado real.
- Confirmación comercial de cualquier premio o beneficio asociado a metas.
