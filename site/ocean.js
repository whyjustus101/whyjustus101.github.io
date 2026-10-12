/** Native full-frame ocean film. A poster remains visible until a frame plays. */
export function createOceanScene(video, { videoUrl, onReady, onBlocked } = {}) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = [];
  let destroyed = false;
  let failed = false;
  let paused = false;
  let inView = true;
  let ready = false;
  let pending = false;
  let generation = 0;
  let frame = 0;
  let progress = 0;
  let observer;

  function listen(target, name, callback) {
    target.addEventListener(name, callback);
    listeners.push(() => target.removeEventListener(name, callback));
  }
  function active() {
    return !destroyed && !failed && !paused && !motion.matches && !document.hidden && inView;
  }
  function reveal() {
    frame = 0;
    if (!active() || ready || video.readyState < 2 || !video.videoWidth) return;
    ready = true;
    video.style.opacity = '1';
    onReady?.();
  }
  function stop() {
    generation += 1;
    pending = false;
    if (frame && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frame);
    frame = 0;
    video.pause();
  }
  function fallback() {
    if (destroyed || failed) return;
    failed = true;
    stop();
    video.style.opacity = '0';
    video.removeAttribute('src');
    video.load();
  }
  function sync() {
    if (destroyed) return;
    if (!active()) { stop(); return; }
    if (!video.getAttribute('src')) video.src = videoUrl;
    if (!ready && !frame && video.requestVideoFrameCallback) {
      frame = video.requestVideoFrameCallback(reveal);
    }
    if (pending || !video.paused) return;
    const attempt = ++generation;
    pending = true;
    let playing;
    try { playing = video.play(); } catch { fallback(); return; }
    Promise.resolve(playing).then(() => {
      if (destroyed || attempt !== generation) return;
      pending = false;
      if (!active()) { stop(); return; }
      if (!video.requestVideoFrameCallback) reveal();
    }).catch(error => {
      if (destroyed || attempt !== generation) return;
      pending = false;
      // A user gesture can retry blocked autoplay; intentional pauses abort play.
      if (error.name === 'NotAllowedError') { onBlocked?.(); return; }
      if (error.name === 'AbortError') return;
      fallback();
    });
  }
  function position() {
    const p = motion.matches ? 0 : progress;
    // Zoom into the filmed lower half. The image always covers every screen edge.
    video.style.transform = `translate3d(0, ${-p * 50}%, 0) scale(${1 + p})`;
  }
  const api = {
    setPaused(value) { paused = Boolean(value); sync(); },
    setProgress(value) {
      if (destroyed || !Number.isFinite(value)) return;
      progress = Math.max(0, Math.min(1, value));
      position();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      observer?.disconnect();
      listeners.forEach(remove => remove());
      video.style.opacity = '0';
      video.removeAttribute('src');
      video.load();
    },
  };
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'none';
  listen(video, 'error', fallback);
  listen(video, 'playing', () => { if (!video.requestVideoFrameCallback) reveal(); });
  listen(document, 'visibilitychange', sync);
  const changeMotion = () => { position(); sync(); };
  if (motion.addEventListener) listen(motion, 'change', changeMotion);
  else { motion.addListener(changeMotion); listeners.push(() => motion.removeListener(changeMotion)); }
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
    observer.observe(video.parentElement);
  }
  // main.js applies saved pause state before any media request is scheduled.
  return api;
}
