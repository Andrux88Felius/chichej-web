# Promociones portables — solo lectura

Origen confirmado: Firestore, colección mensajes. Se analizaron usuario/promociones.php, includes/views/user-data-ux.php, includes/views/products-live.php, includes/promotions-carousel.php y la vista administrativa de mensajes.

La vista pública PHP toma publicaciones con activo booleano true y tipo exactamente promocion. La vista de clientes exige sesión y muestra todas las publicaciones activas, incluyendo avisos informativos. No se encontró segmentación por UID ni campañas exclusivas adicionales. La página portable promociones.html preserva ambos criterios: promociones para visitantes, y también avisos activos después de validar la sesión. Al perder sesión se descartan resultados privados pendientes y se vuelve a consultar solo promociones públicas. No se conceden muestras, beneficios ni derechos por leer una publicación.

Consulta real de solo lectura del 22 de septiembre de 2026: 15 documentos en mensajes; 2 de tipo promocion, ambos inactivos; 0 promociones públicas visibles. Existe 1 informativo activo que la vista autenticada puede mostrar como Informativo, no como promoción. El navegador anónimo confirmó 0 promociones activas sin errores de consola ni permission-denied. Una consulta inicial desde el entorno restringido agotó el tiempo de conexión; la consulta autorizada posterior funcionó.

Campos reales encontrados: titulo, mensaje, tipo, activo, fechaCreacion, fechaActualizacion, creadoPorNombre y creadoPorUid. Las cards solo muestran título, mensaje, tipo y fecha de publicación. No exponen autor/UID administrativo.

No existen campos de imagen, inicio/fin de vigencia, disponibilidad adicional ni beneficio separado en el esquema observado. El original decide visibilidad únicamente por activo; no infiere vencimiento a partir del texto ni de fechaCreacion. Se conserva esa lógica, permitida expresamente por la solicitud. La fecha de creación se etiqueta como publicación; la vigencia se indica como no especificada. El beneficio, si existe, es parte del mensaje sin interpretación ni concesión automática. No se inventaron campos o descuentos.

Las imágenes mensuales del carrusel original son campañas estáticas sin vínculo ni vigencia confirmados en mensajes. No se asociaron a documentos ni se mostraron como promociones actuales. Por tanto las cards son textuales hasta que exista un esquema de imágenes real autorizado. Tampoco se reinterpretó el aviso informativo activo como promoción por su contenido.

Lectura SDK oficial compartiendo la configuración existente: getDocsFromServer y query/where sobre mensajes; ningún método de escritura. Filtro servidor activo=true y, para visitantes, tipo=promocion. Segunda validación local estricta. Orden por fechaCreacion descendente. Sin fallback ficticio: vacío y errores tienen mensajes separados. No se cambiaron reglas, datos, usuarios, productos, reservas ni sus módulos; en HTML existente solo se habilitaron enlaces de navegación y la tarjeta de acceso a Promociones. Sin deploy ni cambios en Flutter, ESP32 o servidor-linux.

Página: public/promociones.html. Módulos: promotions-firebase.js, promotions-view.js y promotions-ui.js. Enlaces habilitados en las once páginas portables. Estilos CHICHEJ de cards y responsive en pilot.css. Check estático ampliado para la nueva página y check-account ajustado para permitir el enlace ya disponible.

Checks ejecutados: check-static, check-auth, check-products, check-register, check-account, check-profile-edit, check-reservations, check-admin-reservations y check-promotions. El último verifica separación pública/autenticada, activo estrictamente booleano y ausencia de escrituras. Check-static: 11 páginas y 95 recursos HTTP correctos.

Responsive: 360, 390, 430, 768, 1024 y 1280 px sin scroll horizontal en la página real vacía y con tres cards de texto largo en un arnés exclusivamente local de diseño. El arnés no usó Firebase ni se incluyó en el commit. No hay contenido de prueba en producción.

Pendiente para Eduardo: comprobar el aviso con sesión y, cuando una promoción real se active por los mecanismos administrativos existentes, su visualización. Esta migración no activa ninguna publicación ni crea datos.
