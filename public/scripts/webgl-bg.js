/* ============================================================
   webgl-bg.js — atmospheric shader background
   fbm domain-warp flow + film grain + vignette.
   One fixed full-viewport canvas behind all content.
   Theme-aware: samples computed --bg / --ink each ~250ms so it
   follows the active theme. Vanilla WebGL1, no deps.
   Auto-mounts to <canvas id="glbg"> or any canvas[data-glbg].
   ============================================================ */
(function () {
  "use strict";

  const canvas = document.getElementById("glbg") || document.querySelector("canvas[data-glbg]");
  if (!canvas) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) { canvas.style.display = "none"; return; }

  /* ---- color probe: resolve a CSS custom property to rgb ---- */
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;left:-9999px;width:0;height:0;";
  document.body.appendChild(probe);
  function resolve(varName, fallback) {
    probe.style.color = fallback;
    probe.style.color = "var(" + varName + ")";
    const m = getComputedStyle(probe).color.match(/[\d.]+/g);
    if (!m) return [0, 0, 0];
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }
  let bgCol, inkCol, fog;
  function sampleTheme() {
    bgCol = resolve("--bg", "#080808");
    inkCol = resolve("--ink", "#e9e6df");
    // fog is faint against light paper — darken it a touch in light mode only
    fog = document.documentElement.dataset.theme === "light" ? 0.42 : 0.3;
  }
  sampleTheme();

  /* ---- shaders ---- */
  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
  const FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;uniform float uTime;uniform vec3 uBg;uniform vec3 uInk;uniform float uGrain;uniform float uFog;",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);",
    " float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));",
    " vec2 u=f*f*(3.0-2.0*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}return v;}",
    "void main(){",
    " vec2 uv=gl_FragCoord.xy/uRes.xy;",
    " vec2 p=uv*vec2(uRes.x/uRes.y,1.0)*1.6;",
    " float t=uTime*0.05;",
    " vec2 q=vec2(fbm(p+t),fbm(p+vec2(5.2,1.3)-t));",
    " float f=fbm(p+q*1.6+t*0.6);",
    " f=smoothstep(0.15,1.0,f);",
    " vec3 col=mix(uBg,uInk,f*uFog);",
    " float d=distance(uv,vec2(0.5));",
    " col*=1.0-d*0.55;",
    " float g=hash(gl_FragCoord.xy+fract(uTime)*vec2(13.0,7.0));",
    " col+=(g-0.5)*uGrain;",
    " gl_FragColor=vec4(col,1.0);",
    "}",
  ].join("\n");

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("glbg shader:", gl.getShaderInfoLog(s));
    }
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uBg = gl.getUniformLocation(prog, "uBg");
  const uInk = gl.getUniformLocation(prog, "uInk");
  const uGrain = gl.getUniformLocation(prog, "uGrain");
  const uFog = gl.getUniformLocation(prog, "uFog");
  gl.uniform1f(uGrain, 0.045);

  let W = 0, H = 0;
  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    W = Math.floor(innerWidth * DPR);
    H = Math.floor(innerHeight * DPR);
    canvas.width = W; canvas.height = H;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    gl.viewport(0, 0, W, H);
    gl.uniform2f(uRes, W, H);
  }
  resize();
  window.addEventListener("resize", resize);

  // re-sample theme colors periodically (cheap, follows the theme)
  setInterval(sampleTheme, 250);

  // instant re-sample on theme toggle (chrome.js full-navigations re-init the rest)
  window.addEventListener("themechange", sampleTheme);

  const start = performance.now();
  function render(now) {
    const t = (now - start) / 1000;
    gl.uniform1f(uTime, t);
    gl.uniform3f(uBg, bgCol[0], bgCol[1], bgCol[2]);
    gl.uniform3f(uInk, inkCol[0], inkCol[1], inkCol[2]);
    gl.uniform1f(uFog, fog);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(render);
  }
  let raf = requestAnimationFrame(render);

  // pause when tab hidden (save cycles)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else if (!reduce) { raf = requestAnimationFrame(render); }
  });
})();
