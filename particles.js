/** A quiet field of light that yields to the pointer, then settles back. */
export function createParticleField(canvas) {
  const noop = { setPaused() {}, setProgress() {}, destroy() {} };
  let context;
  try { context = canvas?.getContext('2d', { alpha: true }); } catch { return noop; }
  if (!context) return noop;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const colors = ['224,249,255', '153,212,255', '206,195,255'];
  const removers = [];
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, present: false, strength: 0 };
  let particles = [];
  let width = 0;
  let height = 0;
  let ratio = 1;
  let radius = 260;
  let frame = 0;
  let previousTime = 0;
  let nextFrameTime = 0;
  const frameInterval = 1000 / 60;
  let elapsed = 0;
  let progress = 0;
  let paused = false;
  let destroyed = false;
  let inView = true;
  let pageHidden = false;
  let dirty = true;
  let staticMode = reduced.matches || !finePointer.matches;

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    removers.push(() => target.removeEventListener(type, handler, options));
  }

  function listenMedia(query, handler) {
    if (query.addEventListener) listen(query, 'change', handler);
    else {
      query.addListener(handler);
      removers.push(() => query.removeListener(handler));
    }
  }

  function visible() {
    return !destroyed && inView && !pageHidden && !document.hidden && width > 0 && height > 0;
  }

  function animated() {
    return visible() && !paused && !staticMode && progress < 1;
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    nextFrameTime = 0;
  }

  function schedule() {
    if (!frame && animated()) frame = requestAnimationFrame(tick);
  }

  function draw() {
    if (!visible()) return;
    context.clearRect(0, 0, width, height);
    const fade = Math.pow(1 - progress, 1.6);
    if (fade > 0) {
      context.lineCap = 'round';
      for (const particle of particles) {
        const energy = particle.energy;
        const x = particle.u * width + particle.driftX + particle.offsetX;
        const y = particle.v * height + particle.driftY + particle.offsetY;
        const half = (0.65 + energy * 3.35) / 2;
        const dx = Math.cos(particle.angle) * half;
        const dy = Math.sin(particle.angle) * half;
        context.strokeStyle = `rgba(${colors[particle.color]},${fade * (particle.opacity + energy * 0.68)})`;
        context.lineWidth = particle.size + energy * 0.68;
        context.beginPath();
        context.moveTo(x - dx, y - dy);
        context.lineTo(x + dx, y + dy);
        context.stroke();
      }
    }
    dirty = false;
  }

  function invalidate() {
    dirty = true;
    if (!animated()) draw();
    schedule();
  }

  function advance(delta) {
    elapsed += delta;
    const follow = 1 - Math.exp(-delta / 0.25);
    const settle = 1 - Math.exp(-delta / 0.29);
    const appear = 1 - Math.exp(-delta / 0.27);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;
    pointer.strength += ((pointer.present ? 1 : 0) - pointer.strength) * appear;

    for (const particle of particles) {
      particle.driftX = Math.sin(elapsed * 0.23 + particle.phase) * 2.8;
      particle.driftY = Math.cos(elapsed * 0.19 + particle.phase * 1.7) * 2.3;
      const dx = particle.u * width + particle.driftX - pointer.x;
      const dy = particle.v * height + particle.driftY - pointer.y;
      const distance = Math.max(0.1, Math.hypot(dx, dy));
      const q = distance / radius;
      const pressure = Math.pow(Math.max(0, 1 - q), 1.4) * radius * 0.30 * pointer.strength;
      const ring = Math.exp(-Math.pow((q - 0.58) / 0.27, 2)) * pointer.strength;
      const curl = ring * Math.sin(elapsed * 0.26 + particle.phase * 0.2) * 7;
      const targetX = dx / distance * pressure - dy / distance * curl;
      const targetY = dy / distance * pressure + dx / distance * curl;
      particle.offsetX += (targetX - particle.offsetX) * settle;
      particle.offsetY += (targetY - particle.offsetY) * settle;
      particle.energy += (ring - particle.energy) * settle;
      const outward = Math.atan2(dy, dx) + 0.32 * Math.sin(elapsed * 0.2 + particle.phase * 0.1);
      const targetAngle = particle.baseAngle + Math.atan2(
        Math.sin(outward - particle.baseAngle), Math.cos(outward - particle.baseAngle),
      ) * Math.min(1, particle.energy * 2.5);
      particle.angle += Math.atan2(
        Math.sin(targetAngle - particle.angle), Math.cos(targetAngle - particle.angle),
      ) * settle;
    }
  }

  function tick(now) {
    frame = 0;
    if (!animated()) return;
    // Keep high-refresh screens from multiplying physics and canvas work.
    if (now + 0.5 < nextFrameTime) { schedule(); return; }
    nextFrameTime = nextFrameTime > 0 && now - nextFrameTime < frameInterval
      ? nextFrameTime + frameInterval : now + frameInterval;
    const delta = previousTime ? Math.min(0.04, Math.max(0, (now - previousTime) / 1000)) : 1 / 60;
    previousTime = now;
    advance(delta);
    draw();
    schedule();
  }

  function seedField() {
    // Jittered cells avoid accidental clumps without looking like a dot grid.
    const count = Math.min(staticMode ? 120 : 600, Math.max(60, Math.round(width * height / (staticMode ? 4900 : 2600))));
    const columns = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * width / height))));
    const rows = Math.max(1, Math.floor(count / columns));
    let seed = 71723;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    particles = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const baseAngle = random() * Math.PI * 2;
        particles.push({
          u: (x + 0.08 + random() * 0.84) / columns,
          v: (y + 0.08 + random() * 0.84) / rows,
          phase: random() * Math.PI * 2,
          color: random() < 0.72 ? 0 : random() < 0.65 ? 1 : 2,
          size: 0.62 + random() * 0.32,
          opacity: 0.16 + random() * 0.19,
          baseAngle, angle: baseAngle, energy: 0,
          offsetX: 0, offsetY: 0, driftX: 0, driftY: 0,
        });
      }
    }
  }

  function resize(force = false) {
    if (destroyed) return;
    const bounds = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    const nextRatio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(2000000 / (nextWidth * nextHeight)));
    const sizeChanged = width !== nextWidth || height !== nextHeight;
    if (!force && !sizeChanged && ratio === nextRatio) return;
    width = nextWidth;
    height = nextHeight;
    ratio = nextRatio;
    radius = Math.min(300, Math.max(210, width * 0.21));
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (sizeChanged || force) seedField();
    if (!pointer.present) {
      pointer.x = pointer.targetX = width * 0.5;
      pointer.y = pointer.targetY = height * 0.47;
    }
    invalidate();
  }

  function move(event) {
    if (destroyed || staticMode || paused || event.pointerType === 'touch') return;
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const inside = x >= 0 && x <= width && y >= 0 && y <= height;
    if (inside && !pointer.present && pointer.strength < 0.01) {
      pointer.x = x;
      pointer.y = y;
    }
    pointer.targetX = x;
    pointer.targetY = y;
    pointer.present = inside;
  }

  function leave() { pointer.present = false; }
  function syncVisibility() {
    if (!visible()) stop();
    else { if (dirty) draw(); schedule(); }
  }
  function syncMedia() {
    const next = reduced.matches || !finePointer.matches;
    if (next === staticMode) return;
    staticMode = next;
    pointer.present = false;
    pointer.strength = 0;
    stop();
    resize(true);
  }

  listen(window, 'pointermove', move, { passive: true });
  listen(document.documentElement, 'pointerleave', leave, { passive: true });
  listen(window, 'blur', leave);
  listen(window, 'resize', () => resize(), { passive: true });
  listen(document, 'visibilitychange', syncVisibility);
  listen(window, 'pagehide', () => { pageHidden = true; stop(); });
  listen(window, 'pageshow', () => { pageHidden = false; syncVisibility(); });
  listenMedia(reduced, syncMedia);
  listenMedia(finePointer, syncMedia);
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => resize()) : null;
  resizeObserver?.observe(canvas);
  const intersectionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    inView = entries[entries.length - 1]?.isIntersecting ?? true;
    syncVisibility();
  }) : null;
  intersectionObserver?.observe(canvas);
  resize();

  return {
    setPaused(value) {
      if (destroyed || Boolean(value) === paused) return;
      paused = Boolean(value);
      if (paused) { stop(); if (dirty) draw(); }
      else schedule();
    },
    setProgress(value) {
      if (destroyed || !Number.isFinite(value)) return;
      const next = Math.max(0, Math.min(1, value));
      if (next === progress) return;
      progress = next;
      if (progress === 1) stop();
      invalidate();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      removers.forEach(remove => remove());
      particles = [];
      context.clearRect(0, 0, width, height);
    },
  };
}
