# Fase 6A: Mi Cuenta y Perfil, exclusivamente consulta

Fecha: 19/09/2026. Git inicial limpio en main, sincronizado con origin/main, commit `df591d685ad0b63fec49e4d0f5fa71db28a9cf22`. Único remoto fetch/push: `https://github.com/Andrux88Felius/chichej-web.git`.

Eduardo confirmó previamente Fase 5B con una cuenta real: creación Auth/perfil, rol cliente, persistencia, logout, nuevo ingreso y recuperación/cambio de contraseña correctos. Estas son pruebas comunicadas por Eduardo; Work no utilizó sus credenciales.

## Original analizado

`usuario/index.php` protege mediante requireUser y presenta bienvenida y tarjetas Perfil, Pedidos, Reservas y Promociones. `usuario/perfil.php` delega en `includes/views/profile-ux.php`; el código que aparece después de return es histórico e inactivo. Se revisaron esa vista, `includes/auth.php`, el helper de perfiles, los estilos de portal/perfil y el adaptador Firebase portable existente.

La vista PHP activa lee `usuarios/{UID de sesión}` en RTDB y además consulta pedidos, reservas y mensajes Firestore para historial, promociones y metas. Muestra nombre, email, rol, teléfono y avatar; permite editar nombre/teléfono/avatar, enviar recuperación y ver progreso derivado de compras. No se trasladaron esos formularios, envíos ni lecturas comerciales. No hay dirección como campo del formulario de perfil activo; no se inventó. El UID original procede de la sesión PHP verificada; no del formulario.

El diseño original incluye portal-hero, sidebar de perfil, tarjetas, navegación, footer, avatar circular y adaptación de columnas a pantallas pequeñas. Se conservaron esas clases y recursos. PHP, servicios y assets originales permanecen intactos.

## Estructura portable

- `public/usuario/index.html`: Mi Cuenta, identidad y datos propios, acceso a Perfil; tarjetas Pedidos, Reservas y Promociones deshabilitadas.
- `public/usuario/perfil.html`: ficha de consulta sin inputs ni formularios editables. “Editar perfil” permanece deshabilitado.
- `account-data.js`: selección y normalización de campos opcionales, fecha y avatar.
- `auth-guard.js`: suscripción reutilizable al estado ya validado de Firebase; permite mostrar solo el perfil de esa sesión.
- `account-view.js` y `account-ui.js`: representación mediante textContent, limpieza de datos, avatar y montaje del guard.
- `public/assets/img/avatares/`: diez copias exactas de avatar1–9 e invitado del proyecto original.

Se ampliaron `auth-state.js` para transportar los campos de consulta seleccionados y `auth-view.js` para habilitar Mi cuenta y resolver logout desde subdirectorios. No se agregó otra lectura Firebase: se reutiliza el único perfil que ya lee `auth-firebase.js`. Las seis páginas anteriores incorporan Mi cuenta únicamente con sesión válida. También se actualizaron CSS portable, README, check-static y el servidor local para servir `/usuario/` como índice y redirigir `/usuario` a `/usuario/`. No se cambió firebase.json ni configuración remota.

## Guard, UID, carga y errores

Las páginas contienen desde el HTML `data-account-content hidden`; ningún dato personal viene incrustado. Muestran “Comprobando sesión…” antes de resolver Auth y “Cargando tu perfil…” durante la lectura. El guard consume createAuthState, cuyo adaptador usa onAuthStateChanged del SDK. El único UID de lectura sigue siendo `user.uid` emitido por Authentication y la única ruta sigue siendo `usuarios/{uid}`.

No se usa query string, UID oculto, formulario ni almacenamiento local para seleccionar perfiles. Cambiar `?uid=...` no cambia la consulta. No se consulta la lista de usuarios, pedidos, reservas o mensajes. No se expone el UID completo en la ficha.

Si el estado es anónimo, location.replace lleva a `../login.html`. Ante perfil ausente, rol inválido, bloqueo o lectura fallida, se conserva la lógica Fase 5A: no se entrega un perfil válido, se intenta signOut y aparece un mensaje accesible sin stack trace. Error de red/permission-denied comparten un aviso comprensible de que no pudo verificarse el perfil. La lectura tiene el límite de espera existente de 15 segundos. Si falla signOut, se mantienen ocultos los datos y el cierre puede reintentarse desde la cabecera.

No se migró ni cambió el mecanismo de persistencia de Firebase; no se guardan manualmente tokens o contraseñas. La consulta se revalida al cargar cada página; no hay una nueva suscripción continua al campo bloqueado ni se promete detectar cambios remotos instantáneamente mientras una página permanece abierta. Sigue aplicándose el comportamiento get del SDK, incluida su posible caché durante un fallo de conexión.

## Campos y compatibilidad histórica

| Campo mostrado | Fuente y tratamiento |
| --- | --- |
| Nombre completo | `nombre` del perfil; trim; si falta, “No registrado”. Navbar mantiene su respaldo por correo existente. |
| Correo | Authentication, con respaldo `email` del perfil, igual que la sesión portable previa. |
| Rol | `rol` validado y normalizado con trim; se muestra su valor real. |
| Teléfono | `telefono` como texto no vacío o número histórico finito; no se exige ni se escribe si falta. |
| Fecha de registro | `fechaRegistro`, milisegundos numéricos o cadena numérica válida, presentada como fecha en America/La_Paz. Ausente/inválida: “No registrado”. |
| Estado | Activo solo después de validar que la cuenta no está bloqueada; no crea un campo remoto. |
| Muestras disponibles/utilizadas | `muestrasGratisDisponibles` y `muestrasGratisUtilizadas`, solo enteros reales no negativos. Cero se muestra como cero; ausencia/valor inválido: “No registrado”. |
| Avatar | Nombre de archivo reconocido de `avatarPath`, limitado a avatar1–9 e invitado locales. |

Se conserva exactamente la regla histórica: bloqueado ausente, null, vacío, false, cero o cadena false normalizada no bloquean; true y valores desconocidos se rechazan según el helper portable existente. No se alteran perfiles para agregar campos faltantes.

La vista PHP activa reduce avatarPath a basename y acepta avatar1–9, usando invitado como respaldo. Se mantiene ese comportamiento: rutas históricas `assets/avatares/avatarN.png`, nombres simples o una ruta con basename conocido se resuelven a la copia local. No se solicitan URLs remotas arbitrarias. Un archivo desconocido usa invitado; si la imagen falla, se intenta invitado y, si también falla, se oculta la imagen sin bucle. No hay selección ni upload de avatar.

No se resuelve la diferencia comercial entre PHP y Flutter sobre muestras iniciales. Las cuentas web con contadores ausentes muestran “No registrado”, no un beneficio inventado ni cero supuesto. Los enteros existentes se presentan literalmente. No se conceden regalos, se calculan premios ni se migran metas derivadas de compras.

## Cliente y admin_principal

requireUser del original permite cualquier sesión autenticada válida, también admin y admin_principal. Se conserva el acceso de esos roles a **su propio perfil** de consulta, mostrando el rol original y sin degradarlo. Mi Cuenta no es un dashboard administrativo y no expone información de terceros. No hay redirección a PHP ni ampliación de permisos.

El frontend controla presentación y navegación; no sustituye reglas RTDB. Los accesos reales propios de las fases previas fueron confirmados por Eduardo. En esta fase se verificaron origen de UID, ruta única, ausencia de selección por URL y rechazo anónimo. No se certifica que las reglas remotas rechacen todas las consultas de terceros: no se usaron credenciales, no se consultaron perfiles ajenos y no se inspeccionaron/cambiaron reglas. Eduardo debe confirmar los permisos efectivos en su prueba personal; cualquier auditoría o cambio de reglas requiere otro alcance.

## Logout e historial

Desde Mi Cuenta/Perfil, signOut limpia la vista por el cambio de estado y el cierre exitoso vuelve a `../index.html`. Un estado anónimo sobre una página privada también redirige a Login. Antes de que una página salga al historial, pagehide oculta el contenido y vacía nombre, correo, teléfono, rol, contadores, fecha e imagen de la ficha, además de identidad de cabecera/footer. Si el navegador restaura desde bfcache, se mantiene oculta y se recarga para comprobar de nuevo Auth. No se reutiliza un perfil guardado en almacenamiento propio.

La limpieza de pagehide y logout se comprobó en navegador con un adaptador local. El ciclo completo Atrás/F5 después de cerrar una sesión Firebase real queda pendiente para Eduardo; no se presenta una simulación como prueba de credenciales reales.

## Pruebas y resultados

- `check-static.mjs`: ocho páginas y 75 recursos HTTP 200, anclas correctas, raíz Inicio y cuatro rutas privadas del servidor no expuestas. Ahora resuelve referencias relativas según el directorio de cada HTML.
- `check-account.mjs`: guard, identidad autenticada, roles cliente/admin/admin_principal, bloqueo, opcionales, avatar, limpieza, rutas `/usuario/` y ausencia de escrituras/UID seleccionable. Sin credenciales ni conexión Firebase; solo HTTP local para rutas.
- Regresiones `check-auth.mjs`, `check-register.mjs` y `check-products.mjs` correctas. Los flujos anteriores autorizados de Registro/recuperación permanecen intactos; no se ejecutaron en esta fase.
- Navegador real sin sesión: `/usuario/` y `/usuario/perfil.html?uid=otra-persona` terminan en Login, sin mostrar la ficha. Sin errores/advertencias de consola observados.
- Navegador con adaptador simulado sin Firebase: ambas páginas a 360, 390, 430, 768, 1024 y 1280 px, con nombre y email largos, sin scroll horizontal; avatar local cargado. Rol admin_principal preservado. Bloqueado muestra aviso y no muestra contenido. Logout y pagehide dejan textos personales vacíos y eliminan src de avatar.
- Etiquetas semánticas dt/dd, títulos, navegación privada, botones deshabilitados y mensajes role=status. El teclado virtual físico y la sesión real deben revisarse manualmente.
- Los archivos temporales de pruebas se retiraron antes del commit. No se almacenaron contraseñas ni se generaron logs o secretos.

## Cero escrituras y alcance protegido

La nueva área solo consume el perfil ya leído por el adaptador de sesión. No incorpora set/update/push/remove, escrituras Firestore, upload, reset de contraseña ni modificaciones de Authentication; únicamente el signOut habitual. No hubo escrituras Firebase durante las pruebas, nuevas cuentas, cambios de roles/reglas, firebase deploy o QR. No se tocó servidor-linux, CHICHEJ/app, CHICHEJ/esp32 o CHICHEJ/firebase. Tampoco se modificaron los PHP o recursos originales de esta copia.

## QUÉ DEBE VERIFICAR EDUARDO

1. Iniciar `node scripts/serve-static.mjs` si no está activo; usar esta copia del proyecto. Abrir `http://localhost:8080/usuario/` sin sesión y confirmar Login.
2. Ingresar personalmente con cliente, sin compartir contraseña. Abrir Mi cuenta desde la navegación autenticada.
3. Confirmar nombre, correo, rol cliente, avatar, teléfono/fecha y contadores disponibles contra su propio perfil. Ausentes deben decir “No registrado”.
4. Abrir Perfil, pulsar F5, navegar por páginas públicas y regresar. No hay campos editables ni guardado.
5. Cerrar sesión desde el área privada; volver mediante Atrás y F5. No deben aparecer datos de la sesión cerrada; debe solicitarse Login.
6. Repetir con admin_principal: consulta de su propio perfil, rol sin cambios, sin dashboard admin ni PHP.
7. Confirmar que parámetros URL no seleccionan otro usuario. No consultar perfiles ajenos como prueba improvisada; cualquier revisión adicional de reglas debe ser autorizada.
8. Ejecutar `node scripts/check-static.mjs`, `node scripts/check-auth.mjs`, `node scripts/check-products.mjs`, `node scripts/check-register.mjs` y `node scripts/check-account.mjs`.
9. Revisar responsive, Console y Network en su sesión real sin divulgar tokens. Confirmar que las páginas privadas solo leen su nodo y no escriben.
10. Confirmar commit `feat: add private account and profile views`, push a main de Andrux88Felius/chichej-web y Git limpio, además de proyectos protegidos intactos.

El hash efectivo y la confirmación del push se entregan en el resultado final. Próximo paso: validación manual de estas vistas. Edición de perfil/avatar y cualquier módulo comercial o administrativo requieren una fase posterior; la diferencia de muestras continúa sin modificarse.
