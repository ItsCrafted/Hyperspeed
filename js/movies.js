const TMDB_API_KEY = 'f53c43c1f2028398bcebdf4a5d1e28bd'; // I couldnt care less if you used this, but please just get your own, its free.
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

let allMovies = [], currentCategory = 'all', searchTimeout;
let isLoading = false, currentPage = 1, hasMoreMovies = true, isSearchMode = false;

const genreMap = { action:28,comedy:35,drama:18,horror:27,scifi:878,thriller:53,animation:16 };
const genreIdToCategory = { 28:'action',35:'comedy',18:'drama',27:'horror',878:'scifi',53:'thriller',16:'animation' };

const CATS = [
  {key:'all',label:'All'},{key:'action',label:'Action'},{key:'comedy',label:'Comedy'},
  {key:'drama',label:'Drama'},{key:'horror',label:'Horror'},{key:'scifi',label:'Sci-Fi'},
  {key:'thriller',label:'Thriller'},{key:'animation',label:'Animation'}
];

const tagsBar = document.getElementById('tags-bar');
CATS.forEach(c => {
  const t = document.createElement('button');
  t.className = 'tag' + (c.key==='all'?' active':'');
  t.textContent = c.label; t.dataset.category = c.key;
  t.addEventListener('click', async () => {
    document.querySelectorAll('.tag').forEach(b=>b.classList.remove('active'));
    t.classList.add('active');
    currentCategory = c.key;
    document.getElementById('game-search').value = '';
    isSearchMode = false;
    if (currentCategory==='all') await fetchTopMovies(); else await fetchCategoryMovies(currentCategory);
  });
  tagsBar.appendChild(t);
});

function showSkeletons(n=20) {
  const c = document.getElementById('games-container');
  c.innerHTML = '';
  for (let i=0;i<n;i++) { const s=document.createElement('div'); s.className='skeleton'; c.appendChild(s); }
}

function updateCount(n) {
  document.getElementById('count-badge').textContent = n>0 ? n+' films' : '';
}

function formatMovie(m) {
  return {
    id: m.id.toString(), name: m.title,
    category: getCategoryFromGenres(m.genre_ids),
    year: (m.release_date||'').substring(0,4)||'N/A',
    rating: m.vote_average ? m.vote_average.toFixed(1) : 'N/A',
    poster_path: m.poster_path, genre_ids: m.genre_ids
  };
}

function getCategoryFromGenres(ids) {
  if (!ids||!ids.length) return '';
  for (const id of ids) if (genreIdToCategory[id]) return genreIdToCategory[id];
  return '';
}

async function fetchTopMovies(append=false) {
  if (isLoading||(!hasMoreMovies&&append)) return;
  isLoading=true; updateLoadMoreButton();
  if (!append) { showSkeletons(); currentPage=1; allMovies=[]; hasMoreMovies=true; }
  const scrollY = window.scrollY;
  try {
    const start=append?currentPage:1, end=start+1;
    const pages = await Promise.all(
      Array.from({length:end-start+1},(_,i)=>fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${start+i}`).then(r=>r.json()))
    );
    const movies = pages.flatMap(d=>d.results||[]).map(formatMovie);
    if (!movies.length) { hasMoreMovies=false; }
    else {
      if (append) { allMovies=[...allMovies,...movies]; renderMovies(allMovies,true); window.scrollTo(0,scrollY); }
      else { allMovies=movies; renderMovies(allMovies); }
      currentPage=end+1;
    }
  } catch(e) {
    document.getElementById('games-container').innerHTML='<div style="grid-column:1/-1;color:var(--muted);text-align:center;padding:60px 20px;font-size:14px;">Could not load movies.</div>';
  } finally { isLoading=false; updateLoadMoreButton(); }
}

async function fetchCategoryMovies(category, append=false) {
  if (isLoading||(!hasMoreMovies&&append)) return;
  isLoading=true; updateLoadMoreButton();
  if (!append) { showSkeletons(); currentPage=1; hasMoreMovies=true; }
  const scrollY=window.scrollY;
  try {
    const gid=genreMap[category], start=append?currentPage:1, end=start+1;
    const pages = await Promise.all(
      Array.from({length:end-start+1},(_,i)=>fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${gid}&sort_by=popularity.desc&page=${start+i}`).then(r=>r.json()))
    );
    const movies = pages.flatMap(d=>d.results||[]).map(m=>({...formatMovie(m),category}));
    if (!movies.length) { hasMoreMovies=false; }
    else {
      if (append) { allMovies=[...allMovies,...movies]; renderMovies(allMovies,true); window.scrollTo(0,scrollY); }
      else { allMovies=movies; renderMovies(allMovies); }
      currentPage=end+1;
    }
  } catch(e) { console.error(e); }
  finally { isLoading=false; updateLoadMoreButton(); }
}

function renderMovies(movies, append=false) {
  const container=document.getElementById('games-container');
  const noResults=document.getElementById('no-results');
  if (!append) container.innerHTML='';
  if (!movies.length&&!append) { noResults.style.display='block'; updateCount(0); updateLoadMoreButton(); return; }
  noResults.style.display='none'; updateCount(movies.length);
  let delay=0;
  movies.forEach(movie => {
    if (append&&document.querySelector(`[data-id="${movie.id}"]`)) return;
    const poster=movie.poster_path?`${TMDB_IMAGE_BASE}${movie.poster_path}`:`https://via.placeholder.com/500x750/0d1018/333?text=${encodeURIComponent(movie.name||'?')}`;
    const card=document.createElement('div');
    card.className='game-box'; card.dataset.id=movie.id; card.dataset.category=movie.category||'';
    card.style.animationDelay=Math.min(delay*22,380)+'ms'; delay++;
    card.innerHTML=`
      <img src="${poster}" alt="${movie.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/500x750/0d1018/333?text=No+Image'"/>
      <div class="movie-rating"><i class="fas fa-star"></i>${movie.rating}</div>
      <div class="game-info">
        <div class="game-title">${movie.name}</div>
        <div class="movie-year">${movie.year}</div>
      </div>`;
    card.addEventListener('click',()=>openPlayer(movie));
    container.appendChild(card);
  });
  updateLoadMoreButton();
}

async function searchTMDB(query) {
  if (!query.trim()) {
    isSearchMode=false;
    if (currentCategory==='all') renderMovies(allMovies); else await fetchCategoryMovies(currentCategory);
    return;
  }
  isSearchMode=true; hasMoreMovies=false; updateLoadMoreButton(); showSkeletons(10);
  try {
    const r=await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
    const d=await r.json();
    renderMovies(d.results&&d.results.length?d.results.map(formatMovie):[]);
  } catch(e) { renderMovies([]); }
}

document.getElementById('game-search').addEventListener('input',e=>{
  clearTimeout(searchTimeout);
  searchTimeout=setTimeout(()=>searchTMDB(e.target.value),450);
});

function updateLoadMoreButton() {
  const btn=document.getElementById('load-more-btn');
  if (isSearchMode||!hasMoreMovies) { btn.style.display='none'; return; }
  btn.style.display='block'; btn.disabled=isLoading;
  btn.textContent=isLoading?'Loading…':'Load More Movies';
}

document.getElementById('load-more-btn').addEventListener('click',()=>{
  if (currentCategory==='all') fetchTopMovies(true); else fetchCategoryMovies(currentCategory,true);
});

function openPlayer(movie) {
  document.getElementById('player-title').textContent=movie.name+(movie.year?' · '+movie.year:'');
  document.getElementById('player-frame').src=`https://vidsrc.to/embed/movie/${movie.id}`;
  document.getElementById('player').classList.add('open');
  document.getElementById('player-backdrop').classList.add('open');
  document.body.style.overflow='hidden';
}
function closePlayer() {
  document.getElementById('player').classList.remove('open');
  document.getElementById('player-backdrop').classList.remove('open');
  document.getElementById('player-frame').src='';
  document.body.style.overflow='';
}
function toggleFullscreen() {
  const frame=document.getElementById('player-frame');
  const icon=document.getElementById('fs-icon');
  if (!document.fullscreenElement) { frame.requestFullscreen().catch(()=>{}); icon.className='fa-solid fa-compress'; }
  else { document.exitFullscreen(); icon.className='fa-solid fa-expand'; }
}
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closePlayer(); });

fetchTopMovies();