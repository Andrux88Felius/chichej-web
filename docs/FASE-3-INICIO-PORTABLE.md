# Fase 3 — Inicio y navegación pública portable

Fecha: 17/09/2026. Proyecto: `C:\Proyectos\chichej-web`.

## Estado inicial y alcance

Git inició limpio en main, sincronizado con origin/main, con commits d58bec7 (baseline) y 2fea269 (piloto). El único remoto sigue siendo `https://github.com/Andrux88Felius/chichej-web.git`. La revisión rápida de los archivos propios no detectó marcadores de claves privadas o tokens conocidos. No se imprimieron credenciales.

Se implementó Inicio estático y se consolidó la navegación de Inicio, Nosotros e Información. No se cambió ningún PHP, asset original, include, API, servicio, módulo privado ni dependencia Composer. Tampoco se modificaron servidor-linux, Flutter, ESP32, Firebase externo o reglas. No hay autenticación ni datos dinámicos en public.

La implementación se completó inicialmente de forma local porque el adjunto terminaba a mitad del punto 14. Una instrucción posterior autoriza el cierre formal mediante commit y push exclusivamente a main de Andrux88Felius/chichej-web. El cierre no introduce cambios funcionales ni despliegue.

## Cierre formal Git

- Commit de implementación: `ea01dbaec6404c3149d3c9e5bc1a21d963cb3cb5` — `feat: migrate home and public navigation`.
- GitHub: https://github.com/Andrux88Felius/chichej-web/commit/ea01dbaec6404c3149d3c9e5bc1a21d963cb3cb5
- Push confirmado por Git: `2fea269..ea01dba main -> main`, exclusivamente en `Andrux88Felius/chichej-web`.
- Rama utilizada: `main`. Estado comprobado después del push: sincronizada con `origin/main`, árbol limpio (`nothing to commit, working tree clean`).
- Comprobación repetida al cierre: `node scripts/check-static.mjs` aprobada; 3 páginas, 33 recursos HTTP 200, anclas válidas, raíz Inicio y 4 rutas privadas bloqueadas.
- Revisión de candidatos: sin marcadores de secretos, credenciales ni archivos temporales/logs. Las 18 imágenes incorporadas son idénticas a los originales ya existentes.
- No se ejecutó `firebase deploy`; Firebase y sus reglas no se modificaron. Sin cambios en servidor-linux, Flutter, ESP32, PHP originales o módulos pendientes.
- Esta constancia se añade en un commit exclusivamente documental posterior, autorizado en el pedido de cierre: el hash del commit principal y el éxito real del push solo pueden registrarse después de que ocurran. No modifica funcionalidad. El estado limpio final y la subida de esta constancia se verifican tras su commit y se comunican en la entrega.

## Análisis de index.php

Categorías: A totalmente estática; B composición mediante PHP; C Firebase; D sesión/autenticación; E backend operativo; F pendiente de fases posteriores. Una sección puede tener más de una categoría.

| Sección original | Clasificación | Tratamiento portable |
| --- | --- | --- |
| Cabecera, título, basePath | B | HTML completo, título Inicio, rutas relativas y descripción específica. |
| Navbar | B/D/F | Vista pública estática; se elimina la consulta de sesión. Inicio, Nosotros e Información activos; acceso y módulos pendientes deshabilitados. |
| Hero, botella, atributos y tarjetas flotantes | A/F | Mismos textos/imágenes/clases. CTA a Nosotros activo; Productos deshabilitado. Los atributos originales son presentación, no telemetría ni garantía de disponibilidad web. |
| Nuestra esencia | A | Misma foto, sello, textos y enlace a Nosotros. |
| Tres presentaciones destacadas | B/F | Se materializa el array PHP local y su foreach en tres tarjetas. No había consulta Firebase. Sin precio, stock ni compra inventados; catálogo pendiente. |
| Beneficios | A | Contenido y estructura intactos. |
| Campañas | B/F | Se materializa el include promotions-carousel.php: 12 imágenes locales, mismo orden, agosto primero. Conserva aviso de vigencia pendiente; no se declara una campaña vigente ni se consulta Firebase. |
| Descarga Android | A | Mismo enlace externo APK, versión textual y placeholder QR preexistentes; no se genera QR ni se cambia la app. El acceso del navbar/footer ahora apunta a index.html#descargar-app. |
| CHICHEJ para negocios | A/F | Misma imagen y propuesta; WhatsApp oficial conservado, Contacto comercial deshabilitado. |
| Galería multimedia | A/F | Se mantienen los seis espacios pendientes. No se agregan videos ni demostraciones ficticias. |
| CTA final | A/F | Mismos textos; Registro y Dispensar deshabilitados. |
| Footer y audio | B/D | Composición estática y audio compartido. Año actualizado en cliente; no se inyecta configuración ni SDK Firebase. |

**C:** no hay consulta directa a Firebase en index.php ni en el carrusel local. **E:** no hay operación de backend propia de Inicio que migrar; PHP se usaba para composición, arrays y navbar con sesión. La sesión de includes/auth.php y la carga condicional de Firebase en footer no se trasladan al piloto.

## Archivos y recursos

Creado `public/index.html`. Actualizados `public/nosotros.html` y `public/informacion.html` para navegación común, marca a Inicio, acceso a descargar app, descripción específica y nota de alcance actualizada. Se conserva un solo h1 por página, UTF-8, lang es, viewport, títulos distintos y alt en imágenes. No hay canonical ni dominio inventado.

El CSS original copiado `public/assets/css/styles.css` permanece intacto. Solo `public/assets/css/pilot.css` recibe estilos de foco visible, tratamiento discreto de CTA no disponibles y dos correcciones responsive. `public/assets/js/pilot.js` comparte menú, animaciones, audio y carrusel local; no tiene fetch, SDK Firebase ni código de autenticación.

Se añaden 18 imágenes que Inicio necesita y que aún no estaban en public:

- `assets/img/productos/1000ml.png`, `500ml.png`, `250ml.png`.
- `assets/img/maserado1.jpeg`, `pedidos.png`.
- `assets/img/icon/logo_icon_foreground_android.png`.
- Las 12 campañas de `assets/img/promos/`, de enero a diciembre.

Logo, favicon, iconos sociales, CSS y ambos audios se reutilizan. No se copian PHP, vendor, configuración privada, avatares o videos innecesarios. Public contiene 33 archivos al cierre de esta fase.

`scripts/serve-static.mjs` ahora sirve index.html directamente en `/` con HTTP 200. `scripts/check-static.mjs` permite repetir la comprobación de documentos, enlaces, anclas, recursos HTTP y aislamiento del servidor. Se actualiza README y se crea este informe. `firebase.json` se conserva sin cambios.

## Navegación, teclado y controles

- Inicio → index.html; Nosotros → nosotros.html; Información → informacion.html. Marca de navbar/footer → Inicio. Página actual indicada con aria-current.
- Enlaces a secciones reales conservan sus fragmentos, incluido feria-chelito-2026. No hay href="#" ni href hacia PHP.
- Opciones aún no migradas son enlaces deshabilitados semánticamente, sin href ni acción. Los enlaces reales mantienen navegación con teclado.
- Escape cierra el menú y devuelve foco al botón solo cuando el menú está abierto; ya no roba foco si está cerrado.
- Al sacar el foco del menú con teclado se cierra y desbloquea el scroll. El cambio a escritorio también lo cierra.
- Carrusel conserva controles anterior/siguiente, puntos, flechas de teclado, gestos y comportamiento original de reproducción automática/reduced-motion. Los datos son exclusivamente las campañas locales existentes.

## Problemas encontrados y corregidos

1. Inicio desbordaba a 360 y 390 px: la cascada heredada dejaba dos columnas en la galería. En el CSS portable se utiliza una sola columna hasta 430 px, sin cambiar tarjetas ni contenido.
2. El sello circular Origen Bolivia sobresalía a 768 px: se ajustó su posición derecha dentro de la imagen hasta 980 px.
3. Escape podía mover el foco al botón hamburguesa incluso con menú cerrado: se limita al estado abierto.
4. La raíz local redirigía a Nosotros: ahora responde directamente con Inicio, igual que el index.html preparado para Hosting.

No se ocultó el overflow global para disimular errores. No se hizo un rediseño.

## Pruebas realizadas

Servidor Node local, sin PHP/Apache/MySQL. Resultado de `node scripts/check-static.mjs`: **3 páginas, 33 recursos HTTP 200, anclas válidas, raíz Inicio y 4 rutas privadas bloqueadas**. Estas cuatro rutas son .env, config/mail.php, api/auth/session-login.php y README.md; no deben exponerse desde public.

- Sintaxis JavaScript y servidor correctas; diff sin errores de espacios al cierre.
- 18 combinaciones: las tres páginas a **360, 390, 430, 768, 1024 y 1280 px**, sin scroll horizontal después de las correcciones.
- Menú en cada página a 360/390/430: apertura, cierre con Escape, foco al botón y scroll desbloqueado correctos. Resize a 1280 cierra el menú.
- Navegación móvil Inicio → Nosotros → Información → Inicio correcta.
- Carrusel: selección de primera campaña, siguiente (02), anterior (01) y flecha derecha (02) correctas.
- Consola sin errores ni advertencias observados; ninguna imagen cargada rota detectada. Recursos locales verificados por HTTP, sin 404 inesperados.
- Sin PHP residual, rutas físicas, IP privada, localhost absoluto ni llamadas a APIs en los documentos publicables.
- Git confirma sin diferencias en PHP, assets originales, includes, servicios, configuración, API, módulos y Composer frente a 2fea269.

Límites: pruebas en navegador de escritorio con viewport ajustado, no teléfonos físicos. Sin PHP instalado no se compararon capturas de dos servidores; se preservó el contenido, clases y CSS original. No se enviaron mensajes por WhatsApp, no se descargó/instaló APK ni se certificó vigencia de campañas o disponibilidad de enlaces externos. Esto no es una auditoría completa de accesibilidad.

## Pendientes

Login, Registro, catálogo dinámico, Pedidos, Reservas, Promociones dinámicas, Dispensar, Contacto SMTP, PDF y paneles siguen sin migrar. Futuras fases deben resolver vigencia de campañas, catálogo/stock, identidad/permisos y backend antes de habilitar sus CTA. No se añadieron datos ni lógica Firebase.

## QUÉ DEBE VERIFICAR EDUARDO

1. Desde `C:\Proyectos\chichej-web`, ejecutar `node scripts/serve-static.mjs` si el servidor no está iniciado.
2. Abrir `http://localhost:8080/`, `/index.html`, `/nosotros.html` y `/informacion.html`. La raíz debe mostrar Inicio.
3. Revisar hero, botella, historia, tres presentaciones, beneficios, campañas, descarga, negocios, galería pendiente y footer. Comparar con el original sin modificarlo.
4. Probar Inicio/Nosotros/Información desde navbar y footer/marca; “Descargar app” debe llegar a la sección real de Inicio. Los módulos pendientes no deben navegar.
5. Probar hamburguesa, Escape, Tab/Shift+Tab, selección de opción y pasar de ventana móvil a escritorio; no debe quedar bloqueado el scroll.
6. Probar 360, 390, 430, 768, 1024 y 1280 px. Revisar especialmente galería y sello Origen Bolivia.
7. Probar carrusel con anterior/siguiente, puntos y teclado, además del audio. Las campañas son presentación local, no promociones verificadas vigentes.
8. Abrir Console/Network y recargar. Ejecutar `node scripts/check-static.mjs` para repetir las comprobaciones automáticas con el servidor activo.
9. Revisar `git status` y el historial de main para confirmar el cierre Git documentado. No ejecutar deploy ni generar QR.
10. No tocar servidor-linux, Flutter, ESP32, Firebase o módulos pendientes. Confirmar visualmente el piloto antes de elegir el siguiente lote.
