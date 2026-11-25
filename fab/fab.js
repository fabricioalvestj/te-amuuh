(function () {
  const $ = s => document.querySelector(s);
  const LS = 'fab-config';
  let cfg = null, content = null, sha = null, dirty = false, removed = [], saving = false;

  /* ---------- utilitários ---------- */
  const toB64 = str => { let s = ''; new TextEncoder().encode(str).forEach(b => s += String.fromCharCode(b)); return btoa(s); };
  const fromB64 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
  const blobB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  function status(msg, kind) { const s = $('#status'); s.textContent = msg || ''; s.className = 'status ' + (kind || ''); }
  function markDirty() { dirty = true; status('Alterações não salvas'); }

  async function gh(path, opts = {}) {
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path ? '/' + path : ''}`;
    const r = await fetch(url, {
      method: opts.method || 'GET',
      headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    });
    if (!r.ok) {
      let m = ''; try { m = (await r.json()).message; } catch (e) {}
      const err = new Error(m || ('Erro ' + r.status)); err.status = r.status; throw err;
    }
    return r.json();
  }

  /* ---------- entrada ---------- */
  function guess() {
    const owner = location.hostname.endsWith('github.io') ? location.hostname.split('.')[0] : '';
    const seg = location.pathname.split('/').filter(Boolean);
    const repo = owner ? (seg[0] && seg[0] !== 'fab' ? seg[0] : owner + '.github.io') : '';
    return { owner, repo };
  }
  const saved = JSON.parse(localStorage.getItem(LS) || 'null');
  const g = guess();
  $('#lgOwner').value = saved?.owner || g.owner;
  $('#lgRepo').value = saved?.repo || g.repo;
  $('#lgToken').value = saved?.token || '';
  mountSunflowers();

  async function connect() {
    const err = $('#lgErr'); err.hidden = true;
    cfg = { token: $('#lgToken').value.trim(), owner: $('#lgOwner').value.trim(), repo: $('#lgRepo').value.trim() };
    if (!cfg.token || !cfg.owner || !cfg.repo) { err.textContent = 'Preencha token, usuário e repositório.'; err.hidden = false; return; }
    $('#lgBtn').disabled = true; $('#lgBtn').textContent = 'Conectando…';
    try {
      const info = await gh('');
      if (info.permissions && !info.permissions.push) throw new Error('Este token não tem permissão de escrita no repositório. Crie outro com “Contents: Read and write”.');
      cfg.branch = info.default_branch;
      await loadContent();
      localStorage.setItem(LS, JSON.stringify({ token: cfg.token, owner: cfg.owner, repo: cfg.repo }));
      $('#login').hidden = true; $('#app').hidden = false;
      fillForm(); status('Conectado', 'ok');
    } catch (e) {
      err.textContent = e.status === 401 ? 'Token inválido ou expirado.' : e.status === 404 ? 'Repositório não encontrado. Confira usuário, nome e permissões do token.' : e.message;
      err.hidden = false;
    } finally { $('#lgBtn').disabled = false; $('#lgBtn').textContent = 'Entrar'; }
  }
  $('#lgBtn').onclick = connect;
  $('#lgToken').addEventListener('keydown', e => { if (e.key === 'Enter') connect(); });
  $('#logoutBtn').onclick = () => { if (dirty && !confirm('Há alterações não salvas. Sair mesmo assim?')) return; localStorage.removeItem(LS); dirty = false; location.reload(); };

  async function loadContent() {
    try {
      const f = await gh(`contents/data/content.json?ref=${encodeURIComponent(cfg.branch)}`);
      content = { ...structuredClone(DEFAULT_CONTENT), ...JSON.parse(fromB64(f.content)) };
      sha = f.sha;
    } catch (e) {
      if (e.status !== 404) throw e;
      content = structuredClone(DEFAULT_CONTENT); sha = null;
    }
    content.photos = content.photos || []; content.verses = content.verses || [];
  }

  /* ---------- formulário ---------- */
  function toLocalInput(iso) {
    const d = new Date(iso); if (isNaN(d)) return '';
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  let mapTimer;
  function updateMap() { clearTimeout(mapTimer); mapTimer = setTimeout(() => { $('#mapPrev').src = mapEmbedURL(content.mapQuery, content.mapZoom); }, 500); }

  function fillForm() {
    document.querySelectorAll('[data-k]').forEach(inp => {
      inp.value = content[inp.dataset.k] ?? '';
      inp.oninput = () => { content[inp.dataset.k] = inp.type === 'number' ? Number(inp.value) : inp.value; markDirty(); if (inp.dataset.k.startsWith('map')) updateMap(); };
    });
    $('#start').value = toLocalInput(content.start);
    $('#start').oninput = e => { const d = new Date(e.target.value); if (!isNaN(d)) { content.start = d.toISOString(); markDirty(); } };
    renderPhotos(); renderVerses(); $('#mapPrev').src = mapEmbedURL(content.mapQuery, content.mapZoom);
  }

  /* ---------- fotos ---------- */
  function renderPhotos() {
    const grid = $('#photoGrid'); grid.innerHTML = '';
    $('#photoEmpty').hidden = content.photos.length > 0;
    content.photos.forEach((p, i) => {
      const card = document.createElement('div'); card.className = 'ph';
      const th = document.createElement('div'); th.className = 'thumb';
      const img = document.createElement('img'); img.src = p._preview || ('../' + p.src); img.alt = ''; th.append(img);
      const cap = document.createElement('input'); cap.placeholder = 'Legenda (opcional)'; cap.value = p.caption || '';
      cap.oninput = () => { p.caption = cap.value; markDirty(); };
      const acts = document.createElement('div'); acts.className = 'acts';
      const mk = (txt, title, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ' + (cls || 'ghost'); b.textContent = txt; b.title = title; b.onclick = fn; return b; };
      acts.append(
        mk('◀', 'Mover para antes', () => move(i, -1)),
        mk('▶', 'Mover para depois', () => move(i, 1)),
        mk('Remover', 'Remover foto', () => remove(i), 'danger')
      );
      card.append(th, cap, acts);
      if (p._file) { const n = document.createElement('div'); n.className = 'new'; n.textContent = 'Nova — será enviada ao salvar'; card.append(n); }
      grid.append(card);
    });
  }
  function move(i, d) { const j = i + d; if (j < 0 || j >= content.photos.length) return; [content.photos[i], content.photos[j]] = [content.photos[j], content.photos[i]]; renderPhotos(); markDirty(); }
  function remove(i) {
    if (!confirm('Remover esta foto?')) return;
    const [p] = content.photos.splice(i, 1);
    if (p.src) removed.push(p.src);
    renderPhotos(); markDirty();
  }

  /* Reduz só o tamanho do arquivo (lado maior 1800px); a proporção original é mantida. */
  async function prepare(file) {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(bmp, 0, 0, w, h); bmp.close();
    const blob = await new Promise(res => cv.toBlob(res, 'image/jpeg', 0.86));
    return { src: null, w, h, caption: '', _file: blob, _preview: URL.createObjectURL(blob) };
  }
  $('#fileInput').onchange = async e => {
    const files = [...e.target.files]; e.target.value = '';
    for (const f of files) {
      try { status(`Preparando ${f.name}…`); content.photos.push(await prepare(f)); }
      catch (err) { status(`Não consegui abrir ${f.name}. Use JPG, PNG ou WebP.`, 'bad'); }
    }
    renderPhotos(); markDirty();
  };

  /* ---------- versículos ---------- */
  function renderVerses() {
    const box = $('#verseList'); box.innerHTML = '';
    content.verses.forEach((v, i) => {
      const w = document.createElement('div'); w.className = 'verse-edit';
      w.innerHTML = '<label>Versículo<textarea></textarea></label><label>Referência<input placeholder="João 3:16"></label><div class="acts" style="display:flex;gap:8px"></div>';
      const ta = w.querySelector('textarea'), ref = w.querySelector('input'), acts = w.querySelector('.acts');
      ta.value = v.text || ''; ref.value = v.ref || '';
      ta.oninput = () => { v.text = ta.value; markDirty(); }; ref.oninput = () => { v.ref = ref.value; markDirty(); };
      const mk = (t, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small ' + (cls || 'ghost'); b.textContent = t; b.onclick = fn; acts.append(b); };
      mk('Subir', () => { if (i > 0) { [content.verses[i - 1], content.verses[i]] = [content.verses[i], content.verses[i - 1]]; renderVerses(); markDirty(); } });
      mk('Descer', () => { if (i < content.verses.length - 1) { [content.verses[i + 1], content.verses[i]] = [content.verses[i], content.verses[i + 1]]; renderVerses(); markDirty(); } });
      mk('Remover', () => { content.verses.splice(i, 1); renderVerses(); markDirty(); }, 'danger');
      box.append(w);
    });
  }
  $('#addVerse').onclick = () => { content.verses.push({ text: '', ref: '' }); renderVerses(); markDirty(); };

  /* ---------- salvar ---------- */
  $('#saveBtn').onclick = async () => {
    if (saving) return; saving = true; $('#saveBtn').disabled = true;
    try {
      const news = content.photos.filter(p => p._file);
      let n = 0;
      for (const p of news) {
        n++; status(`Enviando foto ${n} de ${news.length}…`);
        const name = `images/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        await gh(`contents/${name}`, { method: 'PUT', body: { message: 'fab: nova foto', content: await blobB64(p._file), branch: cfg.branch } });
        p.src = name; delete p._file;
      }
      status('Salvando conteúdo…');
      const body = { message: 'fab: atualiza conteúdo', content: toB64(JSON.stringify(content, (k, v) => k.startsWith('_') ? undefined : v, 2)), branch: cfg.branch };
      if (sha) body.sha = sha;
      const res = await gh('contents/data/content.json', { method: 'PUT', body });
      sha = res.content.sha;
      for (const src of removed.splice(0)) {
        try { const f = await gh(`contents/${src}?ref=${encodeURIComponent(cfg.branch)}`); await gh(`contents/${src}`, { method: 'DELETE', body: { message: 'fab: remove foto', sha: f.sha, branch: cfg.branch } }); } catch (e) {}
      }
      dirty = false; renderPhotos();
      status('Salvo! O site atualiza em cerca de 1 minuto.', 'ok');
    } catch (e) {
      status(e.status === 409 || e.status === 422 ? 'Conflito: o conteúdo mudou no GitHub. Recarregue a página e tente de novo.' : 'Erro ao salvar: ' + e.message, 'bad');
    } finally { saving = false; $('#saveBtn').disabled = false; }
  };

  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  if (saved && saved.token) connect();
})();
