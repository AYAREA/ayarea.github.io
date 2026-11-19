(() => {
  const root = document.querySelector('.logo-stage');
  if (!root) return;

  const canvas = root.querySelector('canvas');
  const context = canvas?.getContext('2d');
  const button = root.querySelector('.logo-motion-toggle');
  if (!canvas || !context || !button) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = {
    tilt: 15,
    speed: 1,
    trails: 9,
    arc: 96,
    fade: 90,
    spacing: 2.3,
    size: 150,
    time: 0
  };

  let width = 400;
  let height = width / 1.3;
  let frame = 0;
  let previous = 0;
  let visible = true;
  let paused = reducedMotion.matches;
  let motionOverride = false;
  const gold = '#c4a060';
  const ivory = '#f4efe6';

  function goldMetal(rotation) {
    // Warm bronze shadows and champagne highlights travel with each orbit.
    if (typeof context.createConicGradient === 'function') {
      const gradient = context.createConicGradient(rotation - Math.PI / 2, width / 2, height * .46);
      [
        [0, '#9b681f'],
        [.12, '#e6b646'],
        [.22, '#fff0a4'],
        [.34, '#b67b25'],
        [.47, '#f7d982'],
        [.59, '#956119'],
        [.72, '#e9bb58'],
        [.84, '#fff0a4'],
        [.94, '#a66f20'],
        [1, '#9b681f']
      ].forEach(([stop, color]) => gradient.addColorStop(stop, color));
      return gradient;
    }

    const gradient = context.createLinearGradient(0, height * .46, width, height * .46);
    gradient.addColorStop(0, '#9b681f');
    gradient.addColorStop(.24, '#e6b646');
    gradient.addColorStop(.43, '#fff0a4');
    gradient.addColorStop(.62, '#b67b25');
    gradient.addColorStop(.82, '#f7d982');
    gradient.addColorStop(1, '#9b681f');
    return gradient;
  }

  function point(angle, rotation) {
    const tilt = state.tilt * Math.PI / 180;
    const x = Math.cos(angle) * Math.cos(tilt);
    const y = Math.sin(angle);
    const z = -Math.cos(angle) * Math.sin(tilt);
    return {
      x,
      y: y * Math.cos(rotation) - z * Math.sin(rotation),
      z: y * Math.sin(rotation) + z * Math.cos(rotation)
    };
  }

  function drawRing(rotation, opacity, lineWidth, frontHalf = false) {
    context.strokeStyle = goldMetal(rotation);
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.globalAlpha = opacity * (frontHalf ? 1 : .44);
    context.beginPath();
    let active = false;

    for (let index = 0; index <= 240; index += 1) {
      const projected = point(index / 240 * Math.PI * 2, rotation);
      if ((projected.z >= 0) !== frontHalf) {
        active = false;
        continue;
      }
      const radiusX = width * .36 * state.arc / 100;
      const radiusY = Math.min(height * .47, width * .275) * state.arc / 100;
      const x = width / 2 + projected.x * radiusX;
      const y = height * .46 - projected.y * radiusY;
      if (active) context.lineTo(x, y);
      else context.moveTo(x, y);
      active = true;
    }

    context.stroke();
    context.globalAlpha = 1;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const rotation = 5 * Math.PI / 180 + state.time / 12 * Math.PI * 2;

    for (let index = state.trails; index >= 1; index -= 1) {
      const age = index / (state.trails + 1);
      const opacity = .62 * ((1 - state.fade / 100) + state.fade / 100 * (1 - age) ** 2);
      drawRing(rotation - index * state.spacing * Math.PI / 180, opacity, Math.max(.85, width / 620));
    }
    drawRing(rotation, .95, Math.max(1.5, width / 390));

    context.fillStyle = ivory;
    context.textBaseline = 'middle';
    context.font = `400 ${width * .14 * state.size / 100}px "Raleway", sans-serif`;
    const letters = [...'AYAREA'];
    let spacing = width * .018;
    let wordWidth = letters.reduce((sum, letter) => sum + context.measureText(letter).width, 0) + spacing * (letters.length - 1);
    if (wordWidth > width * .94) {
      const fit = width * .94 / wordWidth;
      context.font = `400 ${width * .14 * state.size / 100 * fit}px "Raleway", sans-serif`;
      spacing *= fit;
      wordWidth = letters.reduce((sum, letter) => sum + context.measureText(letter).width, 0) + spacing * (letters.length - 1);
    }

    let x = (width - wordWidth) / 2;
    context.textAlign = 'left';
    letters.forEach(letter => {
      context.fillText(letter, x, height * .46);
      x += context.measureText(letter).width + spacing;
    });

    const tagline = 'TRANSFORMATION INSIDE. IMPACT OUTSIDE';
    const taglineSize = Math.max(14, width * .065);
    context.font = `600 ${taglineSize}px "Raleway", sans-serif`;
    const tracking = taglineSize * .035;
    const taglineWidth = [...tagline].reduce((sum, letter) => sum + context.measureText(letter).width, 0) + tracking * (tagline.length - 1);
    const fit = wordWidth / taglineWidth;
    const taglineY = height * .46 + height * .23;

    context.save();
    context.translate(width / 2, taglineY);
    context.scale(fit, fit);
    context.fillStyle = gold;
    let taglineX = -taglineWidth / 2;
    for (const letter of tagline) {
      context.fillText(letter, taglineX, 0);
      taglineX += context.measureText(letter).width + tracking;
    }
    context.restore();

    for (let index = state.trails; index >= 1; index -= 1) {
      const age = index / (state.trails + 1);
      const opacity = .62 * ((1 - state.fade / 100) + state.fade / 100 * (1 - age) ** 2);
      drawRing(rotation - index * state.spacing * Math.PI / 180, opacity, Math.max(.85, width / 620), true);
    }
    drawRing(rotation, .95, Math.max(1.5, width / 390), true);
  }

  function animate(now) {
    if (previous) state.time += Math.min((now - previous) / 1000, .06) * state.speed;
    previous = now;
    draw();
    frame = requestAnimationFrame(animate);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    const shouldAnimate = !paused && (!reducedMotion.matches || motionOverride) && visible && !document.hidden;
    button.setAttribute('aria-pressed', String(paused));
    button.setAttribute('aria-label', paused ? 'Reanudar animación del logo' : 'Pausar animación del logo');
    button.querySelector('[data-lang="es"]').textContent = paused ? 'Reanudar animación del logo' : 'Pausar animación del logo';
    button.querySelector('[data-lang="en"]').textContent = paused ? 'Resume logo animation' : 'Pause logo animation';
    if (shouldAnimate) frame = requestAnimationFrame(animate);
    else draw();
  }

  function resize() {
    width = canvas.getBoundingClientRect().width;
    height = canvas.getBoundingClientRect().height || width / 1.59;
    if (!width) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  button.addEventListener('click', () => {
    paused = !paused;
    motionOverride = reducedMotion.matches && !paused;
    sync();
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) {
      paused = true;
      motionOverride = false;
    }
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.fonts.load('400 32px Raleway').then(resize);
  document.fonts.load('600 12px Raleway').then(draw);
  resize();
  sync();
})();
