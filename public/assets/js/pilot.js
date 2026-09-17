// Menú, animaciones y audio conservados del app.js original; sin APIs ni sesión.
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  const closeMenu = () => {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('.sr-only')?.replaceChildren(document.createTextNode('Abrir menú'));
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only')?.replaceChildren(document.createTextNode(open ? 'Cerrar menú' : 'Abrir menú'));
    nav?.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  });

  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeMenu(); toggle?.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeMenu(); });
  window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 18), { passive: true });
  header?.classList.toggle('is-scrolled', window.scrollY > 18);

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.12 })
    : null;
  document.querySelectorAll('.reveal').forEach((element) => observer ? observer.observe(element) : element.classList.add('is-visible'));

  const player = document.querySelector('[data-sound-player]');
  const audio = player?.querySelector('[data-audio]');
  const playButton = player?.querySelector('[data-audio-toggle]');
  const muteButton = player?.querySelector('[data-audio-mute]');
  const trackSelect = player?.querySelector('[data-track-select]');
  const trackName = player?.querySelector('[data-track-name]');
  const playIcon = player?.querySelector('[data-audio-icon]');
  const muteIcon = player?.querySelector('[data-mute-icon]');

  const syncAudioControls = () => {
    if (!audio || !playButton || !muteButton) return;
    const playing = !audio.paused;
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    if (playIcon) playIcon.textContent = playing ? 'Ⅱ' : '▶';
    muteButton.setAttribute('aria-pressed', String(audio.muted));
    muteButton.setAttribute('aria-label', audio.muted ? 'Activar música' : 'Silenciar música');
    if (muteIcon) muteIcon.textContent = audio.muted ? '×' : '♪';
  };

  playButton?.addEventListener('click', async () => {
    if (!audio) return;
    if (audio.paused) { try { await audio.play(); } catch (_) { /* El navegador puede impedir la reproducción. */ } }
    else audio.pause();
    syncAudioControls();
  });
  muteButton?.addEventListener('click', () => { if (audio) { audio.muted = !audio.muted; syncAudioControls(); } });
  trackSelect?.addEventListener('change', async () => {
    if (!audio || !trackSelect) return;
    const wasPlaying = !audio.paused;
    audio.src = trackSelect.value;
    if (trackName) trackName.textContent = trackSelect.options[trackSelect.selectedIndex].text;
    if (wasPlaying) { try { await audio.play(); } catch (_) { /* Requiere interacción del usuario. */ } }
    syncAudioControls();
  });
  audio?.addEventListener('ended', syncAudioControls);
  syncAudioControls();

  document.querySelectorAll('[data-year]').forEach(element => { element.textContent = String(new Date().getFullYear()); });
});
