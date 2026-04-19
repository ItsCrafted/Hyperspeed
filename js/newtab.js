function tick() {
  const el = document.getElementById('nt-clock');
  if (!el) return;
  const now = new Date(), pad = n => String(n).padStart(2,'0');
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  el.textContent = `${days[now.getDay()]}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
tick();
setInterval(tick, 1000);

function nav(url) {
  try { window.parent.tabNavigate(window.parent.activeTabId, url); }
  catch(e) { window.top.location.href = url; }
}

const SUGGESTIONS = [
  { icon:'fa-solid fa-gamepad',   label:'hyperspeed://games',   hint:'Games library' },
  { icon:'fa-solid fa-film',      label:'hyperspeed://movies',  hint:'Stream movies' },
  { icon:'fa-solid fa-robot',     label:'hyperspeed://ai',      hint:'AI assistant' },
  { icon:'fa-solid fa-gear',      label:'hyperspeed://settings',hint:'Settings' },
  { icon:'fa-brands fa-google',   label:'google.com',           hint:'Google Search' },
  { icon:'fa-brands fa-youtube',  label:'youtube.com',          hint:'YouTube' },
  { icon:'fa-brands fa-github',   label:'github.com',           hint:'GitHub' },
  { icon:'fa-brands fa-reddit',   label:'reddit.com',           hint:'Reddit' },
  { icon:'fa-brands fa-wikipedia-w','label':'wikipedia.org',    hint:'Wikipedia' },
];

const search = document.getElementById('nt-search');
const sug = document.getElementById('nt-suggestions');

search.addEventListener('input', () => {
  const v = search.value.trim().toLowerCase();
  if (!v) { sug.classList.remove('open'); return; }
  const matches = SUGGESTIONS.filter(s => s.label.includes(v) || s.hint.toLowerCase().includes(v));
  if (!matches.length) { sug.classList.remove('open'); return; }
  sug.innerHTML = matches.map(s => `
    <div class="nt-sug-item" onclick="nav('${s.label}')">
      <i class="${s.icon}"></i>
      <span>${s.label}</span>
      <span class="nt-sug-hint">${s.hint}</span>
    </div>`).join('');
  sug.classList.add('open');
});

search.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = search.value.trim();
    if (val) { sug.classList.remove('open'); nav(val); }
  }
  if (e.key === 'Escape') sug.classList.remove('open');
});

search.addEventListener('blur', () => setTimeout(() => sug.classList.remove('open'), 150));
document.addEventListener('click', e => { if (!e.target.closest('.nt-search-wrap')) sug.classList.remove('open'); });