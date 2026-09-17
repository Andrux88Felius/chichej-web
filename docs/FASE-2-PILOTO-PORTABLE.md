# Fase 2 — piloto portable CHICHEJ

Fecha: 17/09/2026. Trabajo exclusivo en `C:\Proyectos\chichej-web`.

## Git y punto de restauración

- Estado inicial: rama main sin commits; 143 archivos propios candidatos tras la Fase 1. Único remoto: `https://github.com/Andrux88Felius/chichej-web.git`.
- Revisión previa: configuración SMTP/Firebase basada en entorno; sin marcadores de claves privadas o tokens conocidos en los candidatos revisados. `.env`, cuentas de servicio y credenciales convencionales quedan ignorados. `.env.example` tiene campos sensibles vacíos.
- Baseline: **d58bec753ade6a4a61826479a0b85cbcc6f22458**, `chore: establish chichej-web portability baseline`.
- Push baseline confirmado por Git: nueva rama `main -> main`, seguimiento `origin/main` establecido. Árbol limpio antes de crear el piloto. La revisión automática rechazó inicialmente el push; se resolvió verificando el remoto y presentando la autorización explícita del paso 6 del pedido. No se cambió el destino.
- El piloto se entrega en un segundo commit separado: `feat: add first portable static pages`. Su hash y el resultado final de sincronización se informan en la entrega; no se incrusta su propio hash en el commit.

## Archivos creados y modificados

`public/` contiene únicamente 14 archivos:

```text
public/
  nosotros.html
  informacion.html
  assets/
    css/styles.css
    css/pilot.css
    js/pilot.js
    img/logo-chichej.png
    img/maserado2.jpeg
    img/icon/logo_icon.png
    img/redes-ico/Facebook_Logo_Primary.png
    img/redes-ico/Instagram_Glyph_Gradient.png
    img/redes-ico/TikTok_Icon_Black_Circle.png
    img/redes-ico/Digital_Glyph_Green_RGB_2026.png
    img/audio/wiñapu1.mp3
    img/audio/wiñapu2.mp3
```

También se crean `scripts/serve-static.mjs`, `firebase.json` y este informe. Se actualiza únicamente el README existente para explicar el piloto. `.gitignore`, `.env.example` y documentos Fase 1 se conservan.

Todos los PHP, includes, servicios, API, módulos admin/cliente, assets originales y dependencias Composer permanecen idénticos al baseline, comprobado mediante Git. Las diez copias de recursos originales en public son idénticas byte por byte. No se tocaron servidor-linux, Flutter, ESP32 ni Firebase externo.

## Conversión de Nosotros e Información

- Se conserva el HTML de contenido de `nosotros.php`: historia, fotografía, principios y feria, con las mismas clases, textos y disposición.
- Se conserva el contenido de `info.php`: proyecto, responsables, documentación, APK y agradecimiento. La condición PHP de Maps se resuelve al enlace oficial ya configurado; se elimina únicamente la rama inactiva de enlace pendiente.
- Se materializan `includes/header.php`, el navbar público sin sesión y `includes/footer.php` en cada HTML. Son dos documentos completos que no necesitan descargar fragmentos para poder mostrarse.
- Título, página activa y basePath se resuelven estáticamente. El año del footer se actualiza con JavaScript y conserva 2026 como respaldo.
- No se carga `auth.php`, sesión, CSRF, configuración Firebase, SDK Auth ni APIs del backend en el piloto. No se intenta detectar una sesión PHP ni simular un usuario autenticado.
- `styles.css` se copia completo como hoja visual compartida para conservar cascada y responsive. No se importan frameworks, fuentes remotas nuevas ni dependencias npm.
- `pilot.js` conserva del app.js original solamente menú, cabecera al desplazar, animaciones reveal y reproductor de audio. Se excluyen formularios, llamadas API, perfiles, autenticación, carrusel y lógica no usada.
- `pilot.css` solo diferencia opciones no disponibles y la nota del piloto. No se modificaron colores, tipografías, tarjetas o espaciados del contenido.

## Navegación y recursos

Nosotros enlaza a `nosotros.html`; Información a `informacion.html`, tanto en navbar como en footer. La página activa usa `aria-current="page"`.

Inicio, Productos, Promociones, Dispensar, Reservas, Acceder, formularios y áreas privadas permanecen visibles como opciones no disponibles (`aria-disabled`, sin href), con explicación y nota al pie. No hay enlaces falsos `#`, enlaces a PHP ni rutas al directorio padre. La marca tampoco finge enlazar a un inicio aún inexistente.

El acceso del menú “Descargar app” permanece pendiente porque apuntaba a una sección de Inicio; Información sí conserva su enlace externo APK original. Se mantienen enlaces oficiales de redes, teléfono, WhatsApp, Maps y documentos. Sus destinos externos no se modificaron ni descargaron durante la prueba; su disponibilidad y permisos deben verificarse manualmente.

Se copian solo logo, favicon, imagen institucional, cuatro iconos sociales y dos audios, además de CSS. No se copian catálogo, promociones, video, QR, avatares ni dependencias PHP. Todas las rutas internas son relativas; no hay IP privada, ruta Windows/Apache ni localhost absoluto en el contenido publicable.

## Pruebas realizadas

Servidor estático Node, sin Apache, PHP, Python, MySQL ni paquetes npm. Python no está instalado (solo existe su lanzador).

| Comprobación | Resultado |
| --- | --- |
| Sintaxis pilot.js y serve-static.mjs | Correcta mediante node --check. |
| Recursos HTTP de las dos páginas | 14 rutas con respuesta 200, incluidos ambos audios y favicon. |
| Integridad de recursos copiados | 10 recursos idénticos a sus originales. |
| Aislamiento de raíz pública | .env, config/mail.php, api/auth/session-login.php y README fuera de public responden 404. |
| PHP residual/rutas locales | Ninguna en los documentos estáticos; public no contiene PHP ni configuración privada. |
| Consola del navegador | Sin errores ni advertencias observados al cargar y navegar entre las páginas. |
| Imágenes | Todas completas y con dimensiones naturales válidas en ambas páginas. |
| Menú | Abre, cambia aria-expanded, cierra con Escape y permite navegar entre ambas páginas en móvil. |
| Audio | Reproducción/pause sin error del elemento; cambio a Wiñapu 2 actualiza fuente y etiqueta. No se certifica calidad audible del dispositivo. |
| Originales | Sin diferencias frente al baseline en PHP, JS/CSS/assets originales, servicios, configuración, API y Composer. |

### Responsive

Se midió el ancho real del documento en **ambas páginas** a 360, 390, 430, 768, 1024 y 1280 px: **sin desbordamiento horizontal** en los doce casos. Se revisaron capturas móviles de cabecera, menú abierto, texto, tarjetas y footer, además de escritorio. El breakpoint original del menú (1180 px) se conserva: a 1024 px sigue siendo hamburguesa.

No se encontraron incompatibilidades que requirieran cambiar el diseño original. La comprobación fue con el navegador integrado de escritorio ajustando viewport; no sustituye pruebas físicas de iOS/Android, gestos táctiles, zoom ni una comparación renderizada contra PHP. PHP no está instalado aquí, por lo que la fidelidad se apoya en preservar contenido y CSS original, no en una comparación de capturas PHP/HTML ejecutadas simultáneamente.

## Firebase Hosting

No existían firebase.json ni .firebaserc. Se crea solo `firebase.json`, con raíz `public` y exclusiones de archivos ocultos, node_modules y PHP. No hay rewrite SPA, servicios backend ni reglas de bases de datos. No se crea .firebaserc porque no se ha confirmado el ID técnico del proyecto. No se ejecutó firebase deploy ni se modificó el proyecto chichej_2026.

La raíz `/` de Hosting todavía no tiene index.html: el piloto se abre mediante sus dos rutas explícitas. El servidor local redirige `/` a Nosotros solo por comodidad. No confundir esa redirección local con un Inicio migrado ni una configuración de Hosting.

## Pendientes y siguiente paso

Siguen intactos y sin migrar Inicio, Login, Registro, Productos, Pedidos, Reservas, Promociones, paneles admin/cliente, Contacto SMTP, PDF y Dispensación. No se generó QR ni se publicaron páginas en Hosting.

Revisar manualmente este piloto y luego acordar el siguiente lote, empezando por composición compartida e Inicio. Antes de catálogo/autenticación se necesitará validar contratos y permisos; no trasladar privilegios administrativos al navegador.

## QUÉ DEBE VERIFICAR EDUARDO

1. En una terminal en `C:\Proyectos\chichej-web`, ejecutar `node scripts/serve-static.mjs`. Requiere Node.js; no requiere instalar paquetes. Si 8080 está ocupado, usar `node scripts/serve-static.mjs 8081`. Detener con Ctrl+C.
2. Abrir `http://localhost:8080/nosotros.html` y `http://localhost:8080/informacion.html` (ajustar puerto si corresponde).
3. En Nosotros revisar historia, imagen, principios, feria, logo, colores y footer. En Información revisar título, responsables, tarjetas y Maps. Comparar con la versión anterior sin modificarla.
4. Reducir la ventana, abrir hamburguesa, desplazarse por el menú, cerrar con Escape y pasar entre Nosotros e Información.
5. En herramientas de desarrollo activar vista adaptable y probar 360, 390, 430, 768, 1024 y 1280 px; comprobar textos legibles, tarjetas e inexistencia de scroll lateral.
6. Comprobar imagen institucional, logo, iconos y favicon; probar reproducir/pausar, silenciar y cambiar pista.
7. Revisar Console y Network al recargar ambas páginas: sin errores rojos ni recursos locales 404. Las opciones pendientes no deben navegar ni intentar PHP. Comprobar manualmente disponibilidad de enlaces externos.
8. En GitHub, abrir `Andrux88Felius/chichej-web`, rama main y lista de commits: deben aparecer el baseline y `feat: add first portable static pages`. Localmente usar `git status` y `git log -2 --oneline`.
9. No tocar todavía servidor-linux, Flutter, ESP32, reglas/datos Firebase ni módulos pendientes. No ejecutar deploy ni generar QR.

El servidor de prueba se limita a la computadora local; para pruebas físicas por teléfono hará falta un entorno de preview accesible acordado posteriormente. No es todavía una URL pública para datos móviles.
