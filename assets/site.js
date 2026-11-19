(() => {
  const languageButtons = [...document.querySelectorAll('[data-set-lang]')];
  const seasons = [...document.querySelectorAll('[data-season]')];
  const interestLinks = [...document.querySelectorAll('[data-interest-link]')];
  let language = 'es';
  let season = 'spring';

  try {
    const saved = localStorage.getItem('ayarea-language');
    if (saved === 'es' || saved === 'en') language = saved;
  } catch (_) {
    // The page works without storage when the browser blocks it.
  }

  function applyLanguage(nextLanguage) {
    language = nextLanguage;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-lang]').forEach(element => {
      element.hidden = element.dataset.lang !== language;
    });
    languageButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.setLang === language));
    });
    const nav = document.querySelector('.site-nav');
    nav?.setAttribute('aria-label', language === 'es' ? 'Navegación principal' : 'Main navigation');
    document.querySelector('.facts-list')?.setAttribute('aria-label', language === 'es' ? 'Datos del viaje' : 'Journey details');
    document.querySelector('.language-switch')?.setAttribute('aria-label', language === 'es' ? 'Idioma' : 'Language');
    try { localStorage.setItem('ayarea-language', language); } catch (_) { /* Optional preference. */ }
    updateInterestLinks();
  }

  function updateInterestLinks() {
    const seasonsInSpanish = { spring: 'Primavera', autumn: 'Otoño', both: 'Ambas temporadas' };
    const seasonsInEnglish = { spring: 'Spring', autumn: 'Autumn', both: 'Both seasons' };
    const seasonLabel = (language === 'es' ? seasonsInSpanish : seasonsInEnglish)[season];
    const subject = language === 'es'
      ? `Glastonbury 2027 — ${seasonLabel}`
      : `Glastonbury 2027 — ${seasonLabel}`;
    const body = language === 'es'
      ? `Hola AYAREA,\n\nMe interesa recibir información sobre Glastonbury 2027 (${seasonLabel.toLowerCase()}).\n\nGracias.`
      : `Hello AYAREA,\n\nI would like to receive information about Glastonbury 2027 (${seasonLabel.toLowerCase()}).\n\nThank you.`;
    const href = `mailto:hi@ayarea.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    interestLinks.forEach(link => { link.href = href; });
  }

  async function runLogoIntro() {
    const html = document.documentElement;
    const stage = document.querySelector('.logo-stage');
    if (!html.classList.contains('intro-loading') || !stage) return;
    const started = performance.now();
    const images = [...document.querySelectorAll('.first-viewport img')];
    const imageReady = Promise.all(images.map(image => {
      if (image.complete) return Promise.resolve();
      return new Promise(resolve => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
    await Promise.race([imageReady, new Promise(resolve => setTimeout(resolve, 1800))]);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 2000 - (performance.now() - started))));
    if (!html.classList.contains('intro-loading')) return;

    html.classList.remove('intro-loading');
    const target = stage.getBoundingClientRect();
    stage.style.width = `${target.width}px`;
    stage.style.height = `${target.height}px`;
    html.classList.add('intro-loading');
    const dx = target.left + target.width / 2 - innerWidth / 2;
    const dy = target.top + target.height / 2 - innerHeight / 2;
    const introScale = Math.max(1, Math.min(2.05, innerWidth * .86 / target.width, innerHeight * .68 / target.height));
    const from = `translate(-50%, -50%) scale(${introScale})`;
    const to = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`;
    html.classList.add('intro-reveal');
    const animation = stage.animate([
      { transform: from },
      { transform: to }
    ], { duration: 1050, easing: 'cubic-bezier(.2,.72,.22,1)', fill: 'forwards' });
    await animation.finished.catch(() => {});
    animation.cancel();
    stage.style.width = '';
    stage.style.height = '';
    stage.style.transform = '';
    html.classList.remove('intro-loading', 'intro-reveal');
  }

  languageButtons.forEach(button => {
    button.addEventListener('click', () => applyLanguage(button.dataset.setLang));
  });
  seasons.forEach(button => {
    button.addEventListener('click', () => {
      season = button.dataset.season;
      seasons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      updateInterestLinks();
    });
  });

  document.querySelectorAll('[data-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });
  applyLanguage(language);
  runLogoIntro();
})();
