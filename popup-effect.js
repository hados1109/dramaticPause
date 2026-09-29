/* Dramatic Pause for YouTube — preview of the effect inside the popup */
(() => {
'use strict';

/* ───────────────────────── Config ───────────────────────── */
const BASE = {
  preset: 'custom',
  timeScale: 1, maxRipples: 6,
  duration: 2.0, ease: 'outQuad', fadeIn: 80, reach: 'corner', fixedRadius: 600,
  loudWidth: 4, loudWarp: 4, loudProfile: 'gaussian', loudFade: 1.4,
  loudGlow: 0.55, loudGlowColor: '#ffffff', loudEmboss: 0.5, chroma: 0.35,
  faintWidth: 120, faintGap: 2, faintPosition: 'trailing', faintWarp: 10, faintSkew: 0.7, faintFade: 1.1,
  faintShadow: 0.12, faintShadowColor: '#1b2a33', faintEmboss: 0.35,
  warpMode: 'magnify', lightAngle: 135, shake: 0, sound: 'off', debug: 'off',
  path: 'expand', holdTime: 150, collapseTime: 0.9, collapseEase: 'inCubic',
  insideStyle: 'none', insideStrength: 1, insideTint: '#7fb3ff', insideFeather: 1.5,
  freeze: 'none', frozenFor: 3, resumeTime: 0.5, frozenStyle: 'greyscale', frozenStrength: 0.9,
  frozenTint: '#9cb3d4', frozenDim: 0.2, frozenVignette: 0.4, halftone: 0, halftoneSize: 6,
  haltAt: 0.6, haltStrength: 0.7, resumeEase: 'outCubic',
  echoes: 0, echoSpacing: 80, echoFalloff: 0.6
};
const PRESETS = {
  /* Time stop: Vinyas's tuned config. A wide soft ring with a colour fringe, three fading echo rings,
     and a smooth aftershock; the page goes briefly grey inside the wave, fading as it reaches the edges. */
  timestop: { timeScale: 1, maxRipples: 6, duration: 4, ease: 'outCubic', fadeIn: 200, reach: 'corner', fixedRadius: 600,
            loudWidth: 24, loudWarp: 3, loudProfile: 'gaussian', loudFade: 1.3, loudGlow: 0, loudGlowColor: '#ffffff',
            loudEmboss: 0.1, chroma: 1.5, faintWidth: 200, faintGap: 10, faintPosition: 'trailing', faintWarp: 20,
            faintSkew: 0.3, faintFade: 2, faintShadow: 0, faintShadowColor: '#1b2a33', faintEmboss: 0.4,
            warpMode: 'magnify', lightAngle: 135, shake: 0, sound: 'off', path: 'expand', holdTime: 150,
            collapseTime: 0.9, collapseEase: 'inCubic', insideStyle: 'greyscale', insideStrength: 1,
            insideTint: '#7fb3ff', insideFeather: 40, freeze: 'none', frozenFor: 3, resumeTime: 0.5,
            frozenStyle: 'none', frozenStrength: 0, frozenTint: '#9cb3d4', frozenDim: 0, frozenVignette: 0,
            halftone: 0, halftoneSize: 6, haltAt: 0.6, haltStrength: 0.7, resumeEase: 'outCubic', echoes: 3,
            echoSpacing: 80, echoFalloff: 0.4 },
  /* Time stop, comic panel style (Vinyas's tuned config): black-and-white negative flash with an inked edge
     that snaps straight back, then the frozen page turns into a printed halftone until the next click. */
  timestopComic: { timeScale: 1, maxRipples: 6, duration: 0.7, ease: 'outExpo', fadeIn: 0, reach: 'corner', fixedRadius: 600,
            loudWidth: 3, loudWarp: 6, loudProfile: 'sharp', loudFade: 0.3, loudGlow: 1, loudGlowColor: '#111111',
            loudEmboss: 0, chroma: 0, faintWidth: 140, faintGap: 0, faintPosition: 'trailing', faintWarp: 14,
            faintSkew: 0.6, faintFade: 0.3, faintShadow: 0.25, faintShadowColor: '#000000', faintEmboss: 0,
            warpMode: 'magnify', lightAngle: 135, shake: 5, sound: 'off', path: 'collapse', holdTime: 0,
            collapseTime: 0.8, collapseEase: 'inQuart', insideStyle: 'negmono', insideStrength: 1,
            insideTint: '#7fb3ff', insideFeather: 0.5, freeze: 'click', frozenFor: 3, resumeTime: 0.35,
            frozenStyle: 'greyscale', frozenStrength: 1, frozenTint: '#9cb3d4', frozenDim: 0.05, frozenVignette: 0.2,
            halftone: 0.65, halftoneSize: 5, haltAt: 0.6, haltStrength: 0.7, resumeEase: 'outCubic', echoes: 0,
            echoSpacing: 80, echoFalloff: 0.6 }
};
const DEFAULTS = { ...BASE, ...PRESETS.timestop, preset: 'timestop' };
const KEEP_ON_PRESET = ['timeScale', 'maxRipples', 'debug', 'sound'];

const EASE = {
  linear:    t => t,
  outSine:   t => Math.sin(t * Math.PI / 2),
  outQuad:   t => 1 - (1 - t) * (1 - t),
  outCubic:  t => 1 - Math.pow(1 - t, 3),
  outQuart:  t => 1 - Math.pow(1 - t, 4),
  outExpo:   t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inQuad:    t => t * t,
  inCubic:   t => t * t * t,
  inQuart:   t => t * t * t * t,
  inExpo:    t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2
};

const freezeOn = c => c.freeze !== 'none' || c.path === 'halt';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const PRESET_KEYS = { cinematic: 'timestop', anime: 'timestopComic' };
let baseCfg = { ...BASE, ...PRESETS.timestop };
let cfg = baseCfg;

/* ───────────────────────── GPU layer ───────────────────────── */
const stage = document.createElement('canvas');
const MAXR = 16;
let W = 0, H = 0, DW = 0, DH = 0, DPR = 1;
let gl = null, prog = null, tex = null, U = {}, ctx2d = null;

const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uDpr;
uniform vec4 uA[${MAXR}];   // cx, cy, radius, loud amplitude
uniform vec4 uB[${MAXR}];   // faint amplitude, kind (0 ripple, 1 stop, 2 resume), phase (0 out, 1 back), inside amount
uniform float uCount;
uniform float uLW, uLWarp, uLNorm, uLProf, uLGlow, uLEmb, uChroma;
uniform vec3 uLGlowCol;
uniform float uFW, uFGap, uFWarp, uFNorm, uFPos, uFK, uFShadow, uFEmb;
uniform vec3 uFShadowCol;
uniform float uMode;
uniform vec2 uLight;
uniform float uDebug;
uniform float uPathCollapse, uFrozen, uInStyle, uInFeather, uFzStyle, uFzStrength, uFzDim, uFzVig, uHtAmt, uHtSize;
uniform vec3 uInTint, uFzTint;
uniform vec2 uShake;

float loudH(float q){
  float a = abs(q);
  if (uLProf < 0.5) return exp(-2.0 * q * q);
  if (uLProf < 1.5) { float t = max(0.0, 1.0 - a); return t * t; }
  return 1.0 - smoothstep(0.55, 1.0, a);
}
float faintH(float x){
  float v; float k = uFK;
  if (uFPos < 0.5)      v = (-x - uLW * 0.5 - uFGap) / uFW;
  else if (uFPos < 1.5) { v = 0.5 + x / uFW; k = 1.0; }
  else                  v = (x - uLW * 0.5 - uFGap) / uFW;
  if (v <= 0.0 || v >= 1.0) return 0.0;
  float s = sin(3.14159265 * pow(v, k));
  return s * s;
}
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
vec3 styleFn(vec3 c, float s, vec3 tint){
  float l = lum(c);
  if (s < 0.5) return c;
  if (s < 1.5) return 1.0 - c;
  if (s < 2.5) return vec3(1.0 - l);
  if (s < 3.5) return vec3(l);
  if (s < 4.5) return clamp(vec3(l) * vec3(1.07, 0.93, 0.72) + vec3(0.05, 0.03, 0.0), 0.0, 1.0);
  return mix(tint * 0.12, mix(tint, vec3(1.0), 0.72), l);
}
vec3 lightIt(vec3 col, float shadow, float shade, float glow){
  col = mix(col, col * uFShadowCol, clamp(shadow, 0.0, 1.0));
  col += shade;
  return mix(col, uLGlowCol, clamp(glow, 0.0, 1.0));
}
void main(){
  vec2 p = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y) / uDpr;
  vec2 offL = vec2(0.0), offF = vec2(0.0);
  float glow = 0.0, shade = 0.0, shadow = 0.0, mL = 0.0, mF = 0.0;
  float insideC = 0.0, frz = 0.0, thaw = 0.0;
  float hw = max(uLW * 0.5, 0.25);
  for (int i = 0; i < ${MAXR}; i++) {
    if (float(i) >= uCount) break;
    vec4 a = uA[i];
    vec4 b = uB[i];
    float ampL = a.w, ampF = b.x, kind = b.y, phase = b.z, inAmt = b.w;
    vec2 d = p - a.xy;
    float dist = length(d);
    vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
    float x = dist - a.z;
    float gL = loudH(x / hw);
    float sL = (loudH((x + 0.25) / hw) - loudH((x - 0.25) / hw)) * 2.0 * hw / uLNorm;
    float hF = faintH(x);
    float sF = (faintH(x + 0.5) - faintH(x - 0.5)) * uFW / uFNorm;
    offL -= dir * uMode * uLWarp * sL * ampL;
    offF -= dir * uMode * uFWarp * sF * ampF;
    float ld = dot(dir, uLight);
    glow   += gL * gL * uLGlow * ampL;
    shade  += -sL * ld * uLEmb * 0.35 * ampL * uMode;
    shade  += -sF * ld * uFEmb * 0.18 * ampF * uMode;
    shadow += hF * uFShadow * ampF;
    mL = max(mL, gL * ampL);
    mF = max(mF, hF * ampF);
    float inside = 1.0 - smoothstep(a.z - uInFeather, a.z + uInFeather, dist);
    if (kind < 0.5) insideC = max(insideC, inside * inAmt);
    else if (kind < 1.5) {
      if (uPathCollapse > 0.5) {
        insideC = max(insideC, inside * inAmt);
        if (phase > 0.5) frz = max(frz, 1.0 - inside);
      } else frz = max(frz, inside);
    } else thaw = max(thaw, inside);
  }
  float frozen = max(frz, uFrozen) * (1.0 - thaw);
  vec2 css = uSize / uDpr;
  vec2 base = p + uShake - offF;
  vec3 col;
  if (uChroma > 0.001) {
    col.r = texture2D(uTex, (base - offL * (1.0 + uChroma)) / css).r;
    col.g = texture2D(uTex, (base - offL) / css).g;
    col.b = texture2D(uTex, (base - offL * (1.0 - uChroma)) / css).b;
  } else {
    col = texture2D(uTex, (base - offL) / css).rgb;
  }
  if (uDebug > 0.5 && uDebug < 1.5) {
    vec2 o = (offL + offF) / max(uLWarp + uFWarp, 1.0);
    col = vec3(0.5 + o.x * 0.5, 0.5 + o.y * 0.5, 0.5);
  } else if (uDebug > 1.5 && uDebug < 2.5) {
    col = lightIt(vec3(0.5), shadow, shade, glow);
  } else if (uDebug > 2.5) {
    col = vec3(lum(col) * 0.3);
    col = mix(col, vec3(0.95, 0.85, 0.2), clamp(insideC, 0.0, 1.0) * 0.55);
    col = mix(col, vec3(0.3, 0.85, 0.45), clamp(frozen, 0.0, 1.0) * 0.45);
    col = mix(col, vec3(1.0, 0.33, 0.28), clamp(mL, 0.0, 1.0));
    col = mix(col, vec3(0.3, 0.62, 1.0), clamp(mF, 0.0, 1.0) * 0.85);
  } else {
    if (frozen > 0.001) {
      col = mix(col, styleFn(col, uFzStyle, uFzTint), uFzStrength * frozen);
      col *= 1.0 - uFzDim * frozen;
      vec2 q = p / css - 0.5;
      col *= 1.0 - uFzVig * frozen * smoothstep(0.35, 1.05, length(q * 2.0) / 1.4142);
      if (uHtAmt > 0.001) {
        vec2 hp = mat2(0.7071, 0.7071, -0.7071, 0.7071) * p / uHtSize;
        vec2 cell = fract(hp) - 0.5;
        float r = sqrt(clamp(1.0 - lum(col), 0.0, 1.0)) * 0.66;
        float aa = 0.7 / (uHtSize * uDpr);
        float dotM = 1.0 - smoothstep(r - aa, r + aa, length(cell));
        vec3 ht = mix(mix(col, vec3(1.0), 0.6), col * 0.15, dotM);
        col = mix(col, ht, uHtAmt * frozen);
      }
    }
    if (insideC > 0.001) col = mix(col, styleFn(col, uInStyle, uInTint), clamp(insideC, 0.0, 1.0));
    col = lightIt(col, shadow, shade, glow);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function initGL(){
  gl = stage.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) { ctx2d = stage.getContext('2d'); return false; }
  const sh = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  ['uTex', 'uSize', 'uDpr', 'uA', 'uB', 'uCount', 'uLW', 'uLWarp', 'uLNorm', 'uLProf', 'uLGlow', 'uLEmb', 'uChroma',
   'uLGlowCol', 'uFW', 'uFGap', 'uFWarp', 'uFNorm', 'uFPos', 'uFK', 'uFShadow', 'uFEmb', 'uFShadowCol', 'uMode',
   'uLight', 'uDebug', 'uPathCollapse', 'uFrozen', 'uInStyle', 'uInFeather', 'uInTint', 'uFzStyle', 'uFzStrength',
   'uFzDim', 'uFzVig', 'uFzTint', 'uHtAmt', 'uHtSize', 'uShake'].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
  tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(U.uTex, 0);
  return true;
}
/* Normalisation so each "Warp amount" slider equals the peak displacement in px */
const smooth = (e0, e1, v) => { const t = clamp((v - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const PROF = { gaussian: 0, sharp: 1, flat: 2 };
const STY = { none: 0, invert: 1, negmono: 2, greyscale: 3, sepia: 4, tint: 5 };
const POS = { trailing: 0, centered: 1, leading: 2 };
function loudFn(prof){
  return q => { const a = Math.abs(q);
    if (prof === 0) return Math.exp(-2 * q * q);
    if (prof === 1) { const t = Math.max(0, 1 - a); return t * t; }
    return 1 - smooth(0.55, 1, a); };
}
function maxSlope(fn, lo, hi, eps){
  let m = 0;
  for (let i = 0; i <= 3000; i++) { const x = lo + (hi - lo) * i / 3000; const d = Math.abs(fn(x + eps) - fn(x - eps)) / (2 * eps); if (d > m) m = d; }
  return m || 1;
}
let normCache = {};
function norms(){
  const hw = Math.max(cfg.loudWidth / 2, 0.25), prof = PROF[cfg.loudProfile];
  const k = cfg.faintPosition === 'centered' ? 1 : 1 - 0.55 * cfg.faintSkew;
  const key = `${prof}|${hw}|${k.toFixed(3)}|${cfg.faintWidth}`;
  if (normCache.key !== key) {
    const lf = loudFn(prof);
    const lNorm = maxSlope(lf, -1.5, 1.5, 0.25 / hw);
    const ff = v => (v <= 0 || v >= 1) ? 0 : Math.pow(Math.sin(Math.PI * Math.pow(v, k)), 2);
    const fNorm = maxSlope(ff, 0, 1, 0.5 / cfg.faintWidth);
    normCache = { key, lNorm, fNorm, k };
  }
  return normCache;
}
function hex(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }

const A = new Float32Array(MAXR * 4), B = new Float32Array(MAXR * 4);
function render(){
  if (!gl) return;
  const n = norms(), th = cfg.lightAngle * Math.PI / 180;
  gl.viewport(0, 0, DW, DH);
  gl.useProgram(prog);
  gl.uniform2f(U.uSize, DW, DH);
  gl.uniform1f(U.uDpr, DPR);
  gl.uniform4fv(U.uA, A);
  gl.uniform4fv(U.uB, B);
  gl.uniform1f(U.uCount, slotCount);
  gl.uniform1f(U.uLW, cfg.loudWidth);
  gl.uniform1f(U.uLWarp, cfg.loudWarp);
  gl.uniform1f(U.uLNorm, n.lNorm);
  gl.uniform1f(U.uLProf, PROF[cfg.loudProfile]);
  gl.uniform1f(U.uLGlow, cfg.loudGlow);
  gl.uniform1f(U.uLEmb, cfg.loudEmboss);
  gl.uniform1f(U.uChroma, cfg.chroma);
  gl.uniform3fv(U.uLGlowCol, hex(cfg.loudGlowColor));
  gl.uniform1f(U.uFW, cfg.faintWidth);
  gl.uniform1f(U.uFGap, cfg.faintGap);
  gl.uniform1f(U.uFWarp, cfg.faintWarp);
  gl.uniform1f(U.uFNorm, n.fNorm);
  gl.uniform1f(U.uFPos, POS[cfg.faintPosition]);
  gl.uniform1f(U.uFK, n.k);
  gl.uniform1f(U.uFShadow, cfg.faintShadow);
  gl.uniform1f(U.uFEmb, cfg.faintEmboss);
  gl.uniform3fv(U.uFShadowCol, hex(cfg.faintShadowColor));
  gl.uniform1f(U.uMode, cfg.warpMode === 'push' ? -1 : 1);
  gl.uniform2f(U.uLight, Math.cos(th), -Math.sin(th));
  gl.uniform1f(U.uDebug, { off: 0, disp: 1, light: 2, masks: 3 }[cfg.debug] || 0);
  gl.uniform1f(U.uPathCollapse, cfg.path === 'collapse' ? 1 : 0);
  gl.uniform1f(U.uFrozen, frozenLevel);
  gl.uniform1f(U.uInStyle, STY[cfg.insideStyle] || 0);
  gl.uniform1f(U.uInFeather, Math.max(0.5, cfg.insideFeather));
  gl.uniform3fv(U.uInTint, hex(cfg.insideTint));
  gl.uniform1f(U.uFzStyle, STY[cfg.frozenStyle] || 3);
  gl.uniform1f(U.uFzStrength, cfg.frozenStrength);
  gl.uniform1f(U.uFzDim, cfg.frozenDim);
  gl.uniform1f(U.uFzVig, cfg.frozenVignette);
  gl.uniform3fv(U.uFzTint, hex(cfg.frozenTint));
  gl.uniform1f(U.uHtAmt, cfg.halftone);
  gl.uniform1f(U.uHtSize, cfg.halftoneSize);
  gl.uniform2f(U.uShake, shakeX, shakeY);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ───────────────────────── Ripples, time state & clock ───────────────────────── */
let ripples = [], clock = 0, last = 0, running = false, lastSig = '', slotCount = 0;
let timeState = 'normal';                 // normal · stopping · frozen · resuming
let frozenLevel = 0, resumeAt = null, freezeCenter = { x: 0, y: 0 };
let shakeX = 0, shakeY = 0;
const halting = r => r.kind === 1 && cfg.path === 'halt';
const resumeLen = () => Math.max(0.05, cfg.resumeTime);

function reachFor(r, full){
  const lw = cfg.loudWidth / 2;
  let extra = cfg.faintPosition === 'trailing' ? lw + cfg.faintGap + cfg.faintWidth
            : cfg.faintPosition === 'centered' ? Math.max(lw, cfg.faintWidth / 2) : lw;
  extra += 4 + cfg.insideFeather + cfg.echoes * cfg.echoSpacing;
  const corner = Math.max(Math.hypot(r.x, r.y), Math.hypot(W - r.x, r.y), Math.hypot(r.x, H - r.y), Math.hypot(W - r.x, H - r.y)) + extra;
  if (full) return corner;
  if (cfg.reach === 'fixed') return cfg.fixedRadius;
  if (cfg.reach === 'edge') return Math.min(r.x, r.y, W - r.x, H - r.y) + extra;
  return corner;
}
function waveLength(r){
  if (r.kind === 2) return resumeLen();
  return cfg.duration + (cfg.path === 'collapse' ? cfg.holdTime / 1000 + cfg.collapseTime : 0);
}
function waveDone(r){
  if (halting(r)) return r.resumeT0 != null && clock - r.resumeT0 >= resumeLen();
  return clock - r.t0 >= waveLength(r);
}
function waveAt(r){
  const age = clock - r.t0;
  const fin = cfg.fadeIn > 0 ? 1 - Math.pow(1 - clamp(age / (cfg.fadeIn / 1000), 0, 1), 3) : 1;
  const ease = EASE[cfg.ease] || EASE.outQuad, easeC = EASE[cfg.collapseEase] || EASE.inCubic;
  const easeR = EASE[cfg.resumeEase] || EASE.outCubic;
  const noInside = cfg.insideStyle === 'none';
  if (halting(r)) {
    const full = reachFor(r, true), hs = cfg.haltStrength;
    const haltR = cfg.haltAt * Math.max(Math.hypot(r.x, r.y), Math.hypot(W - r.x, r.y), Math.hypot(r.x, H - r.y), Math.hypot(W - r.x, H - r.y));
    if (r.resumeT0 == null) {
      const T = clamp(age / cfg.duration, 0, 1);
      return { age, R: ease(T) * haltR, phase: 0, skind: 0,
        ampL: fin * (hs + (1 - hs) * Math.pow(1 - T, cfg.loudFade)),
        ampF: fin * (hs + (1 - hs) * Math.pow(1 - T, cfg.faintFade)),
        inAmt: noInside ? 0 : cfg.insideStrength * fin };
    }
    const RT = clamp((clock - r.resumeT0) / resumeLen(), 0, 1), env = hs * Math.pow(1 - RT, 1.3);
    return { age, R: haltR + (full - haltR) * easeR(RT), phase: 0, skind: 0, ampL: env, ampF: env,
      inAmt: noInside ? 0 : cfg.insideStrength * (1 - RT) };
  }
  const total = waveLength(r), T = clamp(age / total, 0, 1), thaw = r.kind === 2;
  let R, phase = 0;
  if (thaw) R = easeR(T) * reachFor(r, true);
  else if (cfg.path === 'collapse') {
    const maxR = reachFor(r), hEnd = cfg.duration + cfg.holdTime / 1000;
    if (age < cfg.duration) R = ease(clamp(age / cfg.duration, 0, 1)) * maxR;
    else if (age < hEnd) R = maxR;
    else { phase = 1; R = (1 - easeC(clamp((age - hEnd) / cfg.collapseTime, 0, 1))) * maxR; }
  } else R = ease(T) * reachFor(r);
  return {
    age, R, phase, skind: r.kind,
    ampL: fin * Math.pow(1 - T, thaw ? 1.2 : cfg.loudFade),
    ampF: fin * Math.pow(1 - T, thaw ? 1.2 : cfg.faintFade),
    inAmt: (noInside || thaw) ? 0 : cfg.insideStrength * fin * (cfg.path === 'collapse' ? 1 : 1 - T)
  };
}
function enterFrozen(){
  timeState = 'frozen';
  resumeAt = cfg.freeze === 'timed' ? clock + cfg.frozenFor : null;
}
function step(){
  const hadStops = ripples.some(r => r.kind === 1);
  ripples = ripples.filter(r => !waveDone(r));
  const stops = ripples.filter(r => r.kind === 1);

  if (timeState === 'stopping') {
    if (cfg.path === 'halt') { if (stops.length && stops.every(r => clock - r.t0 >= cfg.duration)) enterFrozen(); }
    else if (hadStops && !stops.length) { frozenLevel = 1; enterFrozen(); }
  } else if (timeState === 'resuming' && !ripples.some(r => r.kind !== 0)) {
    frozenLevel = 0; timeState = 'normal';
  }
  if (cfg.path === 'halt') {
    const lead = stops[0];
    if (!lead) frozenLevel = 0;
    else if (lead.resumeT0 != null) frozenLevel = 1 - smooth(0, 1, (clock - lead.resumeT0) / resumeLen());
    else frozenLevel = smooth(0, 1, (clock - lead.t0) / cfg.duration);
  }

  A.fill(0); B.fill(0);
  let n = 0, sh = 0;
  for (const r of ripples) {
    const w = waveAt(r);
    const extra = r.kind === 2 ? 0 : cfg.echoes;
    for (let e = 0; e <= extra && n < MAXR; e++) {
      const Re = w.R - e * cfg.echoSpacing;
      if (e > 0 && Re <= 0) continue;
      const g = e === 0 ? 1 : Math.pow(cfg.echoFalloff, e) * smooth(0, 1, Re / (cfg.echoSpacing * 0.6));
      A[n * 4] = r.x; A[n * 4 + 1] = r.y; A[n * 4 + 2] = Math.max(0, Re); A[n * 4 + 3] = w.ampL * g;
      B[n * 4] = w.ampF * g; B[n * 4 + 1] = e === 0 ? w.skind : 0; B[n * 4 + 2] = w.phase; B[n * 4 + 3] = e === 0 ? w.inAmt : 0;
      n++;
    }
    if (cfg.shake > 0 && w.age < 0.35) sh = Math.max(sh, cfg.shake * Math.pow(1 - w.age / 0.35, 2) * (r.kind === 2 ? 0.5 : 1));
  }
  slotCount = n;
  const ang = Math.random() * Math.PI * 2;
  shakeX = sh ? Math.cos(ang) * sh : 0; shakeY = sh ? Math.sin(ang) * sh : 0;
  const sig = `${ripples.length}|${timeState}`;
  if (sig !== lastSig) { lastSig = sig; updateStatus(); }
}
function spawn(x, y, kind){
  ripples.push({ x, y, t0: clock, kind, resumeT0: null });
  if (kind === 0) while (ripples.length > cfg.maxRipples) ripples.shift();
  step(); kick();
}
/* One entry point for clicks: a normal ripple, or stop / resume time when freezing is on */
function trigger(x, y){
  if (!freezeOn(cfg)) { spawn(x, y, 0); return; }
  if (timeState === 'normal') {
    timeState = 'stopping'; freezeCenter = { x, y };
    spawn(x, y, 1);
    if (cfg.sound === 'ticks') Sound.slowing(waveLength({ kind: 1 }) / cfg.timeScale + 0.4);
  } else if (timeState === 'frozen') resume(x, y);
}
function resume(x, y){
  resumeAt = null;
  if (cfg.sound === 'ticks') Sound.quickening();
  if (cfg.resumeTime < 0.01) { ripples = []; frozenLevel = 0; timeState = 'normal'; refresh(); updateStatus(); return; }
  timeState = 'resuming';
  if (cfg.path === 'halt') {
    ripples.forEach(r => { if (r.kind === 1) r.resumeT0 = clock; });
    step(); kick();
  } else spawn(x, y, 2);
}
function resetTime(){
  ripples = [];
  frozenLevel = 0; timeState = 'normal'; resumeAt = null; Sound.cancel();
  refresh(); updateStatus();
}
function refresh(){ if (!running) { step(); render(); } }

/* Clock ticks that slow down as time stops (Web Audio, starts only after a click) */
const Sound = (() => {
  let ac = null, buf = null, live = [];
  function ctx(){
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
      const n = Math.floor(ac.sampleRate * 0.04);
      buf = ac.createBuffer(1, n, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function tick(at, hi, vol){
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hi ? 3400 : 2500; f.Q.value = 5;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(ac.destination);
    s.onended = () => { live = live.filter(v => v !== s); };
    s.start(at); live.push(s);
  }
  function cancel(){ live.forEach(s => { try { s.stop(); } catch (e) {} }); live = []; }
  function slowing(total){
    const a = ctx(); if (!a) return; cancel();
    let t = 0, gap = 0.12, i = 0;
    while (t < total && i < 40) { tick(a.currentTime + 0.01 + t, i % 2 === 0, 0.6 * Math.max(0.15, 1 - t / total)); t += gap; gap *= 1.3; i++; }
  }
  function quickening(){
    const a = ctx(); if (!a) return; cancel();
    let t = 0, gap = 0.34;
    for (let i = 0; i < 6; i++) { tick(a.currentTime + 0.01 + t, i % 2 === 0, 0.25 + i * 0.07); t += gap; gap *= 0.7; }
  }
  return { slowing, quickening, cancel };
})();

/* ───────────────────────── Popup preview: play the effect over the popup itself ───────────────────────── */
const REF_W = 720;
const SCALED = ['loudWidth', 'loudWarp', 'faintWidth', 'faintGap', 'faintWarp', 'echoSpacing', 'insideFeather', 'shake', 'fixedRadius'];
function scaleCfg(b){
  const k = clamp(W / REF_W, 0.3, 3), c = { ...b };
  SCALED.forEach(key => { c[key] = b[key] * k; });
  c.loudWidth = Math.max(1, c.loudWidth);
  c.insideFeather = Math.max(0.5, c.insideFeather);
  c.halftoneSize = clamp(b.halftoneSize * k, 3, 10);
  return c;
}
function updateStatus(){}

const root = document.getElementById('root');
const snap = document.createElement('canvas');
const sc = snap.getContext('2d');
Object.assign(stage.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', display: 'none', zIndex: '10' });
stage.setAttribute('aria-hidden', 'true');
root.appendChild(stage);
let active = false, glReady = false;

function hide(){ active = false; stage.style.display = 'none'; }
function upload(){
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap);
}
const opacityOf = el => { let o = 1; for (let n = el; n && n !== document; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity) || 0; return o; };
function iconImage(el, color){
  const svg = new XMLSerializer().serializeToString(el).replace(/currentColor/g, color);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  return img.decode().then(() => img, () => null);
}
/* Paint the popup's current look into a canvas the shader can bend */
async function snapshot(){
  const rr = root.getBoundingClientRect();
  W = Math.round(rr.width); H = Math.round(rr.height);
  DPR = Math.min(window.devicePixelRatio || 1, 3);
  DW = Math.round(W * DPR); DH = Math.round(H * DPR);
  for (const cv of [stage, snap]) { cv.width = DW; cv.height = DH; }
  const rcs = getComputedStyle(root), bw = parseFloat(rcs.borderTopWidth) || 0;
  Object.assign(stage.style, { width: `${W}px`, height: `${H}px`, left: `${-bw}px`, top: `${-bw}px`,   // cover the border box exactly
    borderRadius: rcs.borderTopLeftRadius, overflow: 'hidden', clipPath: `inset(0 round ${rcs.borderTopLeftRadius})` });
  const els = [root, ...root.querySelectorAll('[data-paint]')];
  const icons = await Promise.all(els.map(el => el.dataset.paint === 'icon' ? iconImage(el, getComputedStyle(el).color) : null));
  const c = sc;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalAlpha = 1; c.fillStyle = getComputedStyle(root).backgroundColor; c.fillRect(0, 0, W, H);
  els.forEach((el, i) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    const r = el.getBoundingClientRect(), x = r.left - rr.left, y = r.top - rr.top;
    c.globalAlpha = opacityOf(el);
    if (el.dataset.paint === 'box') {
      const rad = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.height / 2);
      c.beginPath(); c.roundRect(x + 0.5, y + 0.5, r.width - 1, r.height - 1, rad);
      c.fillStyle = cs.backgroundColor; c.fill();
      if (parseFloat(cs.borderTopWidth) && cs.borderTopColor !== 'rgba(0, 0, 0, 0)' && cs.borderTopStyle !== 'none') { c.strokeStyle = cs.borderTopColor; c.lineWidth = 1; c.stroke(); }
    } else if (el.dataset.paint === 'text') {
      c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      c.fillStyle = cs.color; c.textBaseline = 'middle';
      const txt = cs.textTransform === 'uppercase' ? el.textContent.trim().toUpperCase() : el.textContent.trim();
      c.fillText(txt, x, y + r.height / 2 + 0.5);
      if (cs.textDecorationLine.includes('underline')) { c.fillRect(x, y + r.height / 2 + parseFloat(cs.fontSize) * 0.55, c.measureText(txt).width, 1); }
      if ('letterSpacing' in c) c.letterSpacing = '0px';
    } else if (icons[i]) c.drawImage(icons[i], x, y, r.width, r.height);
  });
  c.globalAlpha = 1;
}

function animating(){ return timeState === 'frozen' ? resumeAt !== null : ripples.length > 0; }
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!active) { running = false; return; }
  clock += dt * cfg.timeScale;
  if (timeState === 'frozen' && resumeAt !== null && clock >= resumeAt) resume(freezeCenter.x, freezeCenter.y);
  step(); render();
  if (animating()) requestAnimationFrame(frame); else { running = false; hide(); }
}
function kick(){ if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

let token = 0;
window.dpPreview = async (name, fromEl) => {
  if (!glReady) return;
  const my = ++token;
  ripples = []; frozenLevel = 0; timeState = 'normal'; resumeAt = null;
  baseCfg = { ...BASE, ...PRESETS[PRESET_KEYS[name] || 'timestop'] };
  if (baseCfg.freeze !== 'none') { baseCfg.freeze = 'timed'; baseCfg.frozenFor = 0.7; }   // no video to press play on: time restarts by itself
  await snapshot();
  if (my !== token) return;
  cfg = scaleCfg(baseCfg);
  upload();
  const rr = root.getBoundingClientRect(), r = fromEl.getBoundingClientRect();
  stage.style.display = 'block'; active = true;
  trigger(r.left + r.width / 2 - rr.left, r.top + r.height / 2 - rr.top);
  clock += 1 / 60; step(); render(); kick();
};

window.dpRefresh = async () => { if (!active) return; await snapshot(); upload(); if (!running) render(); };   // keep a running preview in step with UI changes

try { glReady = initGL(); } catch (e) { glReady = false; }
})();
