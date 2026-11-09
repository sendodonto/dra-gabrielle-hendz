/* Dra. Gabrielle Hendz: interface (sem dependencias). */
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
