"use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';


const VERTEX_SHADER = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uAspect, uDark;
uniform vec2 uMouse;
uniform vec3 uA, uB, uC;

vec2 h2(vec2 p){ p = vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(p)*43758.5453123); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dot(h2(i+vec2(0,0)), f-vec2(0,0)), dot(h2(i+vec2(1,0)), f-vec2(1,0)), u.x),
             mix(dot(h2(i+vec2(0,1)), f-vec2(0,1)), dot(h2(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; } return v; }

void main(){
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime * 0.028;

  vec2 warp = vec2(fbm(p*0.8 + vec2(t, -t*0.5)), fbm(p*0.8 + vec2(-t*0.6, t*0.75)));
  float f = fbm(p*1.05 + warp*1.15 + uMouse*0.18);
  float g = fbm(p*0.62 - warp*0.75 + vec2(t*0.4, t*0.22));

  // gespiegelte Proben, damit Lichtfelder auf BEIDEN Seiten entstehen
  vec2 q = vec2(-p.x, p.y);
  float f2 = fbm(q*1.05 + warp*1.15 + vec2(4.3, -2.7) - uMouse*0.18);
  float g2 = fbm(q*0.62 - warp*0.75 + vec2(-5.1 + t*0.34, 3.6 + t*0.2));

  // steile smoothsteps -> Farbfelder mit harter Kante statt weichem Verlauf
  float m1 = max(smoothstep(0.02, 0.30, f), smoothstep(0.02, 0.30, f2));
  float m2 = max(smoothstep(0.05, 0.34, g), smoothstep(0.05, 0.34, g2));

  vec3 col = mix(uB, uA, m1);
  col = mix(col, uC, m2 * 0.55);
  col *= max(m1, m2 * 0.8);

  // grobes Korn, am stärksten in den Mitteltönen
  float n = fract(sin(dot(floor(uv*vec2(1600.0, 900.0)), vec2(12.9898,78.233)))*43758.5453);
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += (n - 0.5) * (0.34 * (1.0 - abs(lum*2.0 - 1.0)));

  // oben kräftig, nach unten ausblenden
  float body = smoothstep(0.02, 0.42, uv.y);
  float a = clamp(max(m1, m2) * body * (0.55 + 0.45*uDark) + (n - 0.5) * 0.06 * body, 0.0, 1.0);

  gl_FragColor = vec4(max(col, vec3(0.0)), a);
}
`;

// Purchased shader palette adapted to Secure By Design's blue and cyan branding.
const COLORS: Record<'dark' | 'light', { a: string; b: string; c: string }> = {
  dark: { a: '#1469ed', b: '#020d20', c: '#62e0f4' },
  light: { a: '#1469ed', b: '#edf7ff', c: '#62e0f4' },
};

function hexToVec3(hex: string, out: THREE.Vector3): THREE.Vector3 {
  const c = hex.replace('#', '');
  return out.set(
    parseInt(c.substring(0, 2), 16) / 255,
    parseInt(c.substring(2, 4), 16) / 255,
    parseInt(c.substring(4, 6), 16) / 255
  );
}

interface GradientUniforms {
  [key: string]: THREE.IUniform<any>;
  uTime: { value: number };
  uAspect: { value: number };
  uMouse: { value: THREE.Vector2 };
  uDark: { value: number };
  uA: { value: THREE.Vector3 };
  uB: { value: THREE.Vector3 };
  uC: { value: THREE.Vector3 };
}

/**
 * Fullscreen animated shader gradient for the hero background. Owns its own WebGL
 * context (not react-three-fiber) so the render loop and resize handling stay explicit.
 * The renderer is created once on mount — theme toggles only update uniform values via
 * uniformsRef, never tearing down/recreating the WebGL context.
 */
export function HeroShaderGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uniformsRef = useRef<GradientUniforms | null>(null);
  const theme = 'dark' as const;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      // antialias:false — MSAA has a real bandwidth cost on mobile tile-based GPUs (Adreno/
      // Mali), and the shader's own grain/dither already breaks up hard edges, so the visual
      // benefit is minimal for this kind of organic blob shape.
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    } catch {
      // No WebGL support — silently skip the decorative background.
      return;
    }
    // Capped lower than the earlier 1.75 — a 5-octave fbm shader run per pixel, per frame,
    // twice (mirrored samples) adds up fast on a high-DPR phone; 1.25 roughly halves the
    // fragment count on a 3x-DPR device versus 1.75, at a barely perceptible sharpness cost
    // for a soft, grainy background.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();

    const uniforms: GradientUniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uDark: { value: 1 },
      uA: { value: new THREE.Vector3() },
      uB: { value: new THREE.Vector3() },
      uC: { value: new THREE.Vector3() },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height, false);
      uniforms.uAspect.value = width / height;
    };
    resize();

    // Debounced — on mobile, the address bar collapsing/expanding while scrolling fires a
    // burst of resize events; without this, each one triggers a full renderer.setSize()
    // (framebuffer reallocation), which is itself a real cost stacking on top of scrolling.
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resize, 120);
    };
    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(container);

    // uMouse is intentionally left at its initial (0,0) and never updated — mouse
    // reactivity was tried and explicitly not wanted, kept as a no-op uniform instead
    // of touching the shader so it stays trivial to re-enable later if needed.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pause the render loop entirely while the canvas is scrolled out of view — without
    // this, every instance on the page (hero + CTA) keeps rendering a 5-octave fbm shader
    // at full rate forever, which is cheap on desktop but noticeably janks scrolling on
    // mobile GPUs, especially with two instances running at once.
    let rafId = 0;
    let isRunning = false;
    let contextLost = false;

    const animate = () => {
      if (!isRunning) return;
      if (!reducedMotion) {
        uniforms.uTime.value += 0.027;
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    const start = () => {
      if (isRunning || contextLost) return;
      isRunning = true;
      rafId = requestAnimationFrame(animate);
    };
    const stop = () => {
      isRunning = false;
      cancelAnimationFrame(rafId);
    };

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) start();
        else stop();
      },
      { rootMargin: '200px' }
    );
    intersectionObserver.observe(container);

    // Mobile GPUs can reclaim a WebGL context under memory/thermal pressure — without
    // handling this, the canvas silently goes blank forever ("Animation lädt nicht
    // richtig") since the render loop keeps calling render() on a dead context.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      stop();
    };
    const onContextRestored = () => {
      contextLost = false;
      resize();
      start();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      stop();
      clearTimeout(resizeTimeout);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      uniformsRef.current = null;
    };
  }, []);

  // Theme toggles only update uniform values — no WebGL context recreation.
  useEffect(() => {
    const uniforms = uniformsRef.current;
    if (!uniforms) return;
    const c = COLORS[theme];
    uniforms.uDark.value = theme === 'dark' ? 1 : 0;
    hexToVec3(c.a, uniforms.uA.value);
    hexToVec3(c.b, uniforms.uB.value);
    hexToVec3(c.c, uniforms.uC.value);
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
