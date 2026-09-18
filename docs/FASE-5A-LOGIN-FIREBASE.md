# Fase 5A: Login, sesión y cierre con Firebase Web

Fecha: 18/09/2026. Alcance: únicamente `chichej-web`, sin despliegue.

## Estado inicial y original analizado

Git comenzó limpio, en `main`, sincronizado con `origin/main`, commit `be15b58b966cb5e22060609f24e18601353c5d99`. El único remoto, tanto fetch como push, es `https://github.com/Andrux88Felius/chichej-web.git`.

Se revisaron `login.php`, `assets/js/firebase-auth.js`, `api/auth/session-login.php`, `includes/auth.php`, `includes/firebase-profile.php`, `config/firebase.php`, `logout.php` y los estilos originales. No se modificaron estos archivos.

El original inicia sesión con Firebase Auth en el navegador, selecciona persistencia local o de pestaña según “Mantener sesión iniciada”, obtiene un ID token y lo envía a PHP. El servidor verifica el token mediante Kreait y deriva el UID; no confía en un UID o rol enviado libremente por el cliente. Lee el perfil en RTDB, valida bloqueo y rol, regenera la sesión PHP y guarda UID, nombre, email, rol y avatar. Cliente se dirige al área `usuario/`; `admin` y `admin_principal` al área `admin/`. El logout combina signOut y un POST protegido por CSRF que destruye sesión PHP/cookie. Registro y recuperación existen en el original, pero no se trasladaron.

## Contrato del perfil confirmado en el código

| Dato | Origen y tratamiento portable |
| --- | --- |
| UID | Usuario emitido por Authentication; formato histórico de 1–128 letras, números, guion o guion bajo. |
| Perfil | Solo RTDB `usuarios/{uid}`; no Firestore ni listado de usuarios. |
| Nombre | `nombre`, con trim; si falta, correo o “Usuario”. |
| Correo | Authentication primero; `email` del perfil como respaldo. |
| Rol | `rol`, con trim y comparación sensible a mayúsculas: `cliente`, `admin`, `admin_principal`. |
| Bloqueo | `bloqueado`; ausente, null, cadena vacía, false, 0, "0" y cadena "false" normalizada significan no bloqueado. true, 1, "1", "true" y otros valores no reconocidos se rechazan, igual que el helper PHP. Una cadena de espacios no equivale a campo ausente. |
| Avatar y demás campos | El original usa `avatarPath`; esta fase no lo representa ni modifica. Solo conserva en memoria los datos mínimos de identidad. |

Un perfil ausente, rol no permitido, bloqueo o lectura fallida no genera un estado web autenticado. Se intenta signOut y se presenta un mensaje comprensible. Si el propio signOut falla, se oculta toda identidad y permanece un botón para reintentar la salida; no se anuncia una sesión válida ni un cierre exitoso.

## Implementación y archivos

Creaciones:

- `public/login.html`: diseño original de imagen/formulario, logotipo, navbar, footer, etiquetas, autocomplete, ver/ocultar contraseña y avisos accesibles.
- `public/assets/img/maserado3.jpeg`: copia exacta de la imagen original del login.
- `public/assets/js/auth-state.js`: normalización compatible, estado compartible, validación de perfil, errores, exclusión de envíos simultáneos y descarte de lecturas tardías.
- `public/assets/js/auth-firebase.js`: adaptador del SDK oficial para Auth y lectura propia RTDB.
- `public/assets/js/auth-view.js`: representación de sesión y formulario; separada para comprobar estados con un adaptador local sin cuentas.
- `public/assets/js/auth-ui.js`: inicialización común de las cinco páginas.
- `scripts/check-auth.mjs`: pruebas locales sin red ni credenciales y controles de operaciones prohibidas.
- Este informe.

Modificaciones:

- `public/index.html`, `nosotros.html`, `productos.html`, `informacion.html`: enlaces a Login, estado de sesión, identidad mínima y cierre en cabecera/footer.
- `public/assets/js/firebase-config.js`: inicialización compartida de una sola aplicación; conserva exactamente la configuración pública Web suministrada y la versión 12.19.0. No se agregó measurementId, Analytics ni credenciales administrativas.
- `public/assets/css/pilot.css`: ajustes de formulario, foco, elementos ocultos y menú autenticado responsive. CSS original intacto.
- `scripts/check-static.mjs`: agrega Login a las cuatro páginas existentes.
- `README.md`: estado actual, ejecución y pruebas.

## Authentication, lectura y persistencia

El SDK modular utiliza getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut y setPersistence. La configuración y la aplicación se comparten con el catálogo. La persistencia marcada utiliza browserLocalPersistence; desmarcada, browserSessionPersistence. Firebase administra los tokens y su renovación: no se copian a almacenamiento propio y no se almacenan contraseñas manualmente.

Cada documento público recibe el estado del SDK y, si hay usuario, lee su perfil con `get(ref(database, 'usuarios/' + uid))`. No aparece la identidad hasta validar el resultado. Hay un límite local de 15 segundos para esperar el perfil; una respuesta posterior no puede restaurar una sesión descartada. El historial de navegación que restaura una página desde caché provoca recarga para volver a comprobar la sesión. La comprobación de perfil es por carga/cambio de usuario, no una suscripción continua a bloqueos. El SDK RTDB puede recurrir a su caché en una lectura get; esto no sustituye controles remotos.

Cliente, admin y admin_principal permanecen en la web pública. Login muestra la identidad y el rol normalizado, con acceso a Inicio. No hay redirecciones PHP ni paneles ficticios. Las futuras áreas de cuenta/administración deberán definirse en su fase; no se inventaron destinos HTML. El rol en JavaScript es presentación, no una frontera de autorización: las reglas Firebase y cualquier backend futuro deben seguir validando acceso.

Logout limpia inmediatamente la identidad visible, invalida lecturas pendientes, llama signOut y, solo si termina correctamente, navega a `index.html`. Los cambios de estado del SDK también actualizan otras páginas/pestañas activas.

## Errores, formulario y seguridad

Se muestran mensajes para correo inválido, credenciales incorrectas, cuenta deshabilitada, demasiados intentos, conexión, bloqueo, perfil no disponible, fallo de lectura y errores inesperados. Usuario inexistente y contraseña incorrecta comparten mensaje. No se imprimen errores completos ni contraseñas en consola.

El formulario deshabilita campos y envío mientras espera el SDK/autenticación/perfil. Hay exclusión de doble envío tanto en la vista como en el controlador. Tras un intento se vacía la contraseña y se restablece su ocultación. Sin JavaScript los campos permanecen deshabilitados. El método HTML es POST como defensa adicional; no existe envío nativo en el flujo implementado ni endpoint PHP.

Registro y recuperación aparecen expresamente pendientes. No se incluyen llamadas de creación de usuarios, recuperación, actualización de perfiles/usuarios, claims, transacciones o escrituras RTDB/Firestore. Los POST internos normales del protocolo de autenticación y lectura están autorizados por Eduardo; no son escrituras de datos de negocio.

## Pruebas realizadas

| Verificación | Resultado |
| --- | --- |
| `node scripts/check-static.mjs` | OK: 5 páginas, 49 recursos HTTP 200, anclas, raíz Inicio y cuatro rutas privadas 404. |
| `node scripts/check-products.mjs` | OK: compatibilidad, IDs, booleanos, precios, filtros, orden y rutas. |
| `node scripts/check-auth.mjs` | OK: roles, bloqueo ausente/histórico, perfil inválido, lectura denegada, doble envío, respuestas tardías, reintento, restauración simulada y fallo de logout; controles de SDK/escrituras/rutas. Sin cuentas ni red. |
| Navegador real, sin autenticar | SDK cargado; formulario disponible; ninguna advertencia/error de consola observado. Catálogo conservó sus 6 productos visibles mediante lectura real. |
| Responsive | Las cinco páginas comprobadas a 360, 390, 430, 768, 1024 y 1280 px, sin scroll horizontal. Login con foco y vista de 360 × 700 también comprobado. |
| Vista autenticada simulada | Cliente sin campo bloqueado y admin normalizado; nombre largo y salida visibles en seis anchos. Logout vacía nombres y solicita Inicio. Bloqueo/lectura denegada muestran sus avisos. Sin conexión Firebase en estas simulaciones. |
| Accesibilidad | Labels, autocomplete email/current-password, mensajes vivos, botones semánticos, foco visible y Enter con validación nativa de campos requeridos. Menú abre y Escape lo cierra. |
| Rutas y recursos | Referencias locales revisadas, 49 recursos locales correctos; sin llamadas PHP implementadas ni rutas físicas/IP privadas. No se inspeccionó tráfico de un login real. |

La página y el adaptador temporales de simulación se eliminaron; no forman parte de la entrega. No se emplearon contraseñas reales ni se crearon cuentas. No se hizo una lectura RTDB real de un perfil: requiere el inicio legítimo de Eduardo. Tampoco se certifica todavía persistencia real entre pestañas, token renovado o permisos de RTDB; las pruebas del controlador usan dobles locales. El teclado virtual de un teléfono físico queda pendiente (se verificaron campos y ancho en navegador de escritorio).

## QUÉ DEBE VERIFICAR EDUARDO

1. Ejecutar `node scripts/serve-static.mjs` desde este proyecto y abrir `http://localhost:8080/login.html`. Si el servidor ya está activo en 8080, reutilizarlo.
2. Ingresar personalmente una cuenta CLIENTE existente. No compartir la contraseña en prompts, scripts o informes.
3. Confirmar acceso, nombre y rol cliente. Recargar; navegar por Inicio, Nosotros, Productos e Información; comprobar continuidad de sesión.
4. Cerrar sesión, confirmar regreso a Inicio, desaparición de identidad y reaparición de Iniciar sesión. Comprobar también otra pestaña abierta.
5. Repetir con ADMIN existente; verificar rol admin y ausencia de redirección PHP. Si corresponde, repetir con admin_principal sin modificar la cuenta.
6. Si existe un perfil histórico sin `bloqueado`, confirmar acceso. No editar ni crear perfiles para esta prueba.
7. Revisar comportamiento con “Mantener sesión iniciada” marcado/desmarcado; comprobar recarga y navegación en el mismo origen.
8. Si aparece “No pudimos verificar tu perfil”, informar el resultado: las reglas RTDB podrían impedir lectura propia desde Web aunque PHP administrativo pudiera leerla. No cambiar reglas automáticamente.
9. No crear cuentas nuevas. Registro, recuperación y paneles siguen pendientes.
10. Ejecutar los tres checks indicados y revisar responsive, teclado móvil, Console y Network durante el login real. No compartir capturas con tokens o credenciales.
11. Confirmar el commit `feat: migrate login with firebase authentication` en `origin/main` y `git status` limpio después del cierre.
12. Confirmar que servidor-linux, Flutter, ESP32, configuración Firebase y reglas siguen sin modificaciones estructurales.

## Alcance protegido y cierre

Cero escrituras Firestore/RTDB realizadas en esta fase. No se ejecutaron operaciones de modificación de usuarios, perfiles, reglas o configuración remota. No hubo firebase deploy, publicación Hosting ni QR. Las futuras pruebas personales harán únicamente las operaciones normales de Authentication y lectura propia autorizadas.

No se escribió en servidor-linux, CHICHEJ/app, CHICHEJ/esp32 o CHICHEJ/firebase. Los PHP, recursos originales y configuración de despliegue de esta copia permanecieron intactos. El trabajo se limita a los archivos listados de chichej-web.

Commit previsto para este cierre: `feat: migrate login with firebase authentication`, exclusivamente en `origin/main` de Andrux88Felius/chichej-web. El hash y la confirmación efectiva del push se entregan en el resultado final para evitar un commit recursivo del propio hash. Próximo paso: validación manual de cuentas existentes y permisos propios; después, planificar Fase 5B (Registro/recuperación) solo con nueva autorización.

Referencias oficiales: [persistencia de Auth](https://firebase.google.com/docs/auth/web/auth-state-persistence), [observador de usuario](https://firebase.google.com/docs/auth/web/manage-users), [lectura RTDB con get](https://firebase.google.com/docs/database/web/read-and-write).
