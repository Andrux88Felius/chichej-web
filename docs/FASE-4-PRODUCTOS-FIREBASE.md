# Fase 4 — catálogo público con Firestore, solo lectura

## Alcance y estado inicial

Trabajo exclusivo en `C:\Proyectos\chichej-web`. Git inició limpio en main, sincronizado con origin/main, último commit c4aa311. Único remoto: `https://github.com/Andrux88Felius/chichej-web.git`.

Se incorpora `public/productos.html` como primera página dinámica. **FIRESTORE PUBLIC READ: FUNCIONA** en la prueba realizada, sin autenticación y sin permission-denied real. No hubo escrituras de datos, cambios remotos, deploy ni QR nuevo.

## Original analizado y origen de datos

`productos.php` delega inmediatamente a `includes/views/products-live.php` y retorna. El catálogo hardcodeado posterior es código inalcanzable y no se usó como fuente de productos.

La vista activa usa `includes/firebase-data.php` y `services/FirebaseReadService.php`: obtiene `productos` desde Firestore mediante API REST y OAuth de una cuenta de servicio en PHP, normaliza, filtra activos y ordena por opcion. RTDB no es la fuente de este catálogo. La vista consulta además `mensajes` para una promoción; esa consulta no se migró. Header, navbar, footer y carrusel son includes PHP. No hay búsqueda/filtros interactivos públicos ni compra implementada en esa vista.

Se conserva hero, grid, cards, tamaño, nombre, descripción, precio, etiqueta de disponibilidad, imágenes, navbar/footer y campañas gráficas locales. Estas campañas llevan un aviso de vigencia no confirmada. No se consulta ninguna colección diferente de productos. Compra, Login, Registro, Contacto, Reservas, Dispensar y demás módulos pendientes siguen deshabilitados.

## Configuración y SDK

La copia solo contenía getenv en config/firebase.php y el ejemplo vacío; tampoco había variables CHICHEJ_FIREBASE disponibles en el proceso. Eduardo proporcionó posteriormente la configuración pública Web oficial: projectId **chichej-2026**, authDomain chichej-2026.firebaseapp.com y appId Web. Se usaron exclusivamente esos valores en `firebase-config.js`, sin deducirlos del nombre visible chichej_2026. No se añadió measurementId ni Analytics.

SDK modular oficial fijado en **12.19.0**, importado desde gstatic. `firebase-config.js` inicializa una app con nombre propio y exporta Firestore mediante carga asíncrona. `productos.js` llama una vez a `getDocs(collection(db, 'productos'))` por carga. No importa Auth, RTDB, Storage ni funciones de escritura. La presencia de databaseURL/storageBucket en el objeto proporcionado no activa esos servicios.

Eduardo autorizó explícitamente HTTP POST internos del SDK usados exclusivamente para lecturas. El canal observado fue `google.firestore.v1.Firestore/Listen/channel`: es el transporte interno de getDocs; la aplicación no usa onSnapshot ni instala una escucha continua propia. No contiene solicitudes HTTP manuales de escritura.

Referencias oficiales: [SDK modular por CDN](https://firebase.google.com/docs/web/alt-setup), [lecturas getDocs](https://firebase.google.com/docs/firestore/query-data/get-data), [reglas y consultas](https://firebase.google.com/docs/firestore/security/rules-query).

## Documentos reales observados

La inspección puntual mediante el mismo SDK devolvió **13 documentos**, de los que **6 son activos y 7 inactivos**. No se alteraron sus datos.

Campos observados en la colección: productoId, nombre, descripcion, imagen, bebidaId y tipoBebida (string); opcion, precio y cantidadMl (number); activo, agotado y esGratis (boolean cuando presentes); creadoEn y actualizadoEn (objetos de fecha del SDK). No todos existen en todos los documentos. `_id` se contempla por compatibilidad con la capa PHP, que agregaba el ID REST, pero no apareció como campo almacenado en la inspección.

| Producto activo observado | Cantidad | Precio mostrado | Estado observado |
| --- | ---: | --- | --- |
| Muestra Gratis | 45 ml | Gratis | Disponible |
| Chicha 150ml | 150 ml | Bs 3,00 | Disponible |
| Chicha 250ml | 250 ml | Bs 5,00 | Disponible |
| Chicha 500ml | 500 ml | Bs 10,00 | Disponible |
| Chicha 750ml | 750 ml | Bs 15,00 | Disponible |
| Chicha 1L | 1000 ml | Bs 20,00 | Disponible |

Estos valores son el resultado de la prueba, no datos hardcodeados. La página los vuelve a leer al recargar. La descripción «solo por registro» de la muestra se conserva; no concede una muestra ni implementa registro.

Incompatibilidades históricas confirmadas: `agotado` ausente en chicha_1000ml, chicha_500ml, chicha_750ml y muestra_45ml; rutas `assets/productos/...` y `assets/garapiña.png`, `assets/linaza.png`, `assets/mocochinchi.png`, `assets/cebada.png`. Los últimos corresponden actualmente a documentos inactivos. No se encontraron booleanos en formato string en esta lectura, aunque esa compatibilidad se probó localmente.

## Normalización, filtrado y orden

- Identidad: productoId no vacío, luego _id, luego document.id. Para desempate se usa el ID real del documento.
- Nombre vacío → Sin datos; descripción no escalar → cadena vacía. Contenido renderizado con textContent, sin innerHTML ni ejecución de HTML de Firestore.
- Precio numérico finito, incluyendo cero; vacío/no numérico → Precio no disponible. No se inventan precios. Cantidad/opcion numéricas se convierten a enteros como en PHP; cantidad ausente → Presentación no disponible.
- Booleanos reconocidos: true/false, 1/0 y strings 'true'/'false'/'1'/'0'. Se preservan los defaults PHP: activo true, agotado false y esGratis false para valores ausentes/no reconocidos.
- Activo false se excluye. Agotado true permanece visible con su etiqueta. Gratis respeta esGratis como la vista original, incluso si un documento histórico discordante tuviera precio distinto de cero; no corrige el precio remoto.
- Orden numérico por opcion. Los ausentes quedan al final y los empates se resuelven por ID de documento. Es un fallback explícito de presentación, diferente al null→0 implícito del PHP. Sin orderBy ni índice compuesto adicional.
- Se consulta la colección y se filtra localmente, como permite el tamaño actual. **Ocultar inactivos en la interfaz no es un permiso de seguridad:** la consulta autorizada devuelve también esos siete documentos. No se inspeccionaron ni modificaron reglas remotas y no se evaluó permiso de escritura mediante intentos.

## Imágenes y estados de interfaz

Lista permitida de seis imágenes de presentaciones y cuatro de bebidas históricas. Se normalizan barras y rutas `assets/productos` a `assets/img/productos`, y bebidas `assets/...` a `assets/img/...`. No se admiten URL externa, data URI, traversal o nombres arbitrarios. Se conserva la imagen original; algunos textos impresos en el arte pueden no coincidir con el tamaño del documento y deben ser revisados visualmente por Eduardo, sin cambiar datos en esta fase.

Imagen ausente/no permitida → Imagen no disponible. Si un recurso permitido falla, su evento error retira la imagen y muestra el fallback una sola vez, sin bucle.

Estados: cargando; cards reales; catálogo sin activos; error amigable. Hay manejo específico de configuración ausente y permission-denied. Console solo recibe códigos conocidos, sin stack, payload ni configuración privada. JavaScript desactivado muestra un aviso. Las campañas gráficas siguen locales, sin datos ficticios de productos ni promociones dinámicas.

## Archivos

Nuevos: public/productos.html, public/assets/js/firebase-config.js, public/assets/js/productos.js, scripts/check-products.mjs y este informe.

Recursos copiados, sin alterar originales: productos/750ml.png, 150ml.png, 45ml.png; garapiña.png, linaza.png, mocochinchi.png y cebada.png bajo public/assets/img. El resto se reutiliza.

Modificados: index.html, nosotros.html e informacion.html para habilitar Productos; pilot.css para texto largo en cards; check-static.mjs para incluir la cuarta página y detectar operaciones prohibidas; README. No se tocaron pilot.js, PHP, includes, servicios, configuración original, Composer ni firebase.json.

## Pruebas y resultados

- **Firestore real:** lectura correcta de productos; 13 documentos, 6 visibles. Sin sesión ni importación de Auth. No apareció permission-denied real.
- **Network:** SDK app/firestore 12.19.0 cargados desde gstatic y canal Firestore observado. Sin peticiones PHP o APIs propias. La inspección de esquema fue otra lectura puntual; no se leyó ninguna otra colección.
- **Console real:** sin errores ni advertencias observados. El error permission-denied se probó por inyección local de un lector falso, sin tocar reglas.
- **Responsive real:** 360, 390, 430, 768, 1024 y 1280 px, seis cards y sin desbordamiento horizontal.
- **Datos sintéticos aislados:** mismo componente con nombre muy largo sin espacios, descripción con texto HTML, Gratis, Agotado, inactivo, vacío, carga pendiente, error simulado y fallo de imagen. Sin desbordamiento en los seis anchos; el HTML fue texto literal, el inactivo no se mostró y dos casos de imagen fallida mostraron fallback. El 404 provocado en esa prueba fue deliberado y no corresponde a producción.
- **Menú:** apertura y Escape, scroll desbloqueado; navegación de las cuatro páginas comprobada.
- **check-products.mjs:** normalización histórica, identidad, booleanos, números inválidos/cero, filtro, orden, Gratis y rutas seguras aprobados sin red.
- **check-static.mjs:** 4 páginas, 43 recursos HTTP 200, anclas válidas, raíz Inicio y 4 rutas privadas bloqueadas. Detecta referencias PHP/rutas locales y operaciones de escritura incorporadas accidentalmente.
- **Originales:** Git sin diferencias en PHP, assets originales, includes, servicios, config, módulos, Composer y firebase.json frente a c4aa311.
- Las páginas temporales de QA y esquema se retiraron de public; no entran al commit. No quedan fixtures en el catálogo final.

Pruebas de navegador con viewport simulado, no dispositivos físicos; no es auditoría completa de seguridad o accesibilidad. No se probaron escrituras remotas, ni se alteraron datos para crear casos de prueba.

## Seguridad, riesgos y siguiente paso

**Cero escrituras Firebase ejecutadas.** Sin addDoc/setDoc/updateDoc/deleteDoc, batches, transacciones, cambios de Auth/RTDB/Storage, reglas o configuración remota. Sin deploy. servidor-linux, Flutter y ESP32 intactos.

La configuración Web pública facilitada puede versionarse; no se incorporó service account, clave privada, contraseña SMTP o token administrativo. Antes del commit se revisan candidatos y temporales.

La lectura de toda la colección depende de los permisos vigentes; si cambian, mostrar error y no abrir reglas. Un filtrado futuro por activo necesita considerar datos históricos y recordar que las reglas no filtran resultados. Para un catálogo mayor, evaluar consultas/paginación en otra fase. SDK/CDN y conectividad son dependencias de red; el catálogo no funciona offline por diseño de esta fase.

Siguiente paso: validación manual contra Console y revisión separada del alcance deseado de lectura pública. No habilitar pedidos, pagos o identidad ni cambiar reglas como parte de esta entrega.

## QUÉ DEBE VERIFICAR EDUARDO

1. En el proyecto ejecutar `node scripts/serve-static.mjs` si el servidor no está abierto.
2. Abrir `http://localhost:8080/productos.html` y comparar con Firestore Console → productos, sin editar documentos.
3. Revisar nombre, descripción, precio, ml, imagen, Gratis y Agotado. Confirmar que los siete inactivos observados no aparecen y los seis activos sí (los datos pueden cambiar después de la prueba).
4. Navegar Inicio → Nosotros → Productos → Información. Probar hamburguesa y Escape.
5. Probar 360, 390, 430, 768, 1024 y 1280 px; comprobar imágenes y textos largos en casos reales si existen.
6. Ejecutar `node scripts/check-static.mjs` y `node scripts/check-products.mjs`.
7. Revisar Console y Network. Los POST del transporte de lectura del SDK fueron autorizados; no equivalen a operaciones de escritura. No apareció permission-denied real durante esta fase.
8. Confirmar que no se creó, modificó ni eliminó ningún producto y que reglas/configuración Firebase no cambiaron.
9. Revisar el commit `feat: migrate products with firestore read access` y su push en main de Andrux88Felius/chichej-web; comprobar `git status` limpio tras la entrega.
10. Mantener servidor-linux, Flutter, ESP32 y Firebase externo intactos. No ejecutar firebase deploy ni generar QR.
