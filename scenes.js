/* Cenas 3D (three.js via importmap). Cada cena so carrega perto da tela e pausa fora dela.
   - sculpture: escultura organica do hero (reage ao mouse no desktop)
   - face: rosto feminino estilizado PROPRIO (geometria procedural), girar/zoom e pontos clicaveis
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

async function setup(el, { fov = 30, z = 4, controls = false } = {}) {
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
  const { THREE, scene, camera, loop, resize } = await setup(el, { fov: 30, z: 5.2 });
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

// ---------- Rosto estilizado (geometria propria) ----------
const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function headGeometry(THREE, seg) {
  const geo = new THREE.SphereGeometry(1, seg, seg);
  const p = geo.attributes.position;
  const g = (X, Y, cx, cy, ax, ay) => Math.exp(-(((X - cx) ** 2) / ax + ((Y - cy) ** 2) / ay));
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    let sx = 0.7, sz = 0.84;
    // metade de baixo: a mandibula afina ate o queixo e a nuca recolhe para o pescoco
    const t = Math.max(0, (-y - 0.15) / 0.85);
    sx *= 1 - 0.5 * t ** 1.3;
    if (z < 0) sz *= 1 - 0.55 * t;
    const X = x * sx, Y = y * 1.02;
    let Z = z * sz;
    const front = smooth(0.2, 0.7, z);
    const both = (cx, cy, ax, ay) => g(X, Y, cx, cy, ax, ay) + g(X, Y, -cx, cy, ax, ay);
    const dz =
      0.2 * g(X, Y, 0, -0.04, 0.004, 0.045) + 0.1 * g(X, Y, 0, -0.2, 0.008, 0.005)    // nariz (ponte e ponta)
      - 0.1 * both(0.23, 0.13, 0.016, 0.006) + 0.045 * both(0.24, 0.24, 0.025, 0.003) // olhos e sobrancelhas
      + 0.06 * both(0.35, -0.08, 0.018, 0.012)                                       // macas
      + 0.065 * g(X, Y, 0, -0.42, 0.016, 0.0022) - 0.03 * g(X, Y, 0, -0.465, 0.022, 0.0005) + 0.07 * g(X, Y, 0, -0.51, 0.014, 0.0028) // labios
      + 0.06 * g(X, Y, 0, -0.75, 0.016, 0.012);                                      // queixo
    Z += dz * front;
    p.setXYZ(i, X, Y, Z);
  }
  geo.computeVertexNormals();
  return geo;
}

const REGION_POINTS = { face: [0, 0.48], macas: [0.33, -0.1], labios: [0, -0.5], mandibula: [0.36, -0.6], queixo: [0, -0.78] };

async function face(el) {
  const loading = el.querySelector('.face__loading');
  if (!webglOk()) { loading.textContent = 'Seu navegador não exibe 3D. Explore as regiões pelos botões.'; return; }
  const { THREE, renderer, scene, camera, loop, render, resize } = await setup(el, { fov: 28, z: 5.4 });
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  loading.remove();
  // em tela estreita a camera afasta para o busto caber inteiro
  if (el.clientWidth / el.clientHeight < 1.1) camera.position.z = 6.4;

  const mat = new THREE.MeshPhysicalMaterial({ color: 0xeadfd3, roughness: 0.5, clearcoat: 0.25, sheen: 0.7, sheenColor: 0xfff3e6 });
  const geo = headGeometry(THREE, lowEnd ? 96 : 180);
  const head = new THREE.Mesh(geo, mat);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.36, 1.1, 64, 1, true), mat);
  neck.position.set(0, -1.15, -0.2);
  const bust = new THREE.Group(); bust.add(head, neck); bust.position.y = 0.2; scene.add(bust);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false; controls.enableDamping = !reduced;
  controls.minDistance = 3; controls.maxDistance = 7.5;
  controls.minPolarAngle = Math.PI * 0.3; controls.maxPolarAngle = Math.PI * 0.68;
  controls.target.set(0, -0.15, 0);
  controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.8;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('change', () => reduced && render());

  // Ancora de cada ponto: o vertice mais a frente perto das coordenadas da regiao.
  const p = geo.attributes.position, n = geo.attributes.normal;
  const box = el.querySelector('.face__hotspots');
  const spots = Object.entries(REGION_POINTS).map(([key, [tx, ty]]) => {
    let best = -1, bz = -9;
    for (let i = 0; i < p.count; i++) if (Math.abs(p.getX(i) - tx) < 0.04 && Math.abs(p.getY(i) - ty) < 0.04 && p.getZ(i) > bz) { bz = p.getZ(i); best = i; }
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'hotspot';
    btn.setAttribute('aria-label', window.SITE.regioes[key].nome);
    btn.addEventListener('click', () => document.dispatchEvent(new CustomEvent('region:select', { detail: key })));
    box.append(btn);
    return { key, btn, local: new THREE.Vector3().fromBufferAttribute(p, best), normal: new THREE.Vector3().fromBufferAttribute(n, best) };
  });
  document.addEventListener('region:select', ({ detail }) => {
    spots.forEach((s) => s.btn.classList.toggle('is-active', s.key === detail));
    const s = spots.find((x) => x.key === detail);
    if (!s) return;
    controls.autoRotate = false;
    // gira a camera para a regiao ficar de frente
    const dir = s.normal.clone().setY(0).normalize();
    const dist = camera.position.distanceTo(controls.target);
    camera.position.set(dir.x * dist, camera.position.y, dir.z * dist);
    controls.update(); render();
  });

  const v = new THREE.Vector3(), w = new THREE.Vector3(), toCam = new THREE.Vector3();
  loop.tick = () => {
    // com movimento reduzido nao ha loop: o proprio controle redesenha (update aqui geraria recursao)
    if (!reduced) controls.update();
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    const { width, height } = renderer.domElement.getBoundingClientRect();
    for (const s of spots) {
      w.copy(s.local); bust.localToWorld(w);
      const nrm = s.normal.clone().transformDirection(bust.matrixWorld);
      toCam.copy(camera.position).sub(w).normalize();
      s.btn.classList.toggle('is-back', nrm.dot(toCam) < 0.2);
      v.copy(w).project(camera);
      s.btn.style.transform = `translate(${(v.x * 0.5 + 0.5) * width}px, ${(-v.y * 0.5 + 0.5) * height}px)`;
    }
  };
  resize();
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
  document.querySelectorAll('[data-scene]').forEach((el) => {
    const run = () => scenes[el.dataset.scene](el).catch((e) => { console.warn('3D indisponivel:', e); el.querySelector('.face__loading')?.replaceChildren('Explore as regiões pelos botões.'); });
    // o hero espera o navegador ficar livre para nao atrasar a primeira pintura
    el.dataset.scene === 'sculpture' ? (window.requestIdleCallback || setTimeout)(run, { timeout: 1200 }) : whenNear(el, run);
  });
} else {
  document.querySelector('.face__loading')?.replaceChildren('Seu navegador não exibe 3D. Explore as regiões pelos botões.');
}
