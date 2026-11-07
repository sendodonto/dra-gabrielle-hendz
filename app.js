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

  // ---------- Rosto interativo: chips, pontos na foto, zoom na regiao e leve inclinacao 3D ----------
  const regionsBox = $('.face__regions');
  const info = $('.face__info');
  const photo = $('.face__photo');
  const layer = $('.face__layer', photo);
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
  document.addEventListener('region:select', ({ detail: key }) => {
    const r = S.regioes[key];
    $$('.chip', regionsBox).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.region === key)));
    $$('.hotspot', photo).forEach((h) => h.classList.toggle('is-active', h.dataset.region === key));
    if (!r) { photo.classList.remove('is-zoomed'); resetBtn.hidden = true; swap(intro.title, intro.text); return; }
    // o zoom parte do ponto escolhido: a foto aproxima "em direcao" a regiao
    layer.style.transformOrigin = `${r.pos[0]}% ${r.pos[1]}%`;
    photo.classList.add('is-zoomed'); resetBtn.hidden = false;
    swap(r.nome, r.texto);
  });
  resetBtn.addEventListener('click', () => pick(null));
  photo.addEventListener('keydown', (e) => { if (e.key === 'Escape' && photo.classList.contains('is-zoomed')) pick(null); });

  // inclinacao: so com mouse e sem movimento reduzido; segue o ponteiro com amortecimento (rAF, sem scroll listener)
  if (matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
    const tilt = $('.face__tilt', photo);
    const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
    let raf = 0;
    const step = () => {
      cur.x += (tgt.x - cur.x) * 0.12; cur.y += (tgt.y - cur.y) * 0.12;
      tilt.style.transform = `rotateX(${cur.y.toFixed(3)}deg) rotateY(${cur.x.toFixed(3)}deg)`;
      raf = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.01 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    photo.addEventListener('pointermove', (e) => {
      if (photo.classList.contains('is-3d')) return; // o 3D cuida da inclinacao
      const b = photo.getBoundingClientRect();
      tgt.x = ((e.clientX - b.left) / b.width - 0.5) * 8;
      tgt.y = -((e.clientY - b.top) / b.height - 0.5) * 8;
      kick();
    });
    photo.addEventListener('pointerleave', () => { tgt.x = 0; tgt.y = 0; kick(); });
  }

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
