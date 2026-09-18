// Menú, animaciones, audio y carrusel local; sin APIs ni sesión.
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
  document.addEventListener('focusin', (event) => {
    if (toggle?.getAttribute('aria-expanded') === 'true' && !nav?.contains(event.target) && !toggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); } });
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
  document.querySelectorAll('[data-carousel]').forEach((carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
    const previous = carousel.querySelector('[data-carousel-prev]');
    const next = carousel.querySelector('[data-carousel-next]');
    const current = carousel.querySelector('[data-carousel-current]');
    const status = carousel.querySelector('[data-carousel-status]');
    let activeIndex = Math.max(0, slides.findIndex((slide) => slide.dataset.featured === 'true'));
    let pointerStart = null;
    let autoplayTimer = null;
    let isHovered = false;
    const autoplayDelay = 6000;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showSlide = (requestedIndex, announce = true) => {
      if (!track || slides.length === 0) return;
      activeIndex = (requestedIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
      slides.forEach((slide, index) => {
        const active = index === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, index) => {
        const active = index === activeIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', String(active));
      });
      if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
      if (status && announce) status.textContent = `Promoción ${activeIndex + 1} de ${slides.length}`;
    };

    const stopAutoplay = () => {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (reduceMotion || isHovered || document.hidden) return;
      autoplayTimer = window.setTimeout(() => {
        showSlide(activeIndex + 1, false);
        startAutoplay();
      }, autoplayDelay);
    };

    const manualNavigation = (index) => {
      stopAutoplay();
      showSlide(index);
      startAutoplay();
    };

    previous?.addEventListener('click', () => manualNavigation(activeIndex - 1));
    next?.addEventListener('click', () => manualNavigation(activeIndex + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => manualNavigation(index)));
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); manualNavigation(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); manualNavigation(activeIndex + 1); }
    });
    carousel.addEventListener('mouseenter', () => { isHovered = true; stopAutoplay(); });
    carousel.addEventListener('mouseleave', () => { isHovered = false; startAutoplay(); });
    carousel.addEventListener('pointerdown', (event) => { pointerStart = event.clientX; stopAutoplay(); });
    carousel.addEventListener('pointerup', (event) => {
      if (pointerStart === null) { startAutoplay(); return; }
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) >= 45) showSlide(activeIndex + (distance < 0 ? 1 : -1));
      startAutoplay();
    });
    carousel.addEventListener('pointercancel', () => { pointerStart = null; startAutoplay(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAutoplay(); else startAutoplay(); });
    showSlide(activeIndex, false);
    startAutoplay();
  });
});
