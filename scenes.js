/* Cenas 3D (three.js via importmap). Cada cena so carrega perto da tela e pausa fora dela.
   - sculpture: escultura organica do hero (reage ao mouse no desktop)
   - face: a foto real do rosto em relevo 3D, com pontos clicaveis e camera que aproxima da regiao
   - curves: curvas abstratas da secao Bumbum Master */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

// Carrega a cena quando o container chega a 300px da tela; roda so enquanto visivel.
function whenNear(el, start) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '300px' });
  io.observe(el);
}

async function setup(el, { fov = 30, z = 4 } = {}) {
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ antialias: !lowEnd, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 50);
  camera.position.set(0, 0, z);
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x6b5448, 1.15));
  const key = new THREE.DirectionalLight(0xfff1e2, 2.4); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xd8c3a5, 1.6); rim.position.set(-3, 1.5, -3); scene.add(rim);

  let visible = false, raf = 0;
  const loop = { tick: null };
  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    frame(performance.now());
  };
  function frame(t) {
    loop.tick && loop.tick(t / 1000);
    renderer.render(scene, camera);
  }
  function run(t) { frame(t); if (visible && !reduced) raf = requestAnimationFrame(run); }
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(run);
  }).observe(el);
  return { THREE, renderer, scene, camera, loop, render: () => frame(performance.now()), resize };
}

// ---------- Escultura do hero ----------
async function sculpture(el) {
  const { THREE, scene, camera, loop, resize } = await setup(el, { fov: 30, z: 6.4 });
  const seg = lowEnd ? 48 : 96;
  const geo = new THREE.SphereGeometry(1, seg, seg);
  const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xe6d2b8, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.35, sheen: 0.5, sheenColor: 0xfff1e0 });
  const blob = new THREE.Mesh(geo, mat);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.012, 16, 160), new THREE.MeshStandardMaterial({ color: 0xbfa582, metalness: 0.7, roughness: 0.3 }));
  ring.rotation.set(1.15, 0.2, 0.3);
  const group = new THREE.Group(); group.add(blob, ring); scene.add(group);

  const target = { x: 0, y: 0 };
  if (finePointer && !reduced) addEventListener('pointermove', (e) => { target.x = (e.clientX / innerWidth - 0.5) * 0.6; target.y = (e.clientY / innerHeight - 0.5) * 0.4; }, { passive: true });

  const pos = geo.attributes.position;
  loop.tick = (t) => {
    const s = reduced ? 0 : t * 0.35;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
      const d = 1 + 0.14 * Math.sin(2.6 * x + s) * Math.sin(2.2 * y + 1.3 * s) * Math.sin(2.4 * z + 0.7 * s) + 0.05 * Math.sin(4 * y + s);
      pos.setXYZ(i, x * d, y * d * 1.12, z * d);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
    group.rotation.y += ((reduced ? 0 : t * 0.12) + target.x - group.rotation.y) * 0.05;
    group.rotation.x += (target.y - group.rotation.x) * 0.05;
    ring.rotation.z = reduced ? 0.3 : t * 0.1;
  };
  resize();
}

// ---------- Rosto 3D: a foto real vira relevo (mapa de profundidade feito a mao para esta foto) ----------
// Mundo: plano 4 x 5 (a foto e 800 x 1000). Pixel da foto 800x1000 -> X = px/200 - 2, Y = 2.5 - py/200.
// shortcut: o relevo segue os pontos desta foto (img/facial.webp); ao trocar a foto, ajuste FACE_DEPTH e regioes[*].pos.
const FACE_DEPTH = {
  head: { x: 0.075, y: 0.55, rx: 1.54, ry: 1.7, amp: 1.0 },      // cabeca + cabelo
  face: { x: 0.4, y: 0.3, rx: 0.95, ry: 1.3, amp: 0.32 },        // rosto (pele) a frente do cabelo
  neck: { x: 0.1, r: 0.85, amp: 0.62 },
  feats: [
    // [x, y, sigmaX, sigmaY, amplitude]
    [0.53, 0.42, 0.09, 0.32, 0.26],   // ponte do nariz
    [0.55, 0.12, 0.15, 0.12, 0.22],   // ponta do nariz
    [-0.075, 0.525, 0.2, 0.12, -0.13], [0.85, 0.675, 0.2, 0.12, -0.13],   // olhos
    [-0.06, 0.74, 0.26, 0.07, 0.05], [0.85, 0.9, 0.26, 0.07, 0.05],       // sobrancelhas
    [0.05, 0.12, 0.26, 0.22, 0.09], [1.17, 0.26, 0.24, 0.22, 0.08],       // macas
    [0.6, -0.4, 0.32, 0.11, 0.09],    // labios
    [0.67, -0.88, 0.26, 0.18, 0.12],  // queixo
  ],
};
const g2 = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2) / 2);
const dome = (x, y, c) => Math.sqrt(Math.max(0, 1 - ((x - c.x) / c.rx) ** 2 - ((y - c.y) / c.ry) ** 2));
function faceDepth(x, y) {
  const D = FACE_DEPTH;
  const skin = dome(x, y, D.face);
  let z = Math.max(dome(x, y, D.head) * D.head.amp, skin > 0 ? D.head.amp * 0.55 + skin * D.face.amp : 0);
  // pescoco e ombros sobem de baixo ate encontrar o queixo
  const nk = Math.sqrt(Math.max(0, 1 - ((x - D.neck.x) / D.neck.r) ** 2)) * D.neck.amp * Math.min(1, Math.max(0, (-0.55 - y) / 0.35));
  const sh = Math.sqrt(Math.max(0, 1 - ((x - 0.1) / 2.3) ** 2)) * 0.32 * Math.min(1, Math.max(0, (-1.5 - y) / 0.4));
  z = Math.max(z, nk, sh);
  let f = 0;
  for (const [cx, cy, sx, sy, a] of D.feats) f += a * g2(x, y, cx, cy, sx, sy);
  return z + f * Math.min(1, skin * 3);
}

async function face(el) {
  const img = el.querySelector('img');
  const { THREE, renderer, scene, camera, loop, render, resize } = await setup(el, { fov: 30, z: 9.4 });
  const tex = await new THREE.TextureLoader().loadAsync(img.currentSrc || img.src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // malha regular + 3 passadas de desfoque no relevo para nao ficar "amassado"
  const SX = lowEnd ? 100 : 160, SY = Math.round(SX * 1.25);
  const geo = new THREE.PlaneGeometry(4, 5, SX, SY);
  const p = geo.attributes.position;
  let d = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) d[i] = faceDepth(p.getX(i), p.getY(i));
  const W = SX + 1, H = SY + 1;
  for (let pass = 0; pass < 3; pass++) {
    const o = new Float32Array(d.length);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      let s = 0, n = 0;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < H && cc >= 0 && cc < W) { s += d[rr * W + cc]; n++; }
      }
      o[r * W + c] = s / n;
    }
    d = o;
  }
  for (let i = 0; i < p.count; i++) p.setZ(i, d[i]);
  geo.computeVertexNormals();
  // a foto ja tem a luz dela: material sem iluminacao e sem tone mapping, cor fiel
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const group = new THREE.Group(); group.add(mesh); group.scale.setScalar(1.14); scene.add(group);

  // pontos: posicao % da foto -> ponto 3D sobre o relevo
  const spots = [...el.querySelectorAll('.hotspot')].map((btn) => {
    const [u, v] = window.SITE.regioes[btn.dataset.region].pos;
    const x = (u / 100) * 4 - 2, y = 2.5 - (v / 100) * 5;
    return { btn, key: btn.dataset.region, local: new THREE.Vector3(x, y, faceDepth(x, y) + 0.04) };
  });

  // camera: volta ao enquadramento inteiro ou aproxima da regiao escolhida
  const home = { pos: new THREE.Vector3(0, 0, 9.4), look: new THREE.Vector3(0, 0, 0) };
  const cam = { pos: home.pos.clone(), look: home.look.clone() };
  const want = { pos: home.pos.clone(), look: home.look.clone() };
  const rot = { x: 0, y: 0 }, rotT = { x: 0, y: 0 };
  let focused = null, dragging = false, lastInput = -1e9;
  document.addEventListener('region:select', ({ detail }) => {
    focused = spots.find((s) => s.key === detail) || null;
    if (focused) {
      const w = focused.local.clone().multiplyScalar(1.14);
      // de frente para a regiao, sem deixar a borda da foto entrar no quadro (a ~5.7 do fundo, meia altura visivel ~1.5)
      w.y = Math.max(-1.25, Math.min(1.25, w.y)); w.x = Math.max(-1, Math.min(1, w.x));
      want.look.copy(w); want.pos.set(w.x, w.y, w.z + 4.2);
      rotT.x = 0; rotT.y = 0;
    } else { want.pos.copy(home.pos); want.look.copy(home.look); }
    if (reduced) { cam.pos.copy(want.pos); cam.look.copy(want.look); rot.x = rotT.x; rot.y = rotT.y; render(); }
  });

  // arrastar gira (limitado: e uma foto em relevo, nao uma cabeca inteira); no mouse, segue o ponteiro de leve
  const cv = renderer.domElement;
  const clamp = (val, a) => Math.max(-a, Math.min(a, val));
  let sx = 0, sy = 0, bx = 0, by = 0;
  cv.addEventListener('pointerdown', (e) => { dragging = true; cv.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; bx = rotT.y; by = rotT.x; lastInput = performance.now(); });
  cv.addEventListener('pointermove', (e) => {
    const b = cv.getBoundingClientRect();
    if (dragging) {
      rotT.y = clamp(bx + (e.clientX - sx) / b.width * 1.2, 0.32);
      rotT.x = clamp(by + (e.clientY - sy) / b.height * 0.6, 0.12);
    } else if (finePointer && !focused) {
      rotT.y = ((e.clientX - b.left) / b.width - 0.5) * 0.4;
      rotT.x = ((e.clientY - b.top) / b.height - 0.5) * 0.2;
    } else return;
    lastInput = performance.now();
    if (reduced) { rot.x = rotT.x; rot.y = rotT.y; render(); }
  });
  const up = () => { dragging = false; lastInput = performance.now(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { if (!dragging && finePointer) { rotT.x = 0; rotT.y = 0; } });

  const v = new THREE.Vector3();
  loop.tick = (t) => {
    // ocioso: balanco lento para mostrar que e 3D
    if (!reduced && !dragging && !focused && performance.now() - lastInput > 2500) { rotT.y = Math.sin(t * 0.45) * 0.18; rotT.x = Math.sin(t * 0.3) * 0.05; }
    const k = reduced ? 1 : 0.08;
    rot.x += (rotT.x - rot.x) * k; rot.y += (rotT.y - rot.y) * k;
    cam.pos.lerp(want.pos, reduced ? 1 : 0.07); cam.look.lerp(want.look, reduced ? 1 : 0.07);
    group.rotation.set(rot.x, rot.y, 0);
    camera.position.copy(cam.pos); camera.lookAt(cam.look);
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    const { width, height } = cv.getBoundingClientRect();
    for (const s of spots) {
      v.copy(s.local); group.localToWorld(v); v.project(camera);
      s.btn.style.left = `${(v.x * 0.5 + 0.5) * width}px`;
      s.btn.style.top = `${(-v.y * 0.5 + 0.5) * height}px`;
    }
  };
  resize();
  el.classList.add('is-3d');
}

// ---------- Curvas do Bumbum Master ----------
async function curves(el) {
  const { THREE, scene, loop, resize } = await setup(el, { fov: 30, z: 6 });
  const pts = [];
  for (let i = 0; i < 64; i++) { const t = (i / 64) * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(t) * 1.6, Math.sin(2 * t) * 0.75, Math.cos(t) * 0.6)); }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  const thick = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.16, 48, true), new THREE.MeshPhysicalMaterial({ color: 0xd8c3a5, roughness: 0.38, clearcoat: 0.7, sheen: 0.5 }));
  const thin = new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.014, 12, true), new THREE.MeshStandardMaterial({ color: 0xbfa582, metalness: 0.8, roughness: 0.25 }));
  thin.scale.setScalar(1.22); thin.rotation.z = 0.25;
  const group = new THREE.Group(); group.add(thick, thin); group.rotation.x = 0.35; scene.add(group);
  loop.tick = (t) => { if (!reduced) { group.rotation.y = t * 0.18; thin.rotation.x = Math.sin(t * 0.3) * 0.25; } };
  resize();
}

const scenes = { sculpture, face, curves };
if (webglOk()) {
  // economia de dados: a escultura e so decoracao, entao nem baixa o three.js por ela
  const saveData = navigator.connection?.saveData;
  document.querySelectorAll(saveData ? '[data-scene]:not([data-scene=sculpture])' : '[data-scene]').forEach((el) => {
    const run = () => scenes[el.dataset.scene](el).catch((e) => console.warn('3D indisponivel:', e));
    // o hero espera o navegador ficar livre para nao atrasar a primeira pintura
    el.dataset.scene === 'sculpture' ? (window.requestIdleCallback || setTimeout)(run, { timeout: 1200 }) : whenNear(el, run);
  });
}
