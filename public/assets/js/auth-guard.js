// Solo consume la sesión validada por onAuthStateChanged y su lectura propia RTDB.
export function protectAccount(session, view, navigate) {
  return session.subscribe(state => {
    view.clear();
    if (state.status === 'authenticated') {
      view.show(state.profile);
    } else if (state.status === 'anonymous') {
      view.message('Redirigiendo al inicio de sesión…');
      navigate('../login.html');
    } else {
      view.message(state.message || (state.status === 'checking' ? 'Cargando tu perfil…' : 'Comprobando sesión…'));
    }
  });
}
