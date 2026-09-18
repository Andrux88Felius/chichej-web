# Fase 5B: Registro y recuperación de contraseña

Fecha: 18/09/2026. Proyecto intervenido: únicamente chichej-web. Git inicial limpio, `main` en `ba13aa0a9815fb884cc594f4c8b75aa5f1fd942a`; único remoto fetch/push `https://github.com/Andrux88Felius/chichej-web.git`.

## Estado previo confirmado por Eduardo

Eduardo comunicó pruebas reales satisfactorias de Fase 5A: cliente con login, perfil, rol, F5, navegación persistente y logout; administrador con rol real **admin_principal**, perfil, F5 y logout. No se asume que todos los administradores tengan rol `admin`. Esa confirmación es del usuario; esta fase no repitió accesos con sus contraseñas.

## Registro original y comparación con Flutter

`registro.php` delega inmediatamente en `includes/views/register-ux.php`; el HTML antiguo “Registro web pendiente” que aparece después del return no es el formulario activo. La vista activa pide nombre completo, correo, contraseña y confirmación. No pide apellido separado, teléfono, UID ni rol. Nombre: 2–80 caracteres; contraseña PHP: mínimo 6; confirmación debe coincidir.

`assets/js/firebase-auth.js` crea Auth y envía token/nombre a `api/auth/register-profile.php`. El endpoint verifica token y CSRF; deriva UID y correo de Auth. `services/FirebaseReadService.php::createCustomerProfileIfMissing` usa una transacción RTDB para crear solo si el nodo no existe. El original acepta una cuenta ya existente tras autenticarla para completar un perfil faltante; **esa adopción no se migra**, porque la autorización de esta fase se limita a usuarios recién creados. Un correo ya registrado se dirige a Login/recuperación, sin tocar su perfil.

Se leyeron, sin modificaciones, los archivos Flutter `lib/screens/register_page.dart`, `lib/screens/login_page.dart`, `lib/models/user_model.dart` y `lib/providers/user_provider.dart`. Flutter usa el mismo proyecto, Authentication y RTDB `usuarios/{uid}`. Reconoce `cliente`, `admin` y `admin_principal`; el UID procede de Auth/la clave del nodo. Nombre, email, rol y avatar son comunes. Bloqueo es opcional históricamente. Teléfono y contadores son opcionales según el consumidor; el modelo y Login de Flutter interpretan contadores ausentes como cero.

## Perfil nuevo: seis campos, igual que el registro PHP

| Campo | Valor/origen |
| --- | --- |
| `nombre` | Nombre completo del formulario, trim, 2–80 caracteres. |
| `email` | Correo devuelto por la cuenta recién creada en Auth. |
| `rol` | Literal interno `cliente`; no se toma del formulario. |
| `avatarPath` | `assets/avatares/invitado.png`, valor original compartido. |
| `bloqueado` | false, igual que PHP. La regla histórica “ausente = false” sigue intacta para otros perfiles. |
| `fechaRegistro` | `serverTimestamp()` RTDB, milisegundos del servidor; mismo tipo final que el timestamp numérico PHP. |

El UID es la clave `usuarios/{uid}`, no un campo inventado. No se agregan contraseña, apellido, teléfono, tokens ni campos administrativos. No se usan Firestore ni estructuras alternativas para perfiles.

**Diferencia comercial existente:** Flutter inicializa `muestrasGratisDisponibles: 1` y `muestrasGratisUtilizadas: 0`; PHP no inicializa ninguno. No se encontró `regalosDisponibles` en el registro activo. Se preserva el contrato web de seis campos, sin conceder muestras. Flutter puede leerlo y mostrará cero por sus valores predeterminados. La compatibilidad estructural no significa igualdad de beneficio inicial; unificar esa política requiere una decisión posterior, no se alteran promociones ni usuarios actuales. El inicio real de la nueva cuenta en Flutter queda pendiente.

La contraseña web nueva usa los requisitos ya existentes en Flutter: 8 caracteres, mayúscula, minúscula, número y símbolo; Firebase puede imponer requisitos adicionales y sus rechazos se muestran de forma comprensible. No se cambia la contraseña de ninguna cuenta existente ni las políticas remotas.

## Flujo Auth + perfil y consistencia

1. Validar campos y comprobar que no haya sesión principal abierta.
2. Usar createUserWithEmailAndPassword en una instancia Auth de preparación, con **la misma configuración pública Web** y persistencia exclusivamente en memoria.
3. Guardar en memoria únicamente el objeto User recién devuelto y el perfil propuesto; no adoptar usuarios anteriores ni aceptar un UID suministrado por el formulario.
4. Ejecutar runTransaction exclusivamente en `usuarios/{nuevoUID}`: si el nodo es null, devolver el perfil fijo; si existe cualquier valor, abortar sin reemplazarlo. `applyLocally: false` evita publicar una escritura provisional.
5. Confirmar el resultado devuelto por la transacción, incluyendo rol cliente, campos exactos y fecha numérica. Un perfil ya compatible permite concluir un reintento sin sobrescribirlo; uno diferente se conserva y se informa el conflicto.
6. Solo tras confirmar perfil, iniciar la sesión principal mediante el flujo de Fase 5A y persistencia local. Liberar la sesión temporal. Si hay otra sesión principal que apareció durante el proceso, no sustituirla.

La instancia temporal evita la carrera donde onAuthStateChanged del login detectaría el nuevo usuario antes de existir el perfil y lo cerraría. No duplica configuraciones, proyectos ni identidades. El login principal vuelve a leer/validar el perfil antes de mostrar la sesión. No se añaden PHP, sesiones paralelas o almacenamiento manual de tokens. Cliente permanece en la web pública; no se crean áreas privadas.

## Fallos parciales y rollback limitado

Auth y RTDB no ofrecen una transacción distribuida. No se promete atomicidad absoluta desde un navegador.

- Si Auth rechaza el correo ya registrado, no se intenta iniciar sesión, escribir ni eliminar esa cuenta.
- Si el primer intento de perfil recibe una denegación definitiva de permisos, se intenta deleteUser **solo del objeto devuelto por la creación de esta ejecución**, comprobando también identidad con currentUser de la instancia temporal. Nunca se elimina por UID arbitrario ni desde la sesión principal.
- Si ese rollback termina correctamente, se informa que la cuenta nueva se anuló y que debe revisarse el problema de permisos antes de reintentar. No se cambian reglas.
- Un fallo de red puede ocultar una escritura confirmada. No se borra Auth en ese caso: se mantiene el nuevo UID en memoria y aparece “Reintentar perfil”. La transacción vuelve a comprobar el mismo nodo sin reemplazarlo. Si hubo incertidumbre previa, una posterior denegación tampoco permite rollback destructivo.
- Si falla la eliminación o no puede confirmarse el resultado, se conserva el estado parcial y se indica mantener la página abierta/contactar administración. No se almacena la contraseña para reintentar. Después de completar un reintento, se solicita Login normal.
- Si se pierde la respuesta de la propia creación Auth antes de recibir el objeto User, no hay identidad demostrablemente nueva sobre la que efectuar rollback: se informa la incertidumbre y no se adopta una cuenta existente automáticamente.
- Si el perfil ya se confirmó pero el acceso principal falla, cuenta y perfil se conservan; se ofrece Login. No se hace rollback por fallos de una etapa posterior.
- Durante una operación o estado parcial se solicita al navegador advertir antes de abandonar la página. Cerrar/recargar finalmente pierde el estado temporal; un caso incompleto que persista requiere revisión administrativa externa. No se implementó un servicio backend de conciliación ni se modifican cuentas existentes para reparar esos casos.

## Recuperación y privacidad

Se integró un formulario desplegable en Login, respetando el original. Usa sendPasswordResetEmail del SDK modular y la configuración Web existente. No hay SMTP propio, envío de contraseñas, reset manual ni URL de retorno inventada. Firebase gestiona el enlace y su página de acción configurada.

Éxito, usuario inexistente o cuenta deshabilitada muestran la misma confirmación: “Si el correo corresponde a una cuenta válida, recibirás instrucciones para restablecer tu contraseña.” Formato inválido, conexión y exceso de intentos tienen mensajes útiles sin códigos internos. Se impiden envíos simultáneos y, después de confirmar, se deshabilita el formulario para evitar repeticiones accidentales. No se envió ningún correo real durante esta implementación.

## Navegación y seguridad

Las seis páginas tienen Crear cuenta e Iniciar sesión sin autenticar; los enlaces de creación se ocultan con sesión válida y Registro oculta su formulario. Se conserva identidad y Cerrar sesión. Recuperación y enlaces de Registro funcionan desde Login. No se habilitan módulos pendientes.

El controlador construye expresamente los seis campos; ignora campos extra como rol o UID introducidos manipulando el formulario. La única escritura del adaptador es la transacción del perfil nuevo. **La seguridad definitiva no depende del frontend:** reglas/backend deben exigir identidad propia, creación exclusiva, rol cliente y campos autorizados. DevTools puede ejecutar otro cliente Firebase; el código web no sustituye esas reglas. No se inspeccionaron ni modificaron reglas remotas, y los permisos de creación transaccional siguen pendientes de prueba manual. Una transacción necesita permisos de lectura además de escritura.

## Archivos

Creados: `public/registro.html`, `public/assets/img/maserado4.jpeg` (copia exacta del original), módulos `register-state.js`, `register-firebase.js`, `register-view.js`, `register-ui.js`, `recovery-state.js`, `recovery-firebase.js`, `recovery-view.js`, `recovery-ui.js` bajo `public/assets/js/`, `scripts/check-register.mjs` y este informe.

Modificados: las cinco páginas públicas anteriores, `public/assets/css/pilot.css`, `scripts/check-static.mjs`, `scripts/check-auth.mjs` y README. El check Auth mantiene prohibiciones generales y permite exclusivamente las operaciones nuevas autorizadas dentro de sus adaptadores concretos. Configuración Firebase Web, PHP, estilos y recursos originales no se modificaron.

## Verificaciones realizadas y límites

- `check-static.mjs`: seis páginas, 59 recursos HTTP 200, anclas válidas, raíz Inicio y cuatro rutas privadas 404.
- `check-auth.mjs`: regresión de roles, admin_principal, bloqueo histórico, perfil propio, doble envío, respuestas tardías y logout; controles estáticos actualizados por alcance.
- `check-products.mjs`: catálogo, normalización histórica, filtros y rutas intactos.
- `check-register.mjs`: validación, seis campos, rol fijo, no sobrescritura, exclusión de doble envío, cuenta preexistente, rollback restringido, fallo de rollback, reintentos inciertos y privacidad de recuperación. Solo adaptadores locales, sin Firebase/red/cuentas/correos.
- Navegador: Registro carga el SDK y habilita el formulario sin crear cuentas; Login abre recuperación y valida correo obligatorio. No se observaron errores ni advertencias de consola.
- Registro y Login con recuperación abierta comprobados a 360, 390, 430, 768, 1024 y 1280 px; sin scroll horizontal. Las otras cuatro páginas también comprobadas a 360 y 1280 tras agregar navegación. Menú móvil abre y Escape cierra.
- Simulaciones locales de UI: registro exitoso muestra rol cliente, limpia contraseñas y oculta Crear cuenta; fallo parcial reintenta una sola identidad sin conservar contraseña; recuperación de un usuario simulado inexistente muestra el mensaje neutro y bloquea doble envío. No se conectan esos dobles a Firebase. Se eliminaron todos los archivos temporales de simulación.
- Labels, autocomplete name/email/new-password, confirmación, foco, Enter y mensajes vivos accesibles. Teclado virtual de dispositivo físico pendiente.

No se creó ni eliminó ninguna cuenta real, ni se escribieron perfiles o enviaron correos desde Work. Prueba real de reglas, fecha remota, creación Auth/perfil, persistencia tras registro, correo de recuperación y acceso móvil reservada a Eduardo. No se validó el rollback contra producción mediante cuentas de prueba.

## QUÉ DEBE VERIFICAR EDUARDO

1. Ejecutar `node scripts/serve-static.mjs` y abrir `http://localhost:8080/registro.html`; reutilizar el servidor si ya corre en 8080.
2. Crear **UNA** cuenta con un correo propio. Introducir personalmente la contraseña; no compartirla con Work/ChatGPT, scripts ni documentación.
3. Confirmar en Firebase Authentication que existe la cuenta y comprobar en RTDB `usuarios/{eseUID}` los seis campos, rol **cliente**, bloqueado false, email/nombre correctos y fecha numérica. No debe tener rol administrativo; no debe sobrescribir otro perfil.
4. Confirmar sesión activa, navegación y F5. Cerrar sesión y volver a entrar por Login con la cuenta nueva. Si es posible, probarla también en Flutter; los contadores ausentes se interpretarán como cero.
5. Si falla perfil/permisos, leer el mensaje. Si existe estado parcial, conservar la página para reintentar; no crear otra cuenta ni cambiar reglas automáticamente. Si persiste, revisar el caso con administración. No forzar fallos modificando usuarios existentes.
6. Desde Login abrir “¿Olvidaste tu contraseña?”, usar ese correo, confirmar mensaje neutro y recepción (incluido spam). Eduardo debe completar personalmente el enlace seguro de Firebase si decide cambiar la contraseña y comprobar el acceso posterior.
7. Ejecutar `node scripts/check-static.mjs`, `node scripts/check-auth.mjs`, `node scripts/check-products.mjs` y `node scripts/check-register.mjs`.
8. Revisar responsive y teclado móvil, Console y Network sin compartir capturas que revelen tokens/credenciales.
9. Confirmar commit `feat: migrate registration and password recovery`, push exclusivamente a `origin/main` de Andrux88Felius/chichej-web y `git status` limpio.
10. Confirmar servidor-linux, Flutter, ESP32 y demás proyectos intactos, sin cambios en usuarios existentes, productos, pedidos, reservas, reglas o despliegues.

## Cierre y próximo paso

No hubo firebase deploy, Hosting, QR, SMTP ni cambios de reglas. No se modificaron usuarios existentes, roles actuales o admin_principal. No se escribió fuera de chichej-web; Flutter se consultó únicamente para comparar contratos. No se migraron Perfil/Mi cuenta, Pedidos, Reservas, Promociones, Contacto, Dispensar, Admin, Reportes o PDF.

El hash efectivo y la confirmación del push se entregan en la respuesta final, evitando un commit recursivo de su propio hash. Próximo paso: prueba manual de una cuenta y correo controlados por Eduardo, y decisión posterior sobre la diferencia de muestras iniciales. Cualquier cambio de reglas, conciliación de cuentas incompletas o fase siguiente necesita su alcance correspondiente.

Referencias oficiales: [creación Auth](https://firebase.google.com/docs/auth/web/password-auth), [gestión y recuperación de usuarios](https://firebase.google.com/docs/auth/web/manage-users), [transacciones RTDB](https://firebase.google.com/docs/database/web/read-and-write), [referencia de runTransaction](https://firebase.google.com/docs/reference/js/database).
