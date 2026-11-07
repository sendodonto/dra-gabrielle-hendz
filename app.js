/* Dra. Gabrielle Hendz: interface (sem dependencias). O 3D fica em scenes.js. */
(() => {
  const S = window.SITE;
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const phone = String(S.whatsapp || '').replace(/\D/g, '');
  const hasWa = /^55\d{10,11}$/.test(phone);
  if (S.whatsapp && !hasWa) console.warn('SITE.whatsapp invalido: use 55 + DDD + numero, so digitos.');
  const insta = `https://www.instagram.com/${S.instagram}/`;

  // ---------- Dados do config ----------
  $$('[data-insta]').forEach((a) => { a.href = insta; });
  $$('[data-crbm]').forEach((el) => { el.textContent = S.crbm; });
  $$('[data-channel]').forEach((el) => { el.textContent = hasWa ? 'WhatsApp' : 'Instagram'; });
  if (hasWa) {
    $$('[data-wa-only]').forEach((el) => { el.hidden = false; });
    $$('[data-wa-link]').forEach((a) => { a.href = `https://wa.me/${phone}`; });
  }
  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Header, botao flutuante e revelacao (IntersectionObserver, sem scroll listener) ----------
  const header = $('.header');
  new IntersectionObserver(([e]) => header.classList.toggle('is-solid', !e.isIntersecting)).observe($('.top-sentinel'));
  new IntersectionObserver(([e]) => root.classList.toggle('past-hero', !e.isIntersecting && e.boundingClientRect.top < 0)).observe($('.hero__actions'));
  const reveal = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); reveal.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach((el) => reveal.observe(el));

  // ---------- Menu mobile ----------
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const setMenu = (open) => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    header.classList.toggle('is-open', open);
    root.classList.toggle('locked', open);
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a, button')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  // ---------- Agendamento ----------
  const dlg = $('.book');
  const form = $('.book__form');
  const select = form.elements.proc;
  const err = $('.book__error');
  select.append(new Option('Selecione', ''));
  S.procedimentos.forEach((p) => select.append(new Option(p, p)));
  $('.book__note').textContent = hasWa
    ? 'Você será levada ao WhatsApp com a mensagem pronta para enviar.'
    : 'A mensagem será copiada e o Direct do Instagram será aberto. É só colar e enviar.';

  const openBook = (proc) => {
    form.reset(); err.hidden = true;
    $$('[aria-invalid]', form).forEach((f) => f.removeAttribute('aria-invalid'));
    if (proc && S.procedimentos.includes(proc)) select.value = proc;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    form.elements.nome.focus();
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (!b) return;
    e.preventDefault();
    openBook(b.dataset.book || '');
  });
  $('.book__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    const nome = f.nome.value.trim();
    const whatsDigits = f.whats.value.replace(/\D/g, '');
    const problems = [];
    const mark = (field, bad) => (bad ? field.setAttribute('aria-invalid', 'true') : field.removeAttribute('aria-invalid'));
    mark(f.nome, nome.length < 2); if (nome.length < 2) problems.push('seu nome');
    const whatsOk = whatsDigits.length >= 10 && whatsDigits.length <= 13;
    mark(f.whats, !whatsOk); if (!whatsOk) problems.push('um WhatsApp com DDD');
    mark(f.proc, !f.proc.value); if (!f.proc.value) problems.push('o procedimento de interesse');
    if (problems.length) {
      err.textContent = `Por favor, informe ${problems.join(', ')}.`;
      err.hidden = false;
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    err.hidden = true;
    const text = [
      'Olá, Dra. Gabrielle! Gostaria de agendar uma avaliação.',
      '',
      `Nome: ${nome}`,
      `WhatsApp: ${f.whats.value.trim()}`,
      `Procedimento de interesse: ${f.proc.value}`,
      f.msg.value.trim() ? `Mensagem: ${f.msg.value.trim()}` : '',
    ].filter((l, i, a) => l !== '' || a[i + 1] !== '').join('\n').trim();
    if (hasWa) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    } else {
      try { await navigator.clipboard.writeText(text); } catch { /* sem permissao de copiar: o texto segue visivel abaixo */ }
      window.open(`https://ig.me/m/${S.instagram}`, '_blank', 'noopener');
      $('.book__note').textContent = `Mensagem copiada. Cole no Direct: "${text.replace(/\n+/g, ' · ')}"`;
      return;
    }
    dlg.close();
  });

  // ---------- Busto 360: quadros de um giro real (img/busto) desenhados num canvas; arrastar gira com impulso ----------
  // ANG = angulo de cada quadro (o video acelera, entao nao e uniforme). De 340 a 360 o video nao fecha a volta: cruza o ultimo com o primeiro.
  const ANG = [0,2.3,4.7,7.1,9.4,11.8,14.1,16.3,18.6,20.9,23.1,25.4,27.8,30.2,32.6,34.9,37.2,39.5,41.8,44.2,46.6,49,51.5,54,56.4,58.8,61.2,63.5,65.7,67.9,70.1,72.3,74.8,77.9,81.5,83.4,85.4,87.5,89.5,91.7,93.9,96.1,98.3,100.6,103,105.2,107.5,109.8,112.2,114.5,116.9,119.2,121.6,124,126.5,129.1,131.6,134.2,136.8,139.4,141.9,144.5,147,149.6,152.1,154.7,157.3,159.8,162.2,164.5,166.7,168.9,171.1,173.3,175.4,177.5,179.5,181.4,184.9,188.3,191.7,195.5,197.5,199.6,201.6,203.7,205.9,208,210.2,212.3,214.7,216.8,218.9,221.1,223.3,225.5,227.8,230,232.1,234.4,236.5,238.7,240.8,243,245.1,247.2,249.3,251.5,253.5,255.5,257.6,259.7,261.8,263.9,265.9,268,270,273.9,275.9,277.8,281.6,283.6,285.6,289.5,291.5,293.5,295.5,297.5,299.6,301.7,303.7,305.8,307.9,310,312.1,314.1,316.2,318.3,320.4,322.4,324.5,326.5,330.4,332.3,336.1,340];
  const N = ANG.length, AUTO = 18;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const regionsBox = $('.face__regions');
  const info = $('.face__info');
  const photo = $('.face__photo');
  const layer = $('.face__layer', photo);
  const cv = $('.face__canvas', photo), ctx = cv.getContext('2d');
  // versao HD da frente para o zoom: entra no DOM so quando alguem escolhe uma regiao
  const hd = new Image();
  hd.className = 'face__hd'; hd.alt = ''; hd.decoding = 'async'; hd.setAttribute('aria-hidden', 'true');
  const resetBtn = $('.face__reset', photo);
  const intro = { title: $('.face__info-title', info).textContent, text: $('.face__info-text', info).textContent };
  const pick = (key) => document.dispatchEvent(new CustomEvent('region:select', { detail: key }));
  Object.entries(S.regioes).forEach(([key, r]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.region = key;
    b.setAttribute('aria-pressed', 'false'); b.textContent = r.nome;
    b.addEventListener('click', () => pick(key));
    regionsBox.append(b);
    const h = document.createElement('button');
    h.type = 'button'; h.className = 'hotspot'; h.dataset.region = key;
    h.style.left = `${r.pos[0]}%`; h.style.top = `${r.pos[1]}%`;
    const label = document.createElement('span');
    label.className = 'hotspot__label'; label.textContent = r.nome;
    h.append(label);
    h.setAttribute('aria-label', r.nome);
    h.addEventListener('click', () => pick(key));
    $('.face__hotspots', photo).append(h);
  });
  const swap = (title, text) => {
    $('.face__info-title', info).textContent = title;
    $('.face__info-text', info).textContent = text;
    info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
  };

  const src = (i) => `img/busto/${String(i).padStart(3, '0')}.webp`;
  const imgs = new Array(N);
  let angle = 0, vel = 0, dir = 1, target = null, dragging = false, focused = null, visible = false, lastInput = -1e9, raf = 0, last = 0;
  const mod = (x) => ((x % 360) + 360) % 360;
  const near = (i, step) => { for (let k = 0; k < N; k++) { const q = (i + k * step + N) % N; if (imgs[q]) return imgs[q]; } return null; };

  new ResizeObserver(() => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
    draw();
  }).observe(cv);

  // desenha o angulo atual: quadro de baixo + o seguinte por cima com a fracao (giro continuo)
  function draw() {
    const x = mod(angle);
    let lo = 0, hi = N - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ANG[m] <= x) lo = m; else hi = m - 1; }
    const i = lo, j = (i + 1) % N;
    const span = j === 0 ? 360 - ANG[i] : ANG[j] - ANG[i];
    // so mistura os dois quadros num trecho curto no meio: no resto do tempo aparece um quadro so, nitido
    const f = Math.min(1, Math.max(0, ((x - ANG[i]) / span - 0.4) / 0.2));
    const A = near(i, -1), B = near(j, 1);
    if (A && cv.width) {
      ctx.imageSmoothingQuality = 'high';
      ctx.globalAlpha = 1; ctx.drawImage(A, 0, 0, cv.width, cv.height);
      if (B && B !== A && f > 0.002) { ctx.globalAlpha = f; ctx.drawImage(B, 0, 0, cv.width, cv.height); }
    }
    const off = Math.min(x, 360 - x);
    photo.classList.toggle('is-front', off < 10); // os pontos so fazem sentido de frente
    photo.classList.toggle('is-hd', !!focused && off < 1);
  }

  const tick = (t) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    if (target !== null) {
      // mola criticamente amortecida ate o alvo (sem passar do ponto)
      angle += (target - angle) * (1 - Math.exp(-dt * 9));
      if (Math.abs(target - angle) < 0.05) { angle = target; target = null; }
    } else if (!dragging) {
      // uma so velocidade: o impulso desacelera ate parar e, ocioso, o giro automatico volta acelerando suave
      const idle = !focused && !reduced && performance.now() - lastInput > 2200;
      const vT = idle ? AUTO * dir : 0;
      vel += (vT - vel) * (1 - Math.exp(-dt * (idle ? 0.9 : 2.4)));
      angle += vel * dt;
    }
    draw();
    raf = visible && (target !== null || dragging || Math.abs(vel) > 0.3 || (!focused && !reduced)) ? requestAnimationFrame(tick) : 0;
  };
  const wake = () => { if (!raf && visible) { last = 0; raf = requestAnimationFrame(tick); } };

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; }
  }).observe(photo);
  // carrega so perto da secao, em camadas (1 a cada 32, 16, 8...): o giro funciona cedo e vai ficando mais fino
  const preload = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    preload.disconnect();
    const order = [], seen = new Set();
    for (const step of [32, 16, 8, 4, 2, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    order.forEach((i) => { const im = new Image(); im.src = src(i); im.decode().then(() => { imgs[i] = im; if (!raf) draw(); }, () => {}); });
  }, { rootMargin: '400px' });
  preload.observe(photo);

  // arrastar: 1:1 com o dedo, solta com a velocidade do gesto (impulso)
  let sx = 0, sa = 0, hist = [];
  photo.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || focused) return;
    dragging = true; target = null; vel = 0; photo.setPointerCapture(e.pointerId);
    sx = e.clientX; sa = angle; hist = [[e.clientX, e.timeStamp]];
    photo.classList.add('is-dragging'); wake();
  });
  photo.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    angle = sa + (e.clientX - sx) * (360 / (photo.clientWidth * 1.6));
    hist.push([e.clientX, e.timeStamp]); if (hist.length > 6) hist.shift();
    lastInput = performance.now();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false; photo.classList.remove('is-dragging');
    const [x0, t0] = hist[0], [x1, t1] = hist[hist.length - 1];
    vel = reduced || t1 === t0 ? 0 : ((x1 - x0) / (t1 - t0)) * 1000 * (360 / (photo.clientWidth * 1.6));
    if (Math.abs(vel) > 1) dir = Math.sign(vel);
    lastInput = performance.now(); wake();
  };
  photo.addEventListener('pointerup', release);
  photo.addEventListener('pointercancel', release);
  photo.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); target = (target ?? angle) + (e.key === 'ArrowRight' ? 15 : -15); lastInput = performance.now();
      if (reduced) { angle = target; target = null; draw(); } else wake();
    }
    if (e.key === 'Escape' && focused) pick(null);
  });

  document.addEventListener('region:select', ({ detail: key }) => {
    const r = S.regioes[key];
    focused = r ? key : null;
    $$('.chip', regionsBox).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.region === key)));
    $$('.hotspot', photo).forEach((h) => h.classList.toggle('is-active', h.dataset.region === key));
    lastInput = performance.now();
    if (!r) { photo.classList.remove('is-zoomed'); resetBtn.hidden = true; swap(intro.title, intro.text); wake(); draw(); return; }
    // gira pelo caminho mais curto ate a frente e aproxima da regiao
    vel = 0; target = Math.round(angle / 360) * 360;
    if (!hd.isConnected) { hd.src = 'img/busto/front-hd.webp'; cv.after(hd); }
    layer.style.transformOrigin = `${r.pos[0]}% ${r.pos[1]}%`;
    photo.classList.add('is-zoomed'); resetBtn.hidden = false;
    swap(r.nome, r.texto);
    if (reduced) { angle = target; target = null; draw(); } else wake();
  });
  resetBtn.addEventListener('click', () => pick(null));
  draw();

  // ---------- Resultados (so com fotos reais e autorizadas do config) ----------
  const hasResults = S.antesDepois.length || S.galeria.length || S.depoimentos.length;
  $('.results__empty').hidden = !!hasResults;
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('.results__compare').innerHTML = S.antesDepois.map((r) => `
    <figure class="ba-wrap"><div class="ba" style="--pos:50%">
      <img src="${esc(r.antes)}" alt="Antes: ${esc(r.legenda || '')}" loading="lazy">
      <img class="ba__after" src="${esc(r.depois)}" alt="Depois: ${esc(r.legenda || '')}" loading="lazy">
      <span class="ba__line"><span class="ba__knob"><svg class="i" aria-hidden="true"><use href="#i-left"/></svg><svg class="i" aria-hidden="true"><use href="#i-right"/></svg></span></span><span class="ba__tags"><span>Antes</span><span>Depois</span></span>
      <input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois${r.legenda ? ': ' + esc(r.legenda) : ''}">
    </div>${r.legenda ? `<figcaption>${esc(r.legenda)}</figcaption>` : ''}</figure>`).join('');
  $$('.ba__range').forEach((input) => input.addEventListener('input', () => input.parentElement.style.setProperty('--pos', `${input.value}%`)));
  $('.results__gallery').innerHTML = S.galeria.map((g, i) => `<li><button type="button" data-i="${i}"><img src="${esc(g.src)}" alt="${esc(g.legenda || 'Resultado')}" loading="lazy"></button></li>`).join('');
  $('.results__quotes').innerHTML = S.depoimentos.map((d) => `<blockquote class="quote"><p>“${esc(d.texto)}”</p><footer>${esc(d.nome)}${d.procedimento ? ' · ' + esc(d.procedimento) : ''}</footer></blockquote>`).join('');

  const lb = $('.lightbox');
  let idx = 0;
  const show = (i) => {
    idx = (i + S.galeria.length) % S.galeria.length;
    $('img', lb).src = S.galeria[idx].src; $('img', lb).alt = S.galeria[idx].legenda || 'Resultado';
    $('.lightbox__cap', lb).textContent = `${S.galeria[idx].legenda || ''} ${idx + 1}/${S.galeria.length}`.trim();
  };
  $('.results__gallery').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { show(+b.dataset.i); lb.showModal(); } });
  $('.lightbox__close').addEventListener('click', () => lb.close());
  $('.lightbox__prev').addEventListener('click', () => show(idx - 1));
  $('.lightbox__next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
})();
