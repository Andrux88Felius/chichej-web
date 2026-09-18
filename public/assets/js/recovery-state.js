export const recoveryConfirmation = 'Si el correo corresponde a una cuenta válida, recibirás instrucciones para restablecer tu contraseña.';

export function createRecovery(sendEmail) {
  let busy = false;
  return async email => {
    if (busy) return null;
    const mail = typeof email === 'string' ? email.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return { ok: false, message: 'Introduce un correo electrónico válido.' };
    busy = true;
    try { await sendEmail(mail); return { ok: true, message: recoveryConfirmation }; }
    catch (error) {
      if (['auth/user-not-found', 'auth/user-disabled'].includes(error?.code)) return { ok: true, message: recoveryConfirmation };
      const message = error?.code === 'auth/invalid-email' ? 'Introduce un correo electrónico válido.'
        : error?.code === 'auth/too-many-requests' ? 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.'
        : error?.code === 'auth/network-request-failed' ? 'No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.'
        : 'No se pudo solicitar el enlace. Inténtalo nuevamente más tarde.';
      return { ok: false, message };
    } finally { busy = false; }
  };
}
