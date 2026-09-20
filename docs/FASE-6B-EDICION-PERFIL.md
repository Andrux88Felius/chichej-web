# Fase 6B — Edición del perfil propio

## Alcance y origen

Se analizó `usuario/perfil.php`, que delega en `includes/views/profile-ux.php`, junto con `api/user/profile-update.php` y `services/FirebaseReadService.php::updateUserPersonalProfile`. El original edita **nombre, telefono y avatarPath** mediante actualización parcial de RTDB. No permite editar dirección ni introduce una fecha de actualización. Los originales PHP no se modificaron.

## Contrato de datos

Allowlist explícita e inmutable: `['nombre', 'telefono', 'avatarPath']`. La vista construye un objeto solo con los campos de esa lista cuyo valor cambió desde la apertura; tanto el controlador como el adaptador vuelven a filtrar y validar. Inputs añadidos mediante DevTools, campos heredados y claves con rutas se ignoran. Nunca se envía el objeto completo del perfil.

| Campo | Validación y representación |
| --- | --- |
| nombre | Texto, trim, entre 2 y 80 caracteres Unicode. |
| telefono | Opcional, trim, hasta 20 caracteres; números, espacios, +, paréntesis y guiones. Compatible con formatos locales e internacionales históricos. Los números históricos se presentan como texto. |
| avatarPath | Solo `assets/avatares/invitado.png` o `assets/avatares/avatar1.png` a `avatar9.png`. Se conserva la ruta histórica; las imágenes se muestran desde el catálogo local portable. |

No se incorporan `actualizadoEn` ni timestamps nuevos: la operación PHP original no los usa. Fecha de registro y contadores históricos siguen siendo de consulta. No se usa Storage, upload, base64 ni imágenes externas.

## Identidad y escritura

La única escritura nueva es `update(ref(database, 'usuarios/' + auth.currentUser.uid), payload)` con el mismo SDK modular y aplicación Firebase de las fases anteriores. No hay Firestore para perfiles, `set` completo, UID recibido como argumento, UID de URL/formulario/DOM ni almacenamiento manual de credenciales.

Al abrir, se lee y valida el perfil existente y se retiene internamente el objeto de identidad Auth. Antes de guardar se exige esa misma identidad, se vuelve a leer el perfil, se comprueban rol y bloqueo y se verifica otra vez la identidad inmediatamente antes de emitir la actualización. Una respuesta tardía tras cambiar de cuenta no puede transferir el borrador a la nueva cuenta. La regla histórica sigue siendo bloqueado ausente = false.

Cliente, admin y admin_principal pueden editar exclusivamente sus propios tres campos personales, conservando el acceso histórico de requireUser. Correo (prioritariamente Auth), rol y estado solo se muestran como texto. UID, id, correo/email, rol, bloqueado, permisos, claims, beneficios, muestras/regalos, fechas y cualquier campo administrativo quedan fuera del payload. No se modifica correo ni contraseña de Authentication.

## Experiencia

Perfil comienza en consulta. Editar perfil carga valores actuales y habilita nombre, teléfono y avatar; el foco pasa al nombre. Guardar valida, deshabilita el formulario, muestra Guardando y realiza una sola actualización; un bloqueo adicional del controlador impide envíos simultáneos. Después vuelve a leer el perfil para actualizar el contenido y el nombre de navegación, y muestra confirmación. Sin cambios no hay escritura.

Cancelar descarta el borrador y vuelve a leer Firebase sin escribir. Logout, cambios de identidad, estados no autenticados y salida de la página limpian el formulario. Mi Cuenta enlaza a Perfil para editar; pedidos, reservas y promociones permanecen pendientes.

Los errores no muestran stack trace. Se contempla denegación de permisos, perfil inexistente, bloqueo y cambio de sesión. Los fallos de red/desconocidos indican que no se pudo confirmar el guardado y que debe recargarse antes de reintentar: una operación podría haberse aplicado. El SDK RTDB puede mantener una escritura pendiente durante una desconexión; hasta su resolución, Guardar permanece bloqueado para evitar duplicados. Sin sesión, el guard existente redirige a Login.

## Reglas y límites de seguridad

**La allowlist frontend no sustituye las reglas Firebase.** No se consultaron ni modificaron reglas remotas con credenciales administrativas, ni se realizaron escrituras de prueba sobre cuentas reales. Por tanto, los permisos actuales de actualización propia siguen pendientes de la primera prueba manual de Eduardo. `permission-denied` se probó únicamente de forma simulada y se muestra sin sugerir abrir permisos.

Las reglas deben exigir autenticación, coincidencia de auth.uid con la clave del usuario, perfil existente y permitido/no bloqueado, validación de tipos/valores y conservación de todos los campos ajenos a la allowlist. Deben impedir creación/eliminación del perfil desde este flujo y cambios de rol, bloqueo, correo, beneficios o administración. Si aparece permission-denied, revisar la regla vigente y preparar una propuesta específica para autorización, sin permisos globales de escritura.

La lectura previa y el update no constituyen una transacción: otra operación podría bloquear o eliminar el perfil entre ambos pasos. Esa condición debe protegerse en las reglas del servidor. Una escritura ya emitida tampoco puede revocarse solo cerrando la sesión; la interfaz descarta respuestas de una identidad anterior. No se garantiza seguridad del servidor basándose exclusivamente en JavaScript del cliente.

## Verificación local

Checks ejecutados con éxito:

- `node scripts/check-static.mjs`: ocho páginas, 79 recursos HTTP 200, anclas y rutas privadas.
- `node scripts/check-auth.mjs`: sesión, roles, bloqueo histórico y aislamiento de escrituras autorizadas.
- `node scripts/check-products.mjs`: catálogo existente.
- `node scripts/check-register.mjs`: registro y recuperación existentes, sin cuentas/correos reales.
- `node scripts/check-account.mjs`: guard, visualización, limpieza y rutas privadas; los módulos de consulta siguen sin escrituras.
- `node scripts/check-profile-edit.mjs`: allowlist, inyección de campos, validación, actualización parcial, doble envío/reintento, refresco y adaptador de producción ejecutado con dobles locales; prueba cambio de cuenta antes y durante lectura, perfil bloqueado/inexistente y administrador propio.

Navegador con página temporal derivada del HTML real y adaptadores exclusivamente en memoria: edición de un nombre produjo solo `{nombre}`; Cancelar conservó el contador de escrituras; admin_principal cambió solo `{avatarPath}` manteniendo rol/beneficios; permiso denegado mantuvo el borrador sin otra escritura; logout ocultó datos y formulario. Sin errores de consola en esta prueba. El arnés temporal se retiró antes del commit.

Consulta y edición verificadas a 360, 390, 430, 768, 1024 y 1280 px: sin scroll horizontal, labels asociados, inputs y botones dentro del contenedor. Inspección visual móvil y navegación responsive. Teléfono usa type/inputmode tel y nombre autocomplete name. La apertura del teclado virtual en un dispositivo físico queda pendiente; la emulación de ancho no la sustituye. La ruta real sin sesión redirige a Login.

## Qué debe verificar Eduardo

1. Iniciar sesión con una cuenta cliente de prueba existente, abrir Perfil y pulsar Editar perfil.
2. Confirmar que únicamente nombre, teléfono y avatar son editables; correo, rol y bloqueado no lo son.
3. Guardar **un solo** cambio personal inocuo. En RTDB `usuarios/{uid propio}`, comparar antes/después: solo ese campo debe cambiar; uid, correo, rol, bloqueado, beneficios, fechas y administración deben permanecer idénticos.
4. Pulsar F5, cerrar sesión y volver a entrar: el valor debe persistir. Probar Cancelar y confirmar que no escribió.
5. Repetir con admin_principal exclusivamente sobre su propio perfil.
6. Si aparece permission-denied, conservar reglas actuales y documentar el rechazo para una revisión autorizada; no ampliar permisos.
7. Verificar el mismo campo en Flutter. Se conservan las claves nombre, telefono y avatarPath del modelo analizado; si no se refleja, revisar caché/refresco o esquema específico antes de duplicar datos. Flutter no se modificó.
8. Revisar teclado real y flujo móvil; ejecutar los seis checks con el servidor estático activo.
9. Confirmar commit `feat: allow safe self profile editing` en origin/main, repositorio Andrux88Felius/chichej-web, y Git limpio.
10. Confirmar que no hubo deploy ni cambios de reglas o proyectos protegidos.

## Cierre de alcance

Solo se trabajó en chichej-web. No se modificaron servidor-linux, Flutter, ESP32 ni el proyecto Firebase protegido; tampoco los PHP originales. No se ejecutó firebase deploy, no se generó QR y no se escribieron datos remotos durante las pruebas. No se implementaron nuevos módulos ni cambios de contraseña/correo.

Próximo paso: validación manual de la primera edición propia y persistencia en RTDB/Flutter antes de avanzar a otra fase. Los resultados simulados no acreditan permisos remotos ni persistencia real.
