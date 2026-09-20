# Fase 6C — Selector visual de avatar

## Problema y solución

El desplegable textual de Perfil obligaba a elegir entre nombres como Avatar 1 sin ver la imagen. Se sustituyó por una cuadrícula de diez miniaturas del catálogo local existente: avatar por defecto y avatar1–avatar9. Cada tarjeta es un label asociado por anidación a un radio nativo. Solo se muestra durante la edición; el modo consulta conserva su avatar habitual.

La opción seleccionada presenta borde reforzado y la marca «✓ Elegido», sin depender únicamente del color. No se añadieron archivos de imagen, uploads, Storage, base64 ni servicios externos.

## Compatibilidad y persistencia

Los valores siguen siendo exactamente `assets/avatares/invitado.png` y `assets/avatares/avatar1.png` a `assets/avatares/avatar9.png`. El grupo conserva el nombre `avatarPath`; el controlador existente utiliza RadioNodeList.value igual que antes usaba el valor del select. No fue necesario cambiar ningún JavaScript de producción.

Al abrir se preselecciona el valor cargado por el editor. El fallback existente sigue siendo invitado.png cuando el valor no es válido. Todos los radios comparten nombre y son required, por lo que solo puede elegirse una opción y no puede enviarse una selección vacía. Cancelar restablece los datos; Guardar utiliza la misma allowlist, validaciones, UID de Auth y actualización parcial de la Fase 6B.

Eduardo confirmó previamente el guardado real, persistencia y conservación de campos protegidos de la Fase 6B. En 6C se comprobó el nuevo control con datos locales simulados: al elegir Avatar 5, el único payload fue `{avatarPath: 'assets/avatares/avatar5.png'}` y la vista de consulta mostró esa imagen. No se escribieron cuentas reales durante estas pruebas. La comprobación de F5 contra Firebase con el nuevo control queda para Eduardo.

## Archivos modificados

- `public/usuario/perfil.html`: grupo de miniaturas en lugar del select de avatar.
- `public/assets/css/pilot.css`: cuadrícula adaptable, foco y señal de selección; nombres de clase propios para evitar interferencia con estilos históricos.
- `scripts/check-profile-edit.mjs`: verifica ausencia del select, diez valores únicos permitidos, imágenes locales, compatibilidad y fallback. Conserva pruebas de seguridad y actualización parcial.
- `docs/FASE-6C-AVATAR-VISUAL.md`: este informe.

## Accesibilidad y responsive

Radios nativos con labels, legend «Elige tu avatar» e instrucciones de teclado. Tab llega al grupo y las flechas cambian la selección; foco visible sobre la tarjeta. Las imágenes usan alt vacío porque el label nombra cada opción sin duplicar el anuncio; el estado checked lo comunica el radio. Clic sobre toda la tarjeta, no solo sobre la miniatura.

Prueba de navegador con el HTML y módulos de producción y adaptadores en memoria: avatar actual preseleccionado, clic, flecha derecha, selección única, foco visible, Cancelar sin escritura y restauración de Avatar 2, guardado de Avatar 5 y actualización de la imagen de consulta. Sin errores de consola. Se retiraron los archivos temporales antes del commit.

Sin scroll horizontal a 360, 390, 430, 768, 1024 y 1280 px. Cuadrícula de dos columnas en los tres anchos móviles, cinco a 768/1024 y siete a 1280 en la prueba realizada. Miniaturas, nombres y marca de selección permanecen dentro de las tarjetas. Inspección visual a 390 px.

## Checks

Los seis checks pasan:

- `node scripts/check-static.mjs`: 8 páginas, 79 recursos HTTP 200 y rutas/anclas correctas.
- `node scripts/check-auth.mjs`.
- `node scripts/check-products.mjs`.
- `node scripts/check-register.mjs`.
- `node scripts/check-account.mjs`.
- `node scripts/check-profile-edit.mjs`.

Ejecutarlos con `node scripts/serve-static.mjs` activo para los checks HTTP locales. La revisión Git confirma que los módulos de seguridad, Auth y Firebase no cambiaron. No se modificaron backend, reglas, PHP originales, correo, rol, bloqueo, permisos ni campos administrativos. No hubo deploy, QR ni cambios en servidor-linux, Flutter, ESP32 o el proyecto Firebase protegido.

## Qué debe verificar Eduardo / próximo paso

1. Iniciar sesión como cliente, abrir Perfil y pulsar Editar perfil.
2. Confirmar que desapareció el desplegable de avatar, aparecen imágenes y está seleccionado el avatar actual.
3. Elegir otra imagen con clic, guardar, pulsar F5 y confirmar persistencia.
4. Confirmar que nombre y teléfono siguen editándose, mientras correo, rol y campos protegidos no son editables.
5. Ejecutar los seis checks, comprobar el commit `feat: improve avatar selection with visual picker` en origin/main de Andrux88Felius/chichej-web y Git limpio.

Próximo paso recomendado: realizar esa validación manual del nuevo selector, sin ampliar el alcance de esta fase.
