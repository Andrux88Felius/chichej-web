# Dispensador y pedidos: alcance seguro

Fuentes revisadas: dispensar.php, includes/views/admin-module-ux.php, admin-data-live.php, user-data-ux.php y includes/firebase-data.php. El PHP de dispensar es una demostración deshabilitada; no contiene creación de pedido, acuse ESP32 ni recuperación. Los paneles originales consultan datos, con controles deshabilitados. No se ha inspeccionado ni alterado ningún proyecto protegido externo.

Firestore: productos usa el normalizador portable existente (activo, agotado, esGratis, precio, cantidadMl, opcion). pedidos conserva usuarioId, nombreUsuario, items, total, fechaCreacion, estado, estadoPago, metodoPago, origen, tipoUsuario, procesado e identificadores existentes. Las ventas físicas no necesitan usuarioId en el listado administrativo. El cliente consulta únicamente where usuarioId == UID autenticado.

RTDB: dispensador/principal, campos originales estado, bomba, agitador, nivelliquido, distanciaCm, productoactual. Se muestra el valor registrado, no se interpreta como una conexión actual ni se inventa un porcentaje o estado. No hay timestamp/heartbeat ni identificador de pedido actual confirmado en estas vistas. No se afirma que la configuración Firestore sea el protocolo ESP32.

Arquitectura disponible: navegador → Firebase Auth/perfil RTDB → consultas Firestore/RTDB. Flutter y ESP32 continúan utilizando los datos existentes; esta intervención no escribe en ellos. Las nuevas páginas no incorporan operaciones de creación, actualización, eliminación ni transacciones.

Dispensar permite consultar y seleccionar una presentación real, leer el último estado RTDB con sesión y acceder a pedidos propios. Administración permite leer máquina y pedidos con rol admin/admin_principal; búsqueda y filtro son locales. Firebase sigue siendo responsable de autorizar cada lectura: ocultar una vista no sustituye reglas. Permisos de lectura con cuentas reales pendientes de verificación por Eduardo.

Recuperación atascados: bloqueada por ausencia de protocolo confirmado de correlación pedido/actuador, heartbeat fiable y acuse de finalización. No se usa un tiempo arbitrario, no se marca entregado, no se retorna a pendiente ni se borra historial. No hay botón de recuperación que aparente una acción segura sin evidencia. Antes de habilitarlo se debe revisar el protocolo real con evidencia de máquina detenida y mecanismo atómico compatible. La publicación no habilita actuadores.
