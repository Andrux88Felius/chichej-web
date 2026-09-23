# Pulido público — 23 de septiembre de 2026

- Crear mi cuenta ahora dirige a registro.html, sin estado pendiente. También se habilitaron los CTAs existentes de promociones y Contacto comercial.
- Dispensar se retiró de la navegación compartida. El CTA público lleva a descargar-app.html. Se conservaron el archivo de dispensación, sus módulos y el monitoreo administrativo sin cambios funcionales.
- Nueva página permanente: https://chichej-2026.web.app/descargar-app.html. Android, CHICHEJ oficial, versión 1.0.0.
- El único enlace directo al APK en las páginas HTML está centralizado en public/descargar-app.html, en el elemento data-apk-download. Inicio, Información y la navegación conducen a esa página; cambiar versión/enlace requiere editar allí, sin cambiar el QR ni añadir JavaScript.
- APK actual: https://github.com/Andrux88Felius/CHICHEJ/releases/latest/download/CHICHEJ-v1.0.0.apk. Verificado HTTP 200 y tipo application/vnd.android.package-archive.
- QR local: public/assets/img/qr/descargar-app.png. Contenido exacto: https://chichej-2026.web.app/descargar-app.html. PNG 540×540, negro/blanco, corrección Q y margen de cuatro módulos. Generado con qrcode 8.2; decodificado independientemente con ZXing-C++ 3.1.1 a 540, 164, 180, 200 y 240 px. No intervino un generador remoto. Escaneo físico con cámara de Eduardo pendiente; la lectura automatizada fue satisfactoria.
- YouTube incorporado en las redes de las 17 páginas y en Videos de Expo: https://www.youtube.com/channel/UCNrElbwuSsUQSRKH5Xkay4Q. Enlaces externos con target _blank y rel noopener noreferrer.
- Icono fa-youtube: SVG oficial de [Font Awesome 6](https://github.com/FortAwesome/Font-Awesome/blob/6.x/svgs/brands/youtube.svg), servido localmente, en rojo, sin cargar biblioteca de iconos. Atribución/licencia CC BY 4.0 conservada en el SVG.
- Fotografías, demostración, tríptico y documentación pública de Expo se preservaron. No se creó repositorio de documentación, URL ficticia, PDF ni material multimedia nuevo.
- Se conservaron Facebook y WhatsApp originales, Instagram y TikTok. Las redes, la página central de enlaces, el APK y la web respondieron HTTP 200 en la revisión.
- Responsive: 360, 390, 430, 768, 1024, 1280 y 1920 px. Sin scroll horizontal detectado en Inicio, descarga, Nosotros/Expo, Información y panel con nombres largos simulados. QR cuadrado, visible a 180 px en Inicio y 240 px en descarga. Menú móvil y redes comprobados.
- Cliente no ve Administración; admin y admin_principal conservan acceso en pruebas simuladas. No se modificó la lógica de roles, bloqueo, registro, reservas ni perfiles. La música sigue ausente de páginas administrativas.
- Checks: 12/12 aprobados mediante node scripts/check-all.mjs. Check estático: 17 páginas, 107 recursos HTTP 200. Las pruebas de navegación también cubren descarga, APK, QR presente, YouTube, CTA de registro y ausencia de enlaces públicos a dispensar.html.
- Alcance: únicamente chichej-web. Sin cambios en PHP legado, Flutter, ESP32, reglas, usuarios, credenciales, SMTP ni protocolo de pedidos. Ninguna acción física ni escritura de prueba en Firebase.

## Git y Hosting

Commit funcional desplegado: **0542a70a605cc471988b46ec467661d1f454d632**, feat: finalize public app download and social links. Push a origin/main confirmado y árbol limpio antes del despliegue. Esta actualización documental posterior registra la evidencia real de publicación sin modificar los archivos publicados.

Firebase CLI 15.30.2 comprobada con firebase.cmd. Proyecto activo chichej-2026 y acceso autenticado confirmados. firebase.json conserva hosting.public = public, sin configuración de reglas o Functions modificada.

Despliegue realizado correctamente con **firebase.cmd deploy --only hosting**: 107 archivos, release completo. No se desplegaron reglas ni Functions.

URL devuelta por Firebase: https://chichej-2026.web.app. Verificaciones posteriores: Inicio y https://chichej-2026.web.app/descargar-app.html responden HTTP 200 sobre HTTPS; ambos HTML coinciden byte a byte con la copia desplegada. QR PNG e icono SVG también responden 200 con tipos correctos y contenido idéntico. El PNG descargado desde producción fue decodificado nuevamente: contiene exactamente la URL permanente de descarga. La página pública muestra APK, QR y YouTube sin errores de consola observados. El CTA Crear mi cuenta navega correctamente a registro.html. No se enviaron formularios ni mensajes reales.

Las herramientas temporales de generación/lectura y los datos de prueba fueron retirados. Queda únicamente la comprobación física opcional del QR con el teléfono de Eduardo; la decodificación de la imagen local y publicada ya fue validada.
