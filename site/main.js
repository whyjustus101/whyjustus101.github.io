import { createOceanScene } from './ocean.js?v=20261013-single-shot';
import { createParticleField } from './particles.js?v=20261012';

const root = document.documentElement;
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroContent = document.querySelector('.hero-content');
const video = document.querySelector('#ocean-video');
const motionButton = document.querySelector('.motion-toggle');
const motionLabel = document.querySelector('.motion-label');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
root.classList.add('has-js');

const ocean = createOceanScene(video, {
  videoUrl: new URL('./assets/ocean-dome-4k.mp4', import.meta.url).href,
  onReady: () => root.classList.add('scene-ready'),
  onBlocked: () => { manuallyPaused = true; syncMotion(); },
});
const particles = createParticleField(document.querySelector('#ocean-particles'));

let manuallyPaused = false;
try { manuallyPaused = localStorage.getItem('ocean-motion') === 'paused'; } catch { /* Storage is optional. */ }
let beyondHero = false;
let scrollFrame = 0;

function syncMotion() {
  const paused = manuallyPaused || reducedMotion.matches;
  ocean.setPaused(paused);
  particles.setPaused(paused || beyondHero);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? '播放背景动效' : '暂停背景动效');
  motionLabel.textContent = paused ? '播放动态' : '暂停动态';
  if (reducedMotion.matches) {
    motionLabel.textContent = '已减少动态';
    motionButton.setAttribute('aria-label', '已跟随系统减少动态效果');
    motionButton.disabled = true;
  } else {
    motionButton.disabled = false;
  }
}

function renderScroll() {
  scrollFrame = 0;
  const y = window.scrollY;
  const heroHeight = hero.offsetHeight;
  const progress = Math.min(1, Math.max(0, y / heroHeight));
  header.classList.toggle('is-scrolled', y > 45);
  ocean.setProgress(progress);
  particles.setProgress(progress);
  const nowBeyond = y > heroHeight * 1.35;
  if (nowBeyond !== beyondHero) {
    beyondHero = nowBeyond;
    syncMotion();
  }
  if (!reducedMotion.matches) {
    heroContent.style.transform = `translate3d(0, ${Math.min(y * .2, 170)}px, 0)`;
    heroContent.style.opacity = String(Math.max(0, 1 - progress * 1.3));
  } else {
    heroContent.style.transform = '';
    heroContent.style.opacity = '';
  }
}

function requestScroll() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScroll);
}

motionButton.addEventListener('click', () => {
  manuallyPaused = !manuallyPaused;
  try { localStorage.setItem('ocean-motion', manuallyPaused ? 'paused' : 'playing'); } catch { /* Storage is optional. */ }
  syncMotion();
});
const onMotionChange = () => { syncMotion(); requestScroll(); };
if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
else reducedMotion.addListener(onMotionChange);
window.addEventListener('scroll', requestScroll, { passive: true });
window.addEventListener('resize', requestScroll, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    const offset = target.id === 'top' ? 0 : 100;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
    if (link.classList.contains('skip-link')) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
});

if ('IntersectionObserver' in window) {
  const reveals = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        reveals.unobserve(entry.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px 10px 0px' });
  document.querySelectorAll('.reveal').forEach(element => reveals.observe(element));
  const navigation = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`[data-nav="${entry.target.id}"]`);
      link?.classList.toggle('is-active', entry.isIntersecting);
      if (link?.getAttribute('href').startsWith('#')) {
        if (entry.isIntersecting) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    });
  }, { rootMargin: '-20% 0px -25% 0px' });
  document.querySelectorAll('#work, #notes').forEach(element => navigation.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
}

document.querySelector('#current-year').textContent = String(new Date().getFullYear());
window.addEventListener('pagehide', () => { ocean.setPaused(true); particles.setPaused(true); });
window.addEventListener('pageshow', () => { renderScroll(); syncMotion(); });
renderScroll();
syncMotion();
