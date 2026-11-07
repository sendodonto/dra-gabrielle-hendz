/* Cenas 3D (three.js via importmap). Cada cena so carrega perto da tela e pausa fora dela.
   - sculpture: escultura organica do hero (reage ao mouse no desktop)
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
  return { THREE, scene, camera, loop, resize };
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

const scenes = { sculpture, curves };
if (webglOk()) {
  // economia de dados: a escultura e so decoracao, entao nem baixa o three.js por ela
  const saveData = navigator.connection?.saveData;
  document.querySelectorAll(saveData ? '[data-scene]:not([data-scene=sculpture])' : '[data-scene]').forEach((el) => {
    const run = () => scenes[el.dataset.scene](el).catch((e) => console.warn('3D indisponivel:', e));
    // o hero espera o navegador ficar livre para nao atrasar a primeira pintura
    el.dataset.scene === 'sculpture' ? (window.requestIdleCallback || setTimeout)(run, { timeout: 1200 }) : whenNear(el, run);
  });
}
