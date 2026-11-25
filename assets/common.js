/* Girassol em SVG (gerado, sem imagens externas) */
function sunflowerSVG() {
  let petals = '';
  for (let i = 0; i < 18; i++) petals += `<ellipse cx="100" cy="34" rx="12" ry="32" fill="#F5B000" transform="rotate(${i * 20} 100 100)"/>`;
  for (let i = 0; i < 18; i++) petals += `<ellipse cx="100" cy="39" rx="11" ry="29" fill="#FFD23F" transform="rotate(${i * 20 + 10} 100 100)"/>`;
  let seeds = '';
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let n = 1; n < 140; n++) {
    const r = 2.1 * Math.sqrt(n), a = n * golden;
    seeds += `<circle cx="${(100 + r * Math.cos(a)).toFixed(2)}" cy="${(100 + r * Math.sin(a)).toFixed(2)}" r="${(1 + n / 140).toFixed(2)}" fill="${n % 2 ? '#4A2A07' : '#A8691F'}"/>`;
  }
  return `<svg viewBox="0 0 200 200" aria-hidden="true">${petals}<circle cx="100" cy="100" r="31" fill="#7A4A12" stroke="#5A350B" stroke-width="2"/>${seeds}</svg>`;
}
function mountSunflowers() {
  document.querySelectorAll('.sf').forEach(el => { el.innerHTML = sunflowerSVG(); });
}

const DEFAULT_CONTENT = {
  title: 'F + I',
  subtitle: 'Cada segundo ao seu lado é um presente.',
  counterLabel: 'Juntos há',
  start: '2026-07-12T17:00:00-03:00',
  galleryTitle: 'Nossos momentos',
  photos: [],
  versesTitle: 'Palavras que guardo no coração',
  verses: [
    { text: 'Agora, pois, permanecem a fé, a esperança e o amor, estes três; porém o maior destes é o amor.', ref: '1 Coríntios 13:13' },
    { text: 'O cordão de três dobras não se rompe com facilidade.', ref: 'Eclesiastes 4:12' }
  ],
  mapTitle: 'Nosso lugar',
  mapText: 'Onde tudo ganhou cor.',
  mapQuery: 'Brasil',
  mapZoom: 4,
  footer: 'Feito com carinho, só pra você.'
};

/* Diferença de calendário entre duas datas (a <= b) */
function diffParts(a, b) {
  let y = b.getFullYear() - a.getFullYear(), mo = b.getMonth() - a.getMonth(), d = b.getDate() - a.getDate(),
      h = b.getHours() - a.getHours(), mi = b.getMinutes() - a.getMinutes(), s = b.getSeconds() - a.getSeconds();
  if (s < 0) { s += 60; mi--; }
  if (mi < 0) { mi += 60; h--; }
  if (h < 0) { h += 24; d--; }
  if (d < 0) { d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); mo--; }
  if (mo < 0) { mo += 12; y--; }
  return { y, mo, d, h, mi, s };
}

function mapEmbedURL(q, z) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${encodeURIComponent(z || 15)}&output=embed`;
}
