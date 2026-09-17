# CHICHEJ Web — inspección y preparación

Fecha: 17 de septiembre de 2026. Alcance: exclusivamente `C:\Proyectos\chichej-web`. No se modificaron la web original `C:\Proyectos\servidor-linux`, Flutter, ESP32 ni Firebase. No se migró código, no se enviaron correos, no se realizaron escrituras de datos, commit, push, despliegue ni QR nuevo.

## 1. Estructura real

Inventario inicial propio, excluyendo `.git` y `vendor`: 140 archivos; 69 PHP, 5 JavaScript, 1 CSS, 58 imágenes (44 PNG, 10 JPEG, 4 JPG), 2 MP3, 1 MP4, composer.json, composer.lock, README.md y .gitignore. No hay HTML independiente: el HTML está en los PHP. El inventario por ruta está en `INVENTARIO-FASE-1.md`.

```text
chichej-web/
  .git/                  Repositorio existente, sin commits ni índice poblado
  admin/                 9 páginas administrativas
  api/                   10 endpoints PHP: auth, contact, user, admin
  assets/
    css/styles.css       Identidad visual y responsive
    js/                  app, admin, firebase-auth, reservations, products-admin
    img/                 Logos, productos, campañas, avatares, QR heredados, audio/video
  config/                database.php, firebase.php, mail.php, session.php
  includes/              11 helpers/componentes + 16 vistas en views/
  services/              5 servicios PHP
  usuario/               Cuenta, perfil, pedidos, reservas, promociones
  *.php                  9 entradas públicas, incluyendo logout
  vendor/                Dependencias Composer presentes, ignoradas
  composer.json / composer.lock
```

No se encontraron instrucciones AGENTS.md aplicables, configuración de Hosting (`firebase.json`, `.firebaserc`), reglas Firebase, paquete npm, pruebas propias ni configuración Apache `.htaccess` dentro de esta copia.

## 2. Componentes y estado observado en código

| Componente | Implementación existente |
| --- | --- |
| Inicio, Nosotros, Información | Contenido institucional y composición PHP; inicio incluye campañas locales. |
| Productos | Entrada delega a products-live.php; catálogo Firestore y mensajes activos, sin creación de pedidos web. |
| Dispensar público | Interfaz sin órdenes reales al ESP32. |
| Login/registro/recuperación | Firebase Auth Web; PHP verifica ID token con Kreait. Registro crea perfil RTDB idempotente. |
| Logout | POST, CSRF, destrucción de sesión/cookie y cierre Firebase en cliente. |
| Cuenta/perfil | Sesión requerida; consulta de perfil, pedidos, reservas y progreso; actualización limitada de nombre, teléfono y avatar. |
| Pedidos cliente | Lectura filtrada por UID de sesión. |
| Reservas | Alta, cancelación propia pendiente y transiciones administrativas con validación. |
| Promociones | Mensajes Firestore activos y carrusel de imágenes locales; no CRUD de campañas. |
| Admin | Dashboard, usuarios, productos, pedidos, reservas, reportes, promociones, dispensador y actividad. |
| Productos admin | Crear, editar, activar/desactivar y disponibilidad; autorización fresca y auditoría atómica. |
| Reservas admin | Aceptar/rechazar/cancelar, precondiciones de concurrencia y auditoría atómica. |
| Reportes | Métricas PHP sobre pedidos; PDF deshabilitado, sin generador implementado. |
| Monitoreo | Lectura privada RTDB; no control hardware. |
| Contacto | app.js → api/contact/send.php → ContactMailService → PHPMailer/SMTP. Validación, CSRF, honeypot y pausa de 60 s por sesión; sin persistencia. |

Esto confirma implementación, no funcionamiento contra producción: no se han probado cuentas, conectividad, SMTP ni Firebase en este entorno.

## 3. Dependencias

- PHP: toda la composición actual, sesiones, validaciones y API. El README exige PHP 8.3 o superior compatible con las dependencias fijadas. Verificar extensiones y plataforma con Composer antes de ejecutar.
- Composer: `kreait/firebase-php ^8.4` y `phpmailer/phpmailer ^6.10`; lock observado: Kreait 8.4.0, PHPMailer 6.12.0, google/auth 1.53.0 y Guzzle 8.1.0. Conservar el lock.
- Firebase Auth: SDK Web importado desde gstatic, versión 12.18.0 en el código. Verificación administrativa exclusivamente en PHP.
- RTDB: `usuarios/{uid}`, listado `usuarios`, `dispensador/principal`.
- Firestore REST con OAuth de cuenta de servicio: `productos`, `pedidos`, `reservas`, `mensajes`, `auditoria_admin`. No se identificó uso operativo de `configuracion` en esta copia; no inventar ni renombrar estructuras. La identidad/roles que usa esta web están en RTDB, no en una nueva colección Firestore de usuarios.
- SMTP: variables `CHICHEJ_MAIL_*`, PHPMailer y salida de red al proveedor configurado.
- MySQL: solo `config/database.php`, que devuelve un array vacío. No se encontraron conexiones PDO/mysqli ni SQL operativo propio.
- Apache: entorno documentado, sin reglas de reescritura propias encontradas. PHP requiere un servidor compatible; no hay evidencia de una dependencia exclusiva de Apache.
- JavaScript propio sin proceso de compilación. CSS y multimedia locales; enlaces externos de redes, Maps y documentos institucionales.
- Portabilidad local: cuenta de servicio predeterminada en `/etc/chichej/firebase-service-account.json`; sustituible por entorno. No se encontraron IP `192.168.x.x` en código operativo. Las rutas `.php`, sesiones y llamadas API sí mantienen dependencia de servidor.

El identificador exacto Firebase debe copiarse desde la consola del proyecto oficial referido como `chichej_2026`; el código no permite confirmar su ID real porque usa variables de entorno. No inferirlo del nombre visible.

## 4. Revisión de información sensible

No se encontraron secretos reales incrustados en los archivos de configuración revisados ni marcadores de claves privadas/tokens conocidos en el código propio. No se encontraron `.env`, credentials.php, service accounts JSON o claves privadas dentro de los archivos propios inventariados.

| Archivo | Resultado y tratamiento |
| --- | --- |
| config/mail.php | Lee entorno; usuario/contraseña vacíos por defecto. El correo destinatario público no es una contraseña. Se conserva versionable porque es necesario para ejecutar. |
| config/firebase.php | Lee configuración cliente pública y ruta de cuenta de servicio externa. No contiene clave privada. Se conserva. |
| config/database.php | Vacío, sin credenciales MySQL. |
| services/ContactMailService.php | Usa credenciales recibidas, sin valores secretos literales. Se conserva. |
| FirebaseReadService/ProductService/ReservationService | Obtienen OAuth en ejecución desde cuenta externa; no contienen tokens fijos. |
| .env.example | Nueva plantilla sin valores secretos; documenta todas las variables utilizadas. |

No se creó mail.example.php porque el mail.php existente ya es configuración segura basada en entorno. Copiar `.env.example` no activa el entorno: no hay cargador dotenv. Configurar las variables en el proceso PHP. Nunca poner cuentas de servicio dentro del directorio público aunque Git las ignore.

La revisión combina nombres de archivos, marcadores y lectura del flujo; no certifica ausencia absoluta de secretos, texto dentro de imágenes, datos externos, historial remoto ni dependencias de terceros. No se volcó contenido sensible a la documentación. Volver a revisar el conjunto preparado para el primer commit antes de publicarlo.

## 5. Git y cambios de preparación

El repositorio ya existía en rama `main`, sin commits, referencias ni archivos rastreados. Se detectaron 39 objetos locales de tipo blob y un objeto temporal incompleto; no se encontraron objetos commit ni historial heredado. No se borraron objetos ni se reutilizó historial de servidor-linux. El remoto inicial estaba ausente; se configuró únicamente `origin = https://github.com/Andrux88Felius/chichej-web.git`. No se consultó el estado remoto ni se realizó fetch/push.

`.gitignore` pasó de excluir solo vendor a cubrir .env (excepto el ejemplo), nombres convencionales de credenciales y cuentas de servicio, claves privadas, carpetas de secretos, configuraciones locales, dependencias generadas, caché Firebase, logs, temporales, IDE y sistema operativo. No se excluyen PHP funcionales, assets, composer.lock ni configuración pública. Gitignore no detecta secretos de nombre arbitrario ni reemplaza la revisión previa al commit.

Archivos cambiados/creados: `.gitignore`, `.env.example`, `README.md`, este informe e inventario. Además, configuración local del remoto Git. Ningún PHP, JS, CSS, asset o dependencia fue modificado.

## 6. Clasificación PHP y dificultad

Categorías acumulativas: A composición visual; B Firebase; C autenticación/sesión; D administración; E SMTP; F generación PDF; G MySQL; H backend seguro; I candidato HTML+JS. I no significa que toda la funcionalidad pueda copiarse al navegador.

| Archivos/grupo | Categorías | Migración propuesta |
| --- | --- | --- |
| index.php, nosotros.php, info.php, dispensar.php | A/I, C indirecta en navbar | Baja en contenido; conservar campañas, multimedia y comportamiento. Dispensar sigue sin hardware. |
| includes/header.php, includes/promotions-carousel.php | A/I | Baja: plantilla estática/compilada con mismo HTML y CSS. |
| includes/navbar.php, includes/footer.php | A/C/I; footer inyecta config Firebase | Media: separar identidad, CSRF, rutas, scripts condicionales y configuración cliente. |
| includes/admin-nav.php | A/D/I | Baja visual; no sustituye permisos reales. |
| includes/admin-placeholder.php | A/C/D/I | Presentación heredada protegida; conservar como referencia. |
| productos.php, includes/views/products-live.php | A/B/I | Media: lectura pública autorizada y normalización equivalentes. |
| contacto.php | A/C/E/I | Baja visual; envío exige backend equivalente. |
| login.php, registro.php, includes/views/register-ux.php | A/B/C/H | Alta en integración: mantener verificación de identidad y perfil sin escalada de roles. |
| logout.php, includes/auth.php, config/session.php | C/H | Alta: sustituir contrato de sesión/CSRF de forma coherente. |
| config/firebase.php | B/C/H | Separar configuración cliente del acceso administrativo. |
| config/mail.php, services/ContactMailService.php, api/contact/send.php | E/H; endpoint C | Mantener servidor o migrar a función segura; jamás SMTP desde navegador. |
| config/database.php | G (solo punto previsto) | Sin MySQL activo que migrar. |
| includes/firebase-data.php | B/I | Helpers de lectura, normalización, fechas, métricas; migración media/alta con equivalencia y autorización. |
| includes/firebase-profile.php | B/C/H | Normalización de roles/bloqueo y lectura de perfil; preservar también campos heredados. |
| includes/products.php | D/H | Validación de productos debe conservarse del lado seguro; duplicar UX no reemplaza validación. |
| includes/reservations.php | H/I | Máquina de estados reusable; validación autoritativa continúa en backend. |
| services/FirebaseReadService.php | B/C/H | Alta: lectura, creación idempotente y edición limitada de perfiles. |
| services/AdminAuthorizationService.php | B/C/D/H | Alta: autorización fresca antes de escritura. |
| services/ProductService.php, services/ReservationService.php | B/D/H | Alta: preservar transacciones, precondiciones y auditoría. |
| api/auth/session-login.php, api/auth/register-profile.php | B/C/H | Alta: verificar ID token y derivar UID/rol del servidor. |
| api/user/profile-update.php, api/user/reservations/create.php, cancel.php | B/C/H | Alta: propiedad, campos permitidos, estados y CSRF. cancel.php se encuentra en api/user/reservations/. |
| api/admin/products/create.php, update.php, update-status.php; api/admin/reservations/update-status.php | B/C/D/H | Alta: permisos frescos, validación y atomicidad. Los tres primeros pertenecen a api/admin/products/. |
| usuario/index.php | A/C/I | Media por sesión; conservar menú y navegación. |
| usuario/perfil.php, pedidos.php, reservas.php, promociones.php | A/B/C/H | Entradas de las vistas UX; media/alta según lectura/escritura. |
| includes/views/profile-ux.php, user-data-ux.php, user-reservations-ux.php | A/B/C/H | Vistas activas privadas; no transportar colecciones completas al navegador para filtrarlas. |
| admin/index.php, actividad.php, dispensador.php, pedidos.php, productos.php, promociones.php, reportes.php, reservas.php, usuarios.php | A/B/C/D/H | Entradas administrativas; conservar protección y flujo a vistas activas. |
| includes/views/admin-dashboard-ux.php, admin-activity-ux.php, admin-module-ux.php, admin-products-ux.php, admin-reservations-ux.php, reports-ux.php | A/B/C/D/H | Media/alta: datos privados, métricas, formularios; reports-ux no genera PDF. |
| includes/views/admin-dashboard-live.php, admin-data-live.php, reports-live.php | A/B/C/D/H | Vistas anteriores sin referencia desde las entradas activas revisadas; no borrarlas ni migrarlas antes que las UX. |
| includes/views/profile-live.php, user-data-live.php | A/B/C/H | Vistas anteriores; conservar como referencia. |

F: no hay PHP que genere PDF actualmente. G: no hay PHP que acceda realmente a MySQL. Las referencias/enlaces a documentos PDF no equivalen a generación.

## 7. Riesgos e incompatibilidades

1. Hosting estático no ejecutará estos PHP. No publicar la raíz actual como salida estática: contiene backend y dependencias. Crear una salida pública seleccionada en la fase de migración.
2. Las sesiones actuales almacenan roles: requireUser/requireAdmin consultan sesión, sin releer bloqueo/rol en cada lectura. Las escrituras administrativas sí revalidan. Revisar expiración/revocación al migrar y probar el caso de usuario bloqueado durante una sesión abierta.
3. El servicio consulta colecciones completas y se detiene al alcanzar aproximadamente 3000 documentos; los filtros y reportes pueden resultar parciales al crecer. Reemplazar por consultas paginadas y acotadas por usuario/fecha conservando resultados.
4. Mover lecturas de Admin SDK a Web SDK cambia el modelo de permisos. Las reglas actuales no están en esta copia ni se inspeccionaron en consola. No habilitar accesos cliente hasta probar reglas y compatibilidad con app/ESP32.
5. Hay código heredado después de `require ...; return;` en entradas como productos.php y registro.php, y vistas anteriores live. Migrar la ruta activa, no la maqueta inalcanzable.
6. El README heredado contiene estados contradictorios (contacto, productos, auditoría, reportes). Este informe describe el código observado; el historial documental se conserva identificado como tal.
7. El límite SMTP depende de sesión y puede eludirse creando otra. Un endpoint público futuro necesitará control de abuso compartido sin alterar el envío legítimo.
8. Detección HTTPS de sesión depende de `$_SERVER['HTTPS']`; revisar configuración si se conserva PHP detrás de proxy. Conservar cookies seguras y CSRF donde corresponda.
9. Mantener rutas canónicas de avatar `assets/avatares/...` en datos; la interfaz las adapta a `assets/img/avatares/...`. No renombrar datos por diferencias de ruta física.
10. Mantener acentos/mayúsculas exactos de archivos al pasar de Windows a hosting. Comprobar recursos, audio, video y enlaces institucionales en móvil. QR heredados son assets conservados, no URL pública definitiva certificada.

## 8. Arquitectura propuesta y orden

GitHub almacena fuentes. Firebase Hosting publica exclusivamente HTML/CSS/JS y assets, con HTTPS. Firebase Authentication mantiene identidades. Firestore/RTDB conservan contratos existentes; usar lecturas Web solo cuando las reglas lo permitan. Backend seguro para operaciones privilegiadas, auditoría, invariantes de reservas/productos y correo. Reutilizar PHP transitoriamente en Cloud Run es una opción a evaluar para evitar una reescritura masiva; Cloud Functions es otra opción para funciones acotadas.

Fundamento oficial: [Firebase Hosting](https://firebase.google.com/docs/hosting), [integración de funciones](https://firebase.google.com/docs/hosting/functions), [reglas de seguridad](https://firebase.google.com/docs/rules). No se configuraron ni desplegaron estos servicios en esta fase.

Primer lote recomendado, todavía sin convertir:

1. `includes/header.php` y `nosotros.php`: piloto estático, misma apariencia.
2. `info.php`: contenido institucional y enlaces.
3. `includes/promotions-carousel.php` e `index.php`: mismas campañas y assets, sin atribuir vigencia dinámica a imágenes locales.
4. `dispensar.php`: conservar explícitamente su alcance visual.
5. Extraer composición de `includes/navbar.php` y `includes/footer.php` con tratamiento explícito de sesión, rutas y scripts; no perder login/logout.

Después: catálogo (`productos.php`/products-live.php) y promociones con contrato de lectura autorizado; autenticación/perfil; reservas y administración; correo con backend equivalente. Cada lote requiere comparación visual y funcional. No convertir contacto a una página que aparente enviar pero no envíe.

## 9. Verificaciones y límites

- Los cinco JavaScript pasaron `node --check`.
- No hay PHP ni Composer disponibles en PATH ni en las ubicaciones locales comunes comprobadas: no se pudo ejecutar lint PHP, servidor, instalación o comprobación de plataforma Composer.
- No se halló suite de pruebas propia. No se realizaron pruebas de producción ni solicitudes a Firebase/SMTP.
- Se comprueban exclusiones Git y hashes de fuentes/assets para confirmar que la preparación no alteró la aplicación.
- Git sin commits ni staging; remoto correcto, sin push. Los blobs y temporal preexistentes se conservaron.

## QUÉ DEBE VERIFICAR EDUARDO

1. Abrir esta copia y confirmar que el servidor local apunta a `C:\Proyectos\chichej-web`, no a servidor-linux.
2. Con PHP compatible y Composer disponibles, ejecutar `composer install` y `composer check-platform-reqs`, y revisar sintaxis de todos los PHP propios con `php -l`.
3. Definir variables en el proceso PHP con valores oficiales; cuenta de servicio fuera del repositorio y del directorio público. No pegar contraseñas en ejemplos ni en Git.
4. Abrir Inicio, Nosotros, Información, Productos y Dispensar; comparar navbar, colores, logos, formularios y responsive en escritorio y celular. Revisar audio/video y enlaces.
5. Con cuentas de prueba, verificar login, logout, recuperación, perfil y bloqueo. Un visitante no debe acceder a usuario/admin y un cliente no debe acceder a admin.
6. En un entorno de pruebas controlado, verificar reservas propias y transiciones admin; productos y auditoría. Confirmar que la app y ESP32 siguen usando los mismos contratos.
7. Enviar un único mensaje de contacto de prueba y confirmar recepción SMTP; PDF y dispensado real deben seguir sin ofrecer una operación inexistente.
8. Revisar `git status --short` y `git remote -v`; antes del primer commit/push comprobar que no se incluyan secretos ni vendor. Este trabajo no publicó archivos.
9. Tras validar el piloto estático, continuar por lotes. Comprobar Wi-Fi/datos móviles y generar QR únicamente cuando haya URL HTTPS pública definitiva.
