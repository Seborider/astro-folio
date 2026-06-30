/**
 * Three.js balloon hero. Imperative WebGL — deliberately NOT unit-tested
 * (CLAUDE.md). The only pure bit lives in ./balloons-layout.ts.
 *
 * Each letter = a glossy, beveled TextGeometry "balloon" on a hanging cord.
 * Hover a cord → "CUT" cursor, click → the balloon floats up and off.
 * Hover a balloon → "POP" cursor, click/tap → it tears into latex shreds.
 * Popped/cut letters leave a gap; the reset button rebuilds them.
 */
import {
  AmbientLight,
  Box3,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  EquirectangularReflectionMapping,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Path,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  Scene,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  FontLoader,
  type Font,
} from "three/examples/jsm/loaders/FontLoader.js";
import { layoutGlyphs, riseOffset, type GlyphPlacement } from "./balloons-layout";

const FONT_URL = "/fonts/paytone-one.typeface.json";
// ponytail: fixed festive palette; wire to --accent later if the brand wants mono.
const PALETTE = [
  "#e8503a",
  "#f4b63f",
  "#2f7fed",
  "#36b37e",
  "#d6478f",
  "#8b5cf6",
];

type Mode = "float" | "rising" | "gone";

// Verlet rope (in root-local space, so gravity is just a constant). The rope
// hangs from the balloon's bottom; the anchor is re-pinned to the (bobbing)
// balloon every frame, which drives the sway/contraction/tangle.
const ROPE_PTS = 14;
const ROPE_LEN = 1.5;
const ROPE_TOP_INSET = 0.06; // tuck the knot up into the balloon so it touches
const ROPE_Z = -0.35; // behind the balloons (depth 0.42) so upper ropes pass
// behind the lower row's letters
const ROPE_RADIUS = 0.008; // thinner than the old rigid cord (0.02)
const ROPE_COLOR = 0x7a8794; // soft slate, brighter than the old near-black cord
const ROPE_HIT_RADIUS = 0.09; // fat invisible tube for the CUT raycast
const COLLIDE_SCALE = 0.9; // shrink collision boxes a touch so resting letters clear
// balloon push/spring tuning
const SPRING_K = 7; // pull back to home (buoyancy + rope tension)
const SPRING_DAMP = 3.5; // velocity damping rate
const CURSOR_PUSH = 9; // hover-shove strength
const BOUNCE_REST = 0.85; // letter–letter collision restitution
const OFFSET_CLAMP = 1.5; // max push offset, keeps a collision from flinging a letter
const VEL_MAX = 6; // max push velocity
const BURST_LIFE = 0.9; // pop-shred lifetime, seconds

interface Letter {
  group: Group; // holds the balloon mesh only
  balloon: Mesh;
  tube: Mesh; // visible rope (lives on root, simulated)
  proxy: Mesh; // fat invisible rope — the CUT raycast target
  pts: Vector3[]; // current rope points
  prev: Vector3[]; // previous rope points (verlet)
  baseX: number;
  baseY: number;
  hx: number; // collision half-extents (local units)
  hy: number;
  ox: number; // push offset from home (spring physics)
  oy: number;
  ovx: number; // push-offset velocity
  ovy: number;
  phase: number;
  mode: Mode;
  ropeFalling: boolean; // popped → the detached rope drops out of view
  vy: number;
  vx: number;
}

interface Burst {
  group: Group; // a handful of curved "latex" shreds
  vels: Vector3[];
  spins: Vector3[];
  mat: MeshPhysicalMaterial;
  life: number; // counts down from BURST_LIFE
}

export interface BalloonHandle {
  setActive(on: boolean): void;
  reset(): void;
  destroy(): void;
}

export async function start(
  canvas: HTMLCanvasElement,
  getLines: () => string[],
  hero: HTMLElement,
): Promise<BalloonHandle> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Smooth vertical gradient environment → one clean highlight band, no striped
  // reflections (RoomEnvironment's walls showed up as stripes on the gloss).
  const pmrem = new PMREMGenerator(renderer);
  const envTex = gradientEnvTexture();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();

  const key = new DirectionalLight(0xffffff, 2.6);
  key.position.set(2, 4, 5);
  scene.add(key, new AmbientLight(0xffffff, 0.6));

  const root = new Group();
  scene.add(root);

  const isTouch = matchMedia("(hover: none)").matches;
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const pointerNdc = new Vector2(); // live cursor for the balloon-push physics
  let pointerActive = false;
  const cursorLocal = new Vector3();

  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursorLabel");

  const font = await loadFont();
  const advance = (ch: string): number =>
    font.data.glyphs[ch]?.ha ?? font.data.glyphs["?"]?.ha ?? 500;
  const resolution: number = font.data.resolution ?? 1000;

  let letters: Letter[] = [];
  let pickables: Mesh[] = [];
  const bursts: Burst[] = [];
  // fixed bottom anchor (root-local y just below the visible bottom edge);
  // each rope's lower end is pinned here so it's tied to the page bottom.
  let bottomAnchorY = -3;
  // home block size (root-local, scale 1) — the stable basis refit() scales to.
  let blockW = 0;
  let blockH = 0;

  function buildLetters() {
    // re-read the DOM each build so reset() (header replay AND locale switch)
    // picks up the now-current localized title — not a stale start() snapshot.
    const lines = getLines();
    // extra tracking + line gap so the rounded balloons don't merge into mush
    const { placements } = layoutGlyphs(lines, advance, {
      lineHeight: resolution * 1,
      tracking: resolution * 0.2,
    });
    placements.forEach((p, i) => letters.push(makeLetter(p, i)));
    // Measure the block once, here at home (rise offset not yet applied) and at
    // scale 1, over the balloons only — so refit() has a fixed basis the rise
    // intro and rope sway can't perturb (and that never compounds on re-fit).
    root.scale.setScalar(1);
    root.updateMatrixWorld(true);
    const box = new Box3();
    for (const l of letters) box.expandByObject(l.balloon);
    const size = box.getSize(new Vector3());
    blockW = size.x || 1;
    blockH = size.y || 1;
    refit();
    rebuildPickables();
  }

  // Build a glyph as an extruded, round-cornered shape. The font outline has
  // sharp corners (the spiky 'b', boxy 'M'); Chaikin corner-cutting rounds the
  // 2D silhouette first, then a modest bevel rounds the depth edges — no 90°
  // corners and none of the self-intersection artifacts a huge bevel caused.
  function roundedGlyphGeometry(char: string): ExtrudeGeometry {
    const shapes = font.generateShapes(char, 1);
    const rounded = shapes.map(roundShape);
    return new ExtrudeGeometry(rounded, {
      depth: 0.42,
      curveSegments: 3, // outline is already finely sampled by Chaikin
      bevelEnabled: true,
      bevelThickness: 0.16,
      bevelSize: 0.12,
      bevelSegments: 10,
    });
  }

  function makeLetter(p: GlyphPlacement, i: number): Letter {
    const geo = roundedGlyphGeometry(p.char);
    geo.center(); // origin = glyph centre
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const hx = (bb.max.x - bb.min.x) / 2; // collision box half-extents
    const hy = (bb.max.y - bb.min.y) / 2;

    const mat = new MeshPhysicalMaterial({
      color: new Color(PALETTE[i % PALETTE.length]),
      roughness: 0.06,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.7,
    });
    const balloon = new Mesh(geo, mat);
    balloon.userData.kind = "balloon";

    const group = new Group();
    group.add(balloon);
    const x = (p.x / resolution) * 1;
    const y = (p.y / resolution) * 1;
    group.position.set(x, y, 0);
    root.add(group);

    // rope points: start hanging straight down from the balloon-bottom anchor,
    // set back in z so the rope sits behind the letters
    const ay = y - hy + ROPE_TOP_INSET;
    const pts: Vector3[] = [];
    const prev: Vector3[] = [];
    for (let k = 0; k < ROPE_PTS; k++) {
      const py = ay - (ROPE_LEN * k) / (ROPE_PTS - 1);
      pts.push(new Vector3(x, py, ROPE_Z));
      prev.push(new Vector3(x, py, ROPE_Z));
    }
    // tube + fat invisible hit proxy live on root (not the bobbing group) so the
    // rope simulates freely; geometry is rebuilt from pts every frame.
    const tube = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({ color: ROPE_COLOR }),
    );
    const proxy = new Mesh(
      new BufferGeometry(),
      new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    proxy.userData.kind = "string";
    root.add(tube, proxy);

    const letter: Letter = {
      group,
      balloon,
      tube,
      proxy,
      pts,
      prev,
      baseX: x,
      baseY: y,
      hx,
      hy,
      ox: 0,
      oy: 0,
      ovx: 0,
      ovy: 0,
      phase: i * 1.7,
      mode: "float",
      ropeFalling: false,
      vy: 0,
      vx: 0,
    };
    balloon.userData.letter = letter;
    proxy.userData.letter = letter;
    rebuildRope(letter);
    return letter;
  }

  // Rebuild the visible + hit-proxy tube geometry from the current rope points.
  // ponytail: rebuild per frame; pool geometries only if it ever janks.
  function rebuildRope(l: Letter) {
    const curve = new CatmullRomCurve3(l.pts);
    const seg = ROPE_PTS * 2;
    l.tube.geometry.dispose();
    l.tube.geometry = new TubeGeometry(curve, seg, ROPE_RADIUS, 5, false);
    l.proxy.geometry.dispose();
    l.proxy.geometry = new TubeGeometry(curve, seg, ROPE_HIT_RADIUS, 3, false);
  }

  // One verlet step: re-pin the top to the balloon, integrate, then satisfy the
  // fixed-length constraints. Slack curls up (contract), the swing crosses
  // neighbours (tangle look). No rope-rope collision — the crossing reads enough.
  function stepRope(l: Letter, dt: number, t: number) {
    const pts = l.pts;
    const prev = l.prev;
    const last = pts.length - 1;
    const ax = l.group.position.x; // top anchor: balloon bottom (moves with bob)
    const ay = l.group.position.y - l.hy + ROPE_TOP_INSET;
    const bx = l.baseX; // bottom anchor: fixed below the letter at page bottom
    const by = bottomAnchorY;
    const grav = -4 * dt * dt;
    const damp = 0.97;
    const wind = Math.sin(t * 1.2 + l.phase) * 0.0014;
    // integrate interior points only — both ends are pinned
    for (let i = 1; i < last; i++) {
      const p = pts[i];
      const pr = prev[i];
      const vx = (p.x - pr.x) * damp;
      const vy = (p.y - pr.y) * damp;
      const vz = (p.z - pr.z) * damp;
      pr.copy(p);
      p.x += vx + wind;
      p.y += vy + grav;
      p.z += vz + Math.sin(t * 0.9 + i * 0.6 + l.phase) * 0.0004; // gentle z → crossing
    }
    // rest length spans home-top → fixed bottom, taut at home; pushing the
    // balloon down adds slack (rope relaxes), it re-tautens on the way up
    const restLen = l.baseY - l.hy + ROPE_TOP_INSET - by;
    const segLen = restLen / (ROPE_PTS - 1);
    for (let k = 0; k < 14; k++) {
      pts[0].set(ax, ay, ROPE_Z); // pin top
      pts[last].set(bx, by, ROPE_Z); // pin bottom (page foot)
      for (let i = 0; i < last; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        const d = Math.hypot(dx, dy, dz) || 1e-6;
        const diff = (d - segLen) / d;
        a.x += dx * 0.5 * diff;
        a.y += dy * 0.5 * diff;
        a.z += dz * 0.5 * diff;
        b.x -= dx * 0.5 * diff;
        b.y -= dy * 0.5 * diff;
        b.z -= dz * 0.5 * diff;
      }
    }
    pts[0].set(ax, ay, ROPE_Z); // keep both ends exact after the relaxation
    pts[last].set(bx, by, ROPE_Z);
    rebuildRope(l);
  }

  function rebuildPickables() {
    pickables = [];
    for (const l of letters) {
      if (l.mode === "gone") continue;
      pickables.push(l.balloon, l.proxy);
    }
  }

  // scale + centre the block to fill ~82% of the visible width, from the cached
  // home block size (set in buildLetters) so it's deterministic per aspect.
  function refit() {
    if (!blockW) return;
    root.scale.setScalar(1);
    root.position.set(0, 0, 0);
    const visH =
      2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const scale = Math.min((visW * 0.82) / blockW, (visH * 0.62) / blockH);
    root.scale.setScalar(scale);
    // page bottom in root-local units, a touch below the edge so the knot hides
    bottomAnchorY = -(visH / 2) / scale - 0.3;
  }

  // Pop = the balloon tears into a few glossy, curved latex shreds (sphere
  // patches in the balloon's colour) that fly out, tumble and fall — not a
  // pixel particle cloud.
  function spawnBurst(at: Vector3, color: Color) {
    const N = 9;
    const group = new Group();
    group.position.copy(at);
    const mat = new MeshPhysicalMaterial({
      color,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      side: DoubleSide,
      transparent: true,
      envMapIntensity: 1.7,
    });
    const vels: Vector3[] = [];
    const spins: Vector3[] = [];
    for (let i = 0; i < N; i++) {
      // a small curved patch of the balloon skin
      const rad = 0.12 + Math.random() * 0.14;
      const geo = new SphereGeometry(
        rad,
        5,
        4,
        Math.random() * Math.PI * 2,
        0.6 + Math.random() * 0.7,
        0.4 + Math.random() * 0.5,
        0.5 + Math.random() * 0.7,
      );
      const m = new Mesh(geo, mat);
      m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      group.add(m);
      const a = Math.random() * Math.PI * 2;
      const sp = 1.8 + Math.random() * 2.4;
      vels.push(
        new Vector3(
          Math.cos(a) * sp,
          Math.sin(a) * sp * 0.6 + Math.random() * 1.6,
          (Math.random() - 0.5) * sp,
        ),
      );
      spins.push(
        new Vector3(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 16,
        ),
      );
    }
    scene.add(group);
    bursts.push({ group, vels, spins, mat, life: BURST_LIFE });
  }

  function pop(l: Letter) {
    if (l.mode === "gone") return;
    const world = l.balloon.getWorldPosition(new Vector3());
    spawnBurst(world, (l.balloon.material as MeshPhysicalMaterial).color);
    l.mode = "gone";
    l.group.visible = false;
    l.ropeFalling = true; // the held string drops away
    l.vy = 0;
    rebuildPickables();
  }

  function cut(l: Letter) {
    if (l.mode !== "float") return;
    l.mode = "rising";
    l.vy = 0.4;
    l.vx = (Math.random() - 0.5) * 0.6;
    l.tube.visible = false;
    l.proxy.visible = false;
    rebuildPickables();
  }

  function disposeLetter(l: Letter) {
    disposeGroup(l.group);
    for (const m of [l.tube, l.proxy]) {
      m.parent?.remove(m);
      m.geometry.dispose();
      (m.material as MeshBasicMaterial).dispose();
    }
  }

  function reset() {
    for (const l of letters) disposeLetter(l);
    for (const b of bursts) disposeBurst(b);
    bursts.length = 0;
    letters = [];
    buildLetters();
    introStart = performance.now(); // replay the rise on reset
  }

  function pickAt(clientX: number, clientY: number): Mesh | null {
    const r = canvas.getBoundingClientRect();
    ndc.x = ((clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return (hit?.object as Mesh) ?? null;
  }

  function onMove(e: PointerEvent) {
    if (isTouch || !cursor) return;
    const rect = canvas.getBoundingClientRect();
    pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    pointerActive = true;
    const obj = pickAt(e.clientX, e.clientY);
    const kind = obj?.userData.kind as string | undefined;
    if (kind) {
      cursor.classList.add("is-hover");
      if (cursorLabel) {
        cursorLabel.textContent = kind === "string" ? "CUT" : "POP";
        cursorLabel.style.opacity = "1";
      }
    } else {
      cursor.classList.remove("is-hover");
      if (cursorLabel) cursorLabel.style.opacity = "0";
    }
  }

  let downX = 0;
  let downY = 0;
  function onDown(e: PointerEvent) {
    downX = e.clientX;
    downY = e.clientY;
  }
  function onUp(e: PointerEvent) {
    // ignore drags / scroll gestures
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
    const obj = pickAt(e.clientX, e.clientY);
    const letter = obj?.userData.letter as Letter | undefined;
    if (!obj || !letter) return;
    if (obj.userData.kind === "string") cut(letter);
    else pop(letter);
  }

  function onLeave() {
    pointerActive = false; // cursor gone → balloons spring back, ropes re-tauten
  }

  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  // AABB overlap of two letters along the axis of least penetration, or 0/0.
  function overlap(a: Letter, b: Letter): { dx: number; dy: number; px: number; py: number } {
    const dx = b.baseX + b.ox - (a.baseX + a.ox);
    const dy = b.baseY + b.oy - (a.baseY + a.oy);
    const px = (a.hx + b.hx) * COLLIDE_SCALE - Math.abs(dx);
    const py = (a.hy + b.hy) * COLLIDE_SCALE - Math.abs(dy);
    return { dx, dy, px, py };
  }

  // Positional separation: shove each letter half the penetration apart.
  function separate(a: Letter, b: Letter) {
    const { dx, dy, px, py } = overlap(a, b);
    if (px <= 0 || py <= 0) return;
    if (px < py) {
      const s = (dx < 0 ? -px : px) * 0.5;
      a.ox -= s;
      b.ox += s;
    } else {
      const s = (dy < 0 ? -py : py) * 0.5;
      a.oy -= s;
      b.oy += s;
    }
  }

  // A rising (cut) balloon barges upward: it doesn't yield, it just knocks the
  // float balloon in its way to the nearest side so it can squeeze between them.
  function shoveAside(r: Letter, f: Letter) {
    const dx = f.baseX + f.ox - r.group.position.x;
    const dy = f.baseY + f.oy - r.group.position.y;
    const px = (r.hx + f.hx) * COLLIDE_SCALE - Math.abs(dx);
    const py = (r.hy + f.hy) * COLLIDE_SCALE - Math.abs(dy);
    if (px <= 0 || py <= 0) return;
    const side = dx >= 0 ? 1 : -1;
    // gentle: ease the float aside a small step per frame (no velocity impulse,
    // so it's nudged, not shot away); its spring eases it back once the riser
    // has squeezed through.
    f.ox += side * Math.min(px, 0.05);
  }

  // Velocity response: an (almost) elastic equal-mass collision swaps the normal
  // velocity component, so a moving balloon hands its motion to the one it hits.
  function bounce(a: Letter, b: Letter) {
    const { dx, dy, px, py } = overlap(a, b);
    if (px <= 0 || py <= 0) return;
    if (px < py) {
      const rel = b.ovx - a.ovx;
      if ((dx > 0 && rel < 0) || (dx < 0 && rel > 0)) {
        const t = a.ovx;
        a.ovx = b.ovx * BOUNCE_REST;
        b.ovx = t * BOUNCE_REST;
      }
    } else {
      const rel = b.ovy - a.ovy;
      if ((dy > 0 && rel < 0) || (dy < 0 && rel > 0)) {
        const t = a.ovy;
        a.ovy = b.ovy * BOUNCE_REST;
        b.ovy = t * BOUNCE_REST;
      }
    }
  }

  function resize() {
    const r = hero.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    refit();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(hero);
  resize();

  buildLetters();

  // ---- loop ----
  let raf = 0;
  let active = false;
  let last = performance.now();
  // wall-clock (ms) the rise intro started; 0 = not yet revealed.
  // ponytail: wall-clock, so scrolling away mid-intro lets it advance while
  // paused — fine for above-the-fold headings that never pause that early.
  let introStart = 0;
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = now / 1000;

    // cursor position on the z=0 plane, in root-local units (for the push)
    let hasCursor = false;
    if (pointerActive && !isTouch) {
      raycaster.setFromCamera(pointerNdc, camera);
      const ro = raycaster.ray.origin;
      const rd = raycaster.ray.direction;
      if (Math.abs(rd.z) > 1e-6) {
        const tt = -ro.z / rd.z;
        cursorLocal.set(ro.x + rd.x * tt, ro.y + rd.y * tt, 0);
        root.worldToLocal(cursorLocal);
        hasCursor = true;
      }
    }

    // pass 1: integrate each balloon's push/spring offset (positions not set yet)
    for (const l of letters) {
      if (l.mode !== "float") continue;
      // cursor inside the collision box → shove the balloon away from it
      if (hasCursor) {
        const dx = l.baseX + l.ox - cursorLocal.x;
        const dy = l.baseY + l.oy - cursorLocal.y;
        if (Math.abs(dx) < l.hx && Math.abs(dy) < l.hy) {
          const m = Math.hypot(dx, dy) || 1e-4;
          l.ovx += (dx / m) * CURSOR_PUSH * dt;
          l.ovy += (dy / m) * CURSOR_PUSH * dt;
        }
      }
      // spring back home (buoyancy + rope tension) + damping
      l.ovx += -SPRING_K * l.ox * dt;
      l.ovy += -SPRING_K * l.oy * dt;
      const d = Math.max(0, 1 - SPRING_DAMP * dt);
      l.ovx *= d;
      l.ovy *= d;
      l.ox += l.ovx * dt;
      l.oy += l.ovy * dt;
      if (l.oy > 0) {
        l.oy = 0; // can't rise above home: the rope is already taut there
        if (l.ovy > 0) l.ovy = 0;
      }
      // stability: a collision must never fling a balloon off-screen or strand
      // it in a NaN state (|| 0 turns NaN back into 0)
      l.ox = MathUtils.clamp(l.ox, -OFFSET_CLAMP, OFFSET_CLAMP) || 0;
      l.oy = MathUtils.clamp(l.oy, -OFFSET_CLAMP, 0) || 0;
      l.ovx = MathUtils.clamp(l.ovx, -VEL_MAX, VEL_MAX) || 0;
      l.ovy = MathUtils.clamp(l.ovy, -VEL_MAX, VEL_MAX) || 0;
    }

    // pass 2: letter–letter collisions. Separate positions over a few
    // relaxation iterations, then transfer velocity once so a shoved balloon
    // actually knocks its neighbour (the 'b' moves when you push the 'o' in).
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < letters.length; i++) {
        const a = letters[i];
        if (a.mode !== "float") continue;
        for (let j = i + 1; j < letters.length; j++) {
          const b = letters[j];
          if (b.mode === "float") separate(a, b);
        }
      }
    }
    for (let i = 0; i < letters.length; i++) {
      const a = letters[i];
      if (a.mode !== "float") continue;
      for (let j = i + 1; j < letters.length; j++) {
        const b = letters[j];
        if (b.mode === "float") bounce(a, b);
      }
    }
    // a rising balloon shoves the float balloons above it out of its path
    for (const r of letters) {
      if (r.mode !== "rising") continue;
      for (const f of letters) {
        if (f.mode === "float") shoveAside(r, f);
      }
    }

    // pass 3: apply positions + step ropes; advance rising/gone letters
    for (let i = 0; i < letters.length; i++) {
      const l = letters[i];
      if (l.mode === "float") {
        if (l.oy > 0) {
          l.oy = 0;
          if (l.ovy > 0) l.ovy = 0;
        }
        const bobX = Math.sin(t * 0.5 + l.phase * 1.3) * 0.02;
        const bobY = Math.sin(t * 0.8 + l.phase) * 0.03;
        l.group.position.x = l.baseX + l.ox + bobX;
        l.group.position.y = l.baseY + l.oy + bobY + riseOffset(i, now, introStart);
        l.group.rotation.z = Math.sin(t * 0.6 + l.phase) * 0.04 - l.ovx * 0.12;
        stepRope(l, dt, t);
      } else if (l.mode === "rising") {
        l.vy += 0.9 * dt; // helium
        l.group.position.y += l.vy * dt;
        l.group.position.x += l.vx * dt;
        l.group.rotation.z += dt * 0.6;
        if (l.group.position.y > l.baseY + 9) {
          l.mode = "gone";
          l.group.visible = false;
        }
      }

      // a popped balloon's string detaches and drops straight down out of view
      if (l.ropeFalling) {
        l.vy += 6 * dt;
        const dy = -l.vy * dt;
        for (const p of l.pts) p.y += dy;
        rebuildRope(l);
        if (l.pts[0].y < bottomAnchorY) {
          l.tube.visible = false;
          l.proxy.visible = false;
          l.ropeFalling = false;
        }
      }
    }

    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.life -= dt;
      const f = Math.max(0, b.life / BURST_LIFE);
      b.mat.opacity = f;
      const kids = b.group.children;
      for (let k = 0; k < kids.length; k++) {
        const m = kids[k] as Mesh;
        const v = b.vels[k];
        v.y -= 7 * dt; // gravity
        m.position.addScaledVector(v, dt);
        const s = b.spins[k];
        m.rotation.x += s.x * dt;
        m.rotation.y += s.y * dt;
        m.rotation.z += s.z * dt;
        m.scale.setScalar(0.7 + 0.3 * f); // shrink a touch as it fades
      }
      if (b.life <= 0) {
        disposeBurst(b);
        bursts.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }

  function setActive(on: boolean) {
    if (on === active) return;
    active = on;
    if (on) {
      last = performance.now();
      if (!introStart) introStart = last; // start the rise on first reveal
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }

  function destroy() {
    setActive(false);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointerleave", onLeave);
    ro.disconnect();
    for (const l of letters) disposeLetter(l);
    for (const b of bursts) disposeBurst(b);
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { setActive, reset, destroy };
}

function disposeGroup(g: Group) {
  g.parent?.remove(g);
  g.traverse((o) => {
    const m = o as Mesh;
    m.geometry?.dispose?.();
    const mat = m.material as { dispose?: () => void } | undefined;
    mat?.dispose?.();
  });
}

function disposeBurst(b: Burst) {
  b.group.parent?.remove(b.group);
  for (const c of b.group.children) (c as Mesh).geometry.dispose();
  b.mat.dispose();
}

async function loadFont(): Promise<Font> {
  const res = await fetch(FONT_URL);
  const json = await res.json();
  return new FontLoader().parse(json);
}

// Round a glyph's silhouette (outline + counters) by Chaikin corner-cutting.
function roundShape(shape: Shape): Shape {
  const out = new Shape(chaikin(shape.getPoints(6), 3));
  out.holes = shape.holes.map((h) => new Path(chaikin(h.getPoints(6), 3)));
  return out;
}

// Chaikin corner-cutting on a closed polyline: each iteration replaces every
// corner with two points at 1/4 and 3/4 along its edges → progressively rounder.
function chaikin(pts: Vector2[], iterations: number): Vector2[] {
  let p = pts;
  if (p.length > 1 && p[0].distanceTo(p[p.length - 1]) < 1e-6)
    p = p.slice(0, -1);
  for (let k = 0; k < iterations; k++) {
    const next: Vector2[] = [];
    const n = p.length;
    for (let i = 0; i < n; i++) {
      const a = p[i];
      const b = p[(i + 1) % n];
      next.push(new Vector2(a.x * 0.75 + b.x * 0.25, a.y * 0.75 + b.y * 0.25));
      next.push(new Vector2(a.x * 0.25 + b.x * 0.75, a.y * 0.25 + b.y * 0.75));
    }
    p = next;
  }
  return p;
}

// A 1×N vertical gradient used as the reflection environment: bright top →
// mid → dark bottom. Reflected on the gloss it reads as a single soft highlight
// that fades down the letter — clean, no stripes.
function gradientEnvTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  // light theme (--fog set, the same signal webgl-bg.js reads): the letters sit
  // on a pale --fog-blue sky. The glossy lower faces reflect the bottom of this
  // gradient, so the dark band below would read as a dark shadow lit from behind
  // (and is identical in dark mode, where it belongs). In light mode swap it for
  // a pale sky-blue derived from --fog — no dark band, reflection matches the bg.
  const fog = getComputedStyle(document.documentElement)
    .getPropertyValue("--fog")
    .trim();
  if (fog) {
    const pale = new Color(0xffffff).lerp(new Color(fog), 0.25);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.55, "#ffffff");
    g.addColorStop(1, `#${pale.getHexString()}`);
  } else {
    // dark theme: mostly bright (keeps the candy gloss), with a soft dark band
    // low down so each letter still gets a top→bottom shade + one clean highlight
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.4, "#f2f5fb");
    g.addColorStop(0.7, "#c2c8d4");
    g.addColorStop(1, "#7f8492");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  const tex = new CanvasTexture(c);
  tex.mapping = EquirectangularReflectionMapping;
  return tex;
}
