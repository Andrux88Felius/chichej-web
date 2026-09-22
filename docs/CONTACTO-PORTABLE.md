# Contacto portable

El original contacto.php envía mediante ContactMailService y PHPMailer/SMTP. Campos: nombre (2–80), organización (hasta 120), correo (hasta 254), motivo cerrado y mensaje (10–4000). No existe almacenamiento de consultas ni infraestructura de Functions confirmada en esta copia.

Se reutiliza el canal oficial existente WhatsApp 59177271557: el formulario prepara el texto y el usuario confirma el envío en WhatsApp. Nunca se presenta como enviado desde la web. No hay escrituras Firebase ni credenciales SMTP en el navegador. Nombre y correo pueden precargarse sin actualizar el perfil. El texto no se borra al preparar el enlace; no se persiste en equipos compartidos.

Pendiente: correo automático o bandeja administrativa requieren infraestructura y controles de acceso/antispam confirmados. No se crea una colección desprotegida. La confirmación de recepción corresponde a WhatsApp; una URL preparada no prueba entrega.
