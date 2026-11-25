(async function () {
  mountSunflowers();
  const $ = s => document.querySelector(s);
  let c = DEFAULT_CONTENT;
  try {
    const r = await fetch('data/content.json?v=' + Date.now());
    if (r.ok) c = { ...DEFAULT_CONTENT, ...(await r.json()) };
  } catch (e) { /* abrindo direto do arquivo: usa o conteúdo padrão */ }

  document.title = c.title;
  const t = $('#title'); t.textContent = '';
  c.title.split('+').forEach((part, i, arr) => {
    t.append(part);
    if (i < arr.length - 1) { const s = document.createElement('span'); s.className = 'plus'; s.textContent = '+'; t.append(s); }
  });
  $('#subtitle').textContent = c.subtitle;
  $('#galleryTitle').textContent = c.galleryTitle;
  $('#versesTitle').textContent = c.versesTitle;
  $('#mapTitle').textContent = c.mapTitle;
  $('#mapText').textContent = c.mapText;
  $('#footer').textContent = c.footer;

  /* ---- Contador ---- */
  const start = new Date(c.start);
  const lbl = $('#counterLabel'), units = $('#units'), total = $('#total');
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    if (isNaN(start)) { lbl.textContent = ''; return; }
    const now = new Date(), future = start > now;
    const p = future ? diffParts(now, start) : diffParts(start, now);
    lbl.textContent = future ? 'Faltam' : c.counterLabel;
    const list = [];
    if (p.y > 0) list.push([p.y, p.y === 1 ? 'ano' : 'anos']);
    list.push([p.mo, p.mo === 1 ? 'mês' : 'meses'], [p.d, p.d === 1 ? 'dia' : 'dias'],
              [pad(p.h), 'horas'], [pad(p.mi), 'minutos'], [pad(p.s), 'segundos']);
    units.innerHTML = list.map(([n, l]) => `<div class="unit"><b>${n}</b><span>${l}</span></div>`).join('');
    const days = Math.floor(Math.abs(now - start) / 86400000);
    total.textContent = future ? '' : `${days} ${days === 1 ? 'dia' : 'dias'} de nós`;
  }
  tick(); setInterval(tick, 1000);

  /* ---- Galeria + lightbox ---- */
  const photos = c.photos || [];
  const g = $('#gallery');
  if (!photos.length) $('#galleryEmpty').hidden = false;
  photos.forEach((p, i) => {
    const fig = document.createElement('figure');
    const btn = document.createElement('button'); btn.type = 'button'; btn.setAttribute('aria-label', 'Ampliar foto');
    const img = document.createElement('img');
    img.src = p.src; img.alt = p.caption || 'Foto'; img.loading = 'lazy';
    if (p.w && p.h) { img.width = p.w; img.height = p.h; }
    btn.append(img); btn.addEventListener('click', () => open(i)); fig.append(btn);
    if (p.caption) { const fc = document.createElement('figcaption'); fc.textContent = p.caption; fig.append(fc); }
    g.append(fig);
  });
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'); let cur = 0;
  function show(i) { cur = (i + photos.length) % photos.length; lbImg.src = photos[cur].src; lbImg.alt = photos[cur].caption || ''; lbCap.textContent = photos[cur].caption || ''; }
  function open(i) { show(i); lb.classList.add('open'); $('#lbClose').focus(); }
  function close() { lb.classList.remove('open'); }
  $('#lbClose').onclick = close; $('#lbPrev').onclick = () => show(cur - 1); $('#lbNext').onclick = () => show(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(cur - 1);
    if (e.key === 'ArrowRight') show(cur + 1);
  });

  /* ---- Versículos ---- */
  const vs = $('#verses');
  (c.verses || []).forEach(v => {
    const bq = document.createElement('blockquote'); bq.className = 'verse';
    const p = document.createElement('p'); p.textContent = v.text;
    const ci = document.createElement('cite'); ci.textContent = v.ref || '';
    bq.append(p, ci); vs.append(bq);
  });
  if (!(c.verses || []).length) $('#versiculos').hidden = true;

  /* ---- Mapa ---- */
  $('#mapFrame').src = mapEmbedURL(c.mapQuery, c.mapZoom);
  $('#mapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.mapQuery);
})();
