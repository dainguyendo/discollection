"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

#define MAX_STEPS 112
#define MAX_DIST 14.0
#define SURFACE_DIST 0.0012

vec3 rotateY(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

vec3 rotateX(vec3 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);

  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amplitude * noise3(p);
    p = p * 2.02 + vec3(0.7, 1.4, 0.3);
    amplitude *= 0.52;
  }

  return value;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

float sdBox2(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float organicField(vec3 p) {
  float t = u_time * 0.5;

  vec3 q = rotateY(p, 0.055 * t);
  q = rotateX(q, 0.04 * t);
  q *= 1.0 + 0.035 * sin(0.45 * t);

  // Keep only a small central core so the silhouette reads as knot + torus.
  float jelly = length(q) - 0.5;

  // Torus cloud: dominant breathing ring.
  vec3 torP = q;
  torP = rotateX(torP, 0.2 * sin(0.22 * t));
  float torus = sdTorus(
    torP,
    vec2(0.82 + 0.05 * sin(0.33 * t), 0.29 + 0.03 * sin(0.4 * t))
  );

  // Ribbon knot: thicker and more twisted to dominate structure.
  vec3 ribP = q;
  float theta = atan(ribP.z, ribP.x);
  float radial = length(ribP.xz) - 0.72;
  float knotWarp = 0.18 * sin(3.2 * theta + 0.42 * t);
  vec2 ribbonFrame = vec2(
    radial + knotWarp,
    ribP.y + 0.24 * sin(2.4 * theta - 0.3 * t)
  );
  float ribbonA = sdBox2(ribbonFrame, vec2(0.09, 0.29));

  float thetaB = theta + 1.57;
  vec2 ribbonFrameB = vec2(
    radial + 0.14 * sin(2.8 * thetaB - 0.35 * t),
    ribP.y + 0.2 * sin(2.0 * thetaB + 0.22 * t)
  );
  float ribbonB = sdBox2(ribbonFrameB, vec2(0.07, 0.24));

  float ribbon = smin(ribbonA, ribbonB, 0.12);

  float merged = smin(torus, ribbon, 0.26);
  merged = smin(merged, jelly + 0.08, 0.12);

  float flow = fbm(q * 2.1 + vec3(0.0, 0.0, 0.15 * t));
  float ripple = 0.04 * sin(2.5 * q.y + 1.9 * q.x + 0.55 * t);
  float breath = 0.03 * sin(1.2 * q.y - 0.9 * q.z + 0.4 * t);

  return merged + (flow - 0.5) * 0.2 + ripple + breath;
}

float mapScene(vec3 p) {
  // Shift organism right so composition leans middle-right.
  return organicField(p - vec3(0.54, 0.03, 0.0));
}

vec3 getNormal(vec3 p) {
  vec2 e = vec2(0.0012, 0.0);
  float d = mapScene(p);
  vec3 n = d - vec3(
    mapScene(p - e.xyy),
    mapScene(p - e.yxy),
    mapScene(p - e.yyx)
  );
  return normalize(n);
}

vec3 palette(float t) {
  vec3 a = vec3(0.42, 0.66, 0.74);
  vec3 b = vec3(0.28, 0.38, 0.44);
  vec3 c = vec3(0.86, 0.95, 0.62);
  vec3 d = vec3(0.02, 0.31, 0.58);
  return a + b * cos(6.28318 * (c * t + d));
}

vec3 auroraPalette(float t) {
  vec3 a = vec3(0.23, 0.75, 0.64);
  vec3 b = vec3(0.29, 0.22, 0.41);
  vec3 c = vec3(1.0, 0.68, 0.55);
  vec3 d = vec3(0.18, 0.36, 0.79);
  return a + b * cos(6.28318 * (c * t + d));
}

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  float t = u_time * 0.5;
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  uv += vec2(-0.12, -0.01);

  vec3 ro = vec3(-0.42, 0.04, 2.7);
  vec3 rd = normalize(vec3(uv, -2.15));

  ro = rotateY(ro, 0.012 * t);
  rd = rotateY(rd, 0.012 * t);
  ro = rotateX(ro, 0.017 * t);
  rd = rotateX(rd, 0.017 * t);

  float distTravel = 0.0;
  float d = 0.0;
  bool hit = false;

  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * distTravel;
    d = mapScene(p);

    if (d < SURFACE_DIST) {
      hit = true;
      break;
    }

    if (distTravel > MAX_DIST) break;
    distTravel += d;
  }

  vec3 bg = vec3(0.085, 0.108, 0.22);

  if (!hit) {
    float vignette = smoothstep(1.2, 0.12, length(uv));
    gl_FragColor = vec4(bg * vignette + vec3(0.012, 0.012, 0.02), 1.0);
    return;
  }

  vec3 p = ro + rd * distTravel;
  vec3 n = getNormal(p);

  vec3 lightA = normalize(vec3(0.78, 0.34, 0.52));
  vec3 lightB = normalize(vec3(-0.7, 0.22, 0.3));
  vec3 lightC = normalize(vec3(0.16, -0.9, -0.2));

  float diffA = max(dot(n, lightA), 0.0);
  float diffB = max(dot(n, lightB), 0.0);
  float diffC = max(dot(n, lightC), 0.0);

  vec3 viewDir = normalize(ro - p);
  vec3 halfVec = normalize(lightA + viewDir);
  float spec = pow(max(dot(n, halfVec), 0.0), 9.0);

  float swirl = fbm(p * 1.5 + vec3(0.0, 0.0, 0.08 * t));
  float plasma = fbm(p * 2.5 + vec3(0.0, 0.17 * t, -0.09 * t));
  float tone =
    0.5 +
    0.33 * sin(1.9 * p.y + 1.4 * p.x + 0.35 * t) +
    0.24 * swirl;
  vec3 base = palette(tone + distTravel * 0.08);
  vec3 aurora = auroraPalette(
    plasma + 0.2 * sin(2.1 * p.y - 0.9 * p.z + 0.42 * t)
  );

  vec3 color = base * (0.24 + 0.72 * diffA + 0.28 * diffB + 0.1 * diffC);
  color += vec3(0.9, 0.93, 1.0) * spec * 0.16;

  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 3.0);
  color += base * fresnel * 0.22;
  color += vec3(0.48, 0.5, 0.9) * fresnel * 0.11;

  float backScatter = pow(max(dot(-n, lightA), 0.0), 2.0);
  color += base * backScatter * 0.08;
  color += aurora * (0.34 + 0.9 * fresnel) * (0.66 + 0.34 * diffA);
  color += aurora * 0.2 * (0.5 + 0.5 * sin(3.0 * p.y + 0.3 * t));

  float translucency = 0.3 + 0.7 * pow(max(dot(-n, viewDir), 0.0), 1.8);
  color += aurora * translucency * 0.22;

  float fog = exp(-0.085 * distTravel * distTravel);
  color = mix(bg, color, fog);

  float edge = pow(clamp(length(uv) * 1.05, 0.0, 1.0), 1.8);
  color.r += edge * 0.03;
  color.b += edge * 0.05;

  float grain = hash21(gl_FragCoord.xy + vec2(t * 58.0, t * 20.0)) -
    0.5;
  color += grain * 0.02;

  color = pow(max(color, 0.0), vec3(0.9));

  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram | null {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export function FractalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const timeLoc = gl.getUniformLocation(program, "u_time");

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = mediaQuery.matches;
    const onMediaChange = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
    };

    mediaQuery.addEventListener("change", onMediaChange);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    let rafId = 0;
    const start = performance.now();

    const render = (now: number) => {
      const elapsed = (now - start) * 0.001;
      const time = reduceMotion ? 0.0 : elapsed;

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      mediaQuery.removeEventListener("change", onMediaChange);

      if (positionBuffer) gl.deleteBuffer(positionBuffer);
      if (program) gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="empty-webgl-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="empty-webgl-canvas" />
      <div className="empty-webgl-vignette" />
    </div>
  );
}
