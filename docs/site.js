/* Dramatic Pause — landing page.
   The live demo runs the extension's own content.js (loaded right after this file) on a player marked up like
   YouTube's. This file stands in for chrome.storage so the demo can switch styles, drives the player, and runs the
   page's own theatre: the headline's beat, the timecode that stops whenever the video is paused, the cursor. */
(() => {
'use strict';

/* Fill these in once the builds and the store listing exist. While a link is empty, its button says "coming soon". */
const LINKS = {
  chromium: '',        // Chrome / Edge / Brave build
  safari: '',          // Safari build
  chromeWebStore: ''   // Chrome Web Store listing
};
const INSTALL_GUIDE = 'https://github.com/hados1109/dramaticPause#installation';

/* ───────────────────────── Toast ───────────────────────── */
const toastEl = document.getElementById('toast');
let toastTimer = 0;
function toast(text, link){
  toastEl.textContent = text;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = link.text;
    toastEl.append(' ', a);
  }
  toastEl.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 5000);
}
toastEl.addEventListener('pointerenter', () => clearTimeout(toastTimer));
toastEl.addEventListener('pointerleave', () => { toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2000); });

/* ───────────────────────── Download button ───────────────────────── */
const BROWSERS = {
  chrome:  { family: 'chromium', name: 'Chrome',  icon: 'i-chrome' },
  edge:    { family: 'chromium', name: 'Edge',    icon: 'i-edge' },
  brave:   { family: 'chromium', name: 'Brave',   icon: 'i-brave' },
  opera:   { family: 'chromium', name: 'Opera',   icon: 'i-download' },
  vivaldi: { family: 'chromium', name: 'Vivaldi', icon: 'i-download' },
  safari:  { family: 'safari',   name: 'Safari',  icon: 'i-safari' }
};
function detectBrowser(){
  const ua = navigator.userAgent;
  const brands = ((navigator.userAgentData && navigator.userAgentData.brands) || []).map(b => b.brand).join(' ');
  if (navigator.brave) return 'brave';
  if (/Edg(A|iOS)?\//.test(ua) || /Microsoft Edge/.test(brands)) return 'edge';
  if (/OPR\/|Opera/.test(ua) || /Opera/.test(brands)) return 'opera';
  if (/Vivaldi/.test(ua)) return 'vivaldi';
  if (/Chrome\/|Chromium|CriOS/.test(ua) || /Chromium|Google Chrome/.test(brands)) return 'chrome';
  if (/Safari\//.test(ua) && /Apple/.test(navigator.vendor || '')) return 'safari';
  return 'chrome';   // Firefox and the rest: offer the Chromium build first
}
const current = BROWSERS[detectBrowser()];
const other = current.family === 'safari'
  ? { family: 'chromium', name: 'Chrome', icon: 'i-chrome', sub: 'Also Edge, Brave, Arc and Opera' }
  : { family: 'safari', name: 'Safari', icon: 'i-safari', sub: 'macOS' };

const split = document.getElementById('download');
const mainBtn = document.getElementById('download-main');
const toggleBtn = document.getElementById('download-toggle');
const altBtn = document.getElementById('download-alt');
const setIcon = (el, id) => el.querySelector('use').setAttribute('href', `#${id}`);

setIcon(mainBtn, current.icon);
mainBtn.querySelector('.split-label').textContent = `Download for ${current.name}`;
setIcon(altBtn, other.icon);
altBtn.querySelector('.split-item-label').textContent = `Download for ${other.name}`;
altBtn.querySelector('.split-item-sub').textContent = other.sub;

function download(family){
  if (LINKS[family]) { location.href = LINKS[family]; return; }
  if (family === 'safari') toast('The Safari version is on its way.');
  else toast('The download is on its way. You can already install it by hand:', { href: INSTALL_GUIDE, text: 'see how on GitHub' });
}
function setMenu(open, focusItem){
  split.classList.toggle('is-open', open);
  toggleBtn.setAttribute('aria-expanded', String(open));
  if (open && focusItem) altBtn.focus();
}
mainBtn.addEventListener('click', () => download(current.family));
altBtn.addEventListener('click', () => { setMenu(false); toggleBtn.focus(); download(other.family); });
toggleBtn.addEventListener('click', () => setMenu(!split.classList.contains('is-open')));
toggleBtn.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setMenu(true, true); }
});
split.addEventListener('keydown', e => {
  if (e.key === 'Escape' && split.classList.contains('is-open')) { e.preventDefault(); setMenu(false); toggleBtn.focus(); }
});
split.addEventListener('focusout', e => { if (!split.contains(e.relatedTarget)) setMenu(false); });
document.addEventListener('pointerdown', e => { if (!split.contains(e.target)) setMenu(false); });

const storeLink = document.getElementById('store-link');
if (LINKS.chromeWebStore) storeLink.href = LINKS.chromeWebStore;
else storeLink.addEventListener('click', e => { e.preventDefault(); toast('Coming soon to the Chrome Web Store.'); });

/* ───────────────────────── Settings, as content.js reads them ───────────────────────── */
const store = { enabled: true, preset: 'cinematic' };
const onChanged = [];
function setSettings(patch){
  const changes = {};
  for (const k in patch) if (store[k] !== patch[k]) { changes[k] = { oldValue: store[k], newValue: patch[k] }; store[k] = patch[k]; }
  if (Object.keys(changes).length) onChanged.forEach(fn => fn(changes, 'sync'));
}
const chromeNS = window.chrome || (window.chrome = {});
chromeNS.storage = {
  sync: { get: (defaults, cb) => setTimeout(() => cb({ ...defaults, ...store })), set: patch => setSettings(patch) },
  onChanged: { addListener: fn => { onChanged.push(fn); } }
};

const CALM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = n => String(n).padStart(2, '0');
function timecode(sec, fps){
  const f = Math.floor(sec * fps), s = Math.floor(f / fps);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f % fps)}`;
}
/* Set an element's font size so its text spans exactly `width` */
function fit(el, width){
  el.style.fontSize = '100px';
  const w = el.offsetWidth;                          // layout width: ignores the slam's scale
  if (w) el.style.fontSize = `${(100 * width / w).toFixed(2)}px`;
}
const contentWidth = el => { const cs = getComputedStyle(el); return el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); };

/* ───────────────────────── Headline: a beat, then the word lands ───────────────────────── */
const hero = document.querySelector('.hero');
const loud = document.getElementById('loud');
const wordmark = document.getElementById('wordmark');
const lines = document.getElementById('focus-lines');
const linesPath = lines.querySelector('path');

/* Manga focus lines (集中線): thin wedges aimed at the word, starting just outside it */
function drawFocusLines(){
  const hr = hero.getBoundingClientRect(), lr = loud.getBoundingClientRect();
  const W = hr.width, H = hr.height;
  const cx = lr.left - hr.left + lr.width * 0.5, cy = lr.top - hr.top + lr.height * 0.55;
  const rx = lr.width * 0.56, ry = lr.height * 0.9;
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 80;
  const at = (r, t) => `${(cx + Math.cos(t) * r).toFixed(1)} ${(cy + Math.sin(t) * r).toFixed(1)}`;
  let d = '';
  for (let i = 0, n = 150; i < n; i++) {
    const a = (i + Math.random() * 0.9) / n * Math.PI * 2;
    const edge = rx * ry / Math.hypot(ry * Math.cos(a), rx * Math.sin(a));
    const r0 = edge * (1.1 + Math.random() * 0.6), w = (0.001 + Math.random() * 0.0045) * Math.PI;
    d += `M${at(r0, a)}L${at(R, a - w)}L${at(R, a + w)}Z`;
  }
  lines.setAttribute('viewBox', `0 0 ${W.toFixed(0)} ${H.toFixed(0)}`);
  linesPath.setAttribute('d', d);
}
let boilTimer = 0;
function boil(ms){                                   // redraw the lines a few times, like hand-drawn frames
  clearInterval(boilTimer);
  const end = performance.now() + ms;
  boilTimer = setInterval(() => { drawFocusLines(); if (performance.now() > end) { clearInterval(boilTimer); boilTimer = 0; } }, 85);
}
/* After landing, the lines keep boiling like hand-drawn frames, while the hero is on screen */
let heroVisible = true;
function boilForever(){
  if (CALM) return;
  setInterval(() => { if (heroVisible && !document.hidden && !boilTimer) drawFocusLines(); }, 140);
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(hero);
}
function slam(){
  hero.classList.remove('is-slam'); void hero.offsetWidth; hero.classList.add('is-slam');
  boil(650);
}
function layoutType(){
  fit(loud, contentWidth(hero) * 0.985);
  fit(wordmark, contentWidth(wordmark.parentElement));
  if (hero.classList.contains('is-landed')) drawFocusLines();
}
function landHeadline(){
  layoutType();
  if (CALM) { hero.classList.add('is-beat', 'is-landed'); drawFocusLines(); return; }
  setTimeout(() => hero.classList.add('is-beat'), 350);                                  // the pause…
  setTimeout(() => { drawFocusLines(); hero.classList.add('is-landed'); slam(); boilForever(); }, 1150); // …then the drama
}
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1500))]).then(landHeadline);
let resizeTimer = 0;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layoutType, 120); });

/* ───────────────────────── Viewfinder: scene and timecode ───────────────────────── */
const sceneLabel = document.getElementById('vf-scene');
const pageTc = document.getElementById('page-tc');
const recLabel = document.getElementById('rec-label');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) sceneLabel.textContent = en.target.dataset.scene; });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('[data-scene]').forEach(el => io.observe(el));
}
let frozen = false;
function setFrozen(on){
  frozen = on;
  document.body.classList.toggle('is-frozen', on);
  recLabel.textContent = on ? 'Paused' : 'Rec';
}

/* ───────────────────────── Demo player ───────────────────────── */
const player = document.getElementById('movie_player');
const video = player.querySelector('video');
const sceneGrid = document.getElementById('scene');
const stateBtn = document.getElementById('ph-state');
const stateText = stateBtn.querySelector('.ph-state-text');
const playerTc = document.getElementById('ph-tc');
const fill = player.querySelector('.ph-fill');
const effectTag = document.getElementById('ph-effect');
const hintEl = player.querySelector('.ph-hint');
const cursor = document.getElementById('cursor');
const cursorLabel = document.getElementById('cursor-label');
const stylesEl = document.getElementById('dp-styles');
const options = [...stylesEl.querySelectorAll('[data-preset]')];
const NAMES = { cinematic: 'Cinematic', anime: 'Anime' };


const play = () => { const p = video.play(); if (p) p.catch(syncState); };
function toggle(){ if (video.paused) play(); else video.pause(); }
function takeOver(){ player.classList.add('drove'); }

/* A click on the picture toggles it, like YouTube. content.js hears the same click first (it listens on the document)
   and starts the effect where you clicked. A double-click counts once, as YouTube keeps it for full screen. */
player.addEventListener('click', e => {
  if (e.target.closest('.ph-state') || e.detail >= 2) return;
  takeOver(); toggle();
});
stateBtn.addEventListener('click', () => { takeOver(); toggle(); });
player.addEventListener('keydown', e => {
  if (e.target !== player || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); takeOver(); toggle(); }
});

const drawProgress = () => { if (video.duration) fill.style.transform = `scaleX(${video.currentTime / video.duration})`; };
function syncState(){
  const paused = video.paused;
  player.classList.toggle('is-paused', paused);
  sceneGrid.classList.toggle('is-paused', paused);
  stateBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
  stateText.textContent = paused ? 'Paused' : 'Playing';
  cursorLabel.textContent = paused ? 'Play' : 'Pause';
  hintEl.textContent = paused ? 'Tap to play' : 'Tap the picture to pause';
  playerTc.textContent = timecode(video.currentTime, 30);
  drawProgress();
  setFrozen(paused);
}
video.addEventListener('play', syncState);
video.addEventListener('pause', syncState);
video.addEventListener('seeked', drawProgress);

/* One clock for both timecodes: the page's own (24 fps) stops while the video is paused */
let pageTime = 0, lastNow = performance.now(), pageText = '';
function tick(now){
  const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
  if (!frozen) pageTime += dt;
  const t = timecode(pageTime, 24);
  if (t !== pageText) { pageTc.textContent = t; pageText = t; }
  if (!video.paused) { playerTc.textContent = timecode(video.currentTime, 30); drawProgress(); }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* The cursor over the picture: its dot marks where the effect will start */
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const move = e => {
    cursor.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    cursor.classList.toggle('is-on', !e.target.closest('.ph-state'));
  };
  player.addEventListener('pointerenter', move);
  player.addEventListener('pointermove', move);
  player.addEventListener('pointerleave', () => cursor.classList.remove('is-on', 'is-down'));
  player.addEventListener('pointerdown', e => { if (e.isTrusted) cursor.classList.add('is-down'); });
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  addEventListener('scroll', () => cursor.classList.remove('is-on'), { passive: true });
}


/* Effects list, as in the extension popup. Choosing one only switches it: the visitor pauses the video themselves. */
function renderPanel(){
  options.forEach(o => {
    const on = o.dataset.preset === store.preset;
    o.setAttribute('aria-checked', String(on));
    o.tabIndex = on ? 0 : -1;
  });
  sceneGrid.dataset.fx = store.preset;
  effectTag.textContent = NAMES[store.preset];
}
function choose(preset){
  if (preset === store.preset) return;
  setSettings({ preset });              // content.js clears the old effect
  renderPanel();
  if (video.paused) play();             // ready to be paused again with the new style
}
options.forEach(o => o.addEventListener('click', () => choose(o.dataset.preset)));
stylesEl.addEventListener('keydown', e => {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const i = options.findIndex(o => o.dataset.preset === store.preset);
  const next = options[(i + step + options.length) % options.length];
  next.focus(); choose(next.dataset.preset);
});

/* Start playing */
renderPanel();
if (CALM) syncState(); else play();
})();
