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

  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = button.parentElement?.querySelector('input');
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Ocultar' : 'Ver';
      button.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });

  document.querySelectorAll('[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const status = form.querySelector('.form-status');
      if (status) status.textContent = 'Vista de demostración: la información no fue enviada ni almacenada.';
    });
  });

  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = form.querySelector('[data-contact-status]');
      const submit = form.querySelector('[data-contact-submit]');
      const endpoint = form.dataset.contactEndpoint;
      if (!status || !submit || !endpoint || !form.reportValidity()) return;
      submit.disabled = true; submit.setAttribute('aria-busy', 'true');
      status.className = 'form-status'; status.textContent = 'Enviando tu mensaje…';
      const payload = {
        csrf_token: form.elements.csrf_token?.value || '', email: form.elements.email?.value.trim() || '',
        message: form.elements.message?.value.trim() || '', name: form.elements.name?.value.trim() || '',
        organization: form.elements.organization?.value.trim() || '', reason: form.elements.reason?.value || '',
        website: form.elements.website?.value || '',
      };
      try {
        const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.success !== true) throw new Error(result.code || 'server_error');
        form.reset(); status.textContent = 'Tu mensaje fue enviado correctamente. Gracias por comunicarte con CHICHEJ.';
      } catch (error) {
        const messages = { invalid_name: 'Revisa el nombre ingresado.', invalid_email: 'Ingresa un correo electrónico válido.', invalid_organization: 'La organización supera la longitud permitida.', invalid_reason: 'Selecciona un motivo válido.', invalid_message: 'El mensaje debe contener entre 10 y 4000 caracteres.', invalid_csrf: 'La sesión cambió. Recarga la página e inténtalo nuevamente.', rate_limited: 'Espera un minuto antes de enviar otro mensaje.', service_unavailable: 'El servicio de correo todavía no está disponible. Inténtalo más tarde.', delivery_failed: 'No pudimos entregar tu mensaje en este momento. Inténtalo nuevamente más tarde.' };
        status.className = 'form-status form-status--error'; status.textContent = messages[error?.message] || 'No fue posible enviar el mensaje en este momento.';
      } finally { submit.disabled = false; submit.removeAttribute('aria-busy'); }
    });
  });

  document.querySelectorAll('[data-notify]').forEach((button) => {
    button.addEventListener('click', () => {
      let toast = document.querySelector('.toast');
      if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
      toast.textContent = button.dataset.notify || 'Función disponible próximamente.';
      toast.classList.add('is-visible');
      window.setTimeout(() => toast?.classList.remove('is-visible'), 2800);
    });
  });

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

  const avatarPreview = document.querySelector('.profile-avatar');
  const avatarStatus = document.querySelector('[data-avatar-status]');
  const profileForm = document.querySelector('[data-profile-form]');
  document.querySelectorAll('[data-avatar-src]').forEach((button, index) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-avatar-src]').forEach((item) => item.classList.remove('is-selected'));
      button.classList.add('is-selected');
      if (avatarPreview) avatarPreview.src = button.dataset.avatarSrc;
      if (profileForm?.elements.avatarPath && button.dataset.avatarValue) profileForm.elements.avatarPath.value = button.dataset.avatarValue;
      if (avatarStatus) avatarStatus.textContent = `Avatar ${index + 1} seleccionado. Guarda los cambios para conservarlo.`;
    });
  });

  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault(); const status = profileForm.querySelector('[data-profile-status]'); const submit = profileForm.querySelector('button[type="submit"]'); const endpoint = profileForm.dataset.profileEndpoint;
    if (!status || !submit || !endpoint) return; submit.disabled = true; status.className = 'form-status'; status.textContent = 'Guardando cambios…';
    const payload = { csrf_token: profileForm.elements.csrf_token?.value || '', nombre: profileForm.elements.nombre?.value.trim() || '', avatarPath: profileForm.elements.avatarPath?.value || '', telefono: profileForm.elements.telefono?.value.trim() || '' };
    try {
      const response = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }); const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error(result.code || 'server');
      document.querySelector('.profile-card h2')?.replaceChildren(document.createTextNode(result.name));
      document.querySelectorAll('.nav-account img').forEach((image) => { image.src = `../assets/img/avatares/${result.avatarPath.split('/').pop()}`; });
      status.textContent = 'Perfil actualizado correctamente.';
    } catch (error) {
      status.className = 'form-status form-status--error';
      const messages = { invalid_name: 'El nombre debe tener entre 2 y 80 caracteres.', invalid_phone: 'El teléfono contiene caracteres no permitidos.', invalid_avatar: 'Selecciona un avatar CHICHEJ válido.', invalid_csrf: 'La sesión cambió. Recarga la página e inténtalo nuevamente.' };
      status.textContent = messages[error?.message] || 'No fue posible guardar el perfil en este momento.';
    } finally { submit.disabled = false; }
  });

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
