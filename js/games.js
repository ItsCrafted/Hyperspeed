const GAMES=[{"id":"10-minutes-till-dawn","name":"10 Minutes Till Dawn","tags":["Shooter","Roguelite","Survival"]},{"id":"2048-cupcakes","name":"2048 Cupcakes","tags":["Puzzle","Casual","Match"]},{"id":"9007199254740992","name":"9007199254740992","tags":["Puzzle","Challenge","Math"]},{"id":"99-balls","name":"99 Balls","tags":["Arcade","Casual","Breakout"]},{"id":"a-small-world-cup","name":"A Small World Cup","tags":["Sports","Physics","Funny"]},{"id":"achievement-unlocked","name":"Achievement Unlocked","tags":["Casual","Funny","Exploration"]},{"id":"animal-crossing-wild-world","name":"Animal Crossing: Wild World","tags":["Simulation","Casual","Social"]},{"id":"aqua-park-io","name":"Aqua Park.io","tags":["Racing","Multiplayer","Casual"]},{"id":"backrooms-2d","name":"Backrooms 2D","tags":["Horror","Exploration","Survival"]},{"id":"backrooms-3d","name":"Backrooms 3D","tags":["Horror","3D","Exploration"]},{"id":"bacon-may-die","name":"Bacon May Die","tags":["Action","Fighting","Arcade"]},{"id":"bad-icecream-2","name":"Bad Ice Cream 2","tags":["Puzzle","Multiplayer","Arcade"]},{"id":"bad-icecream-3","name":"Bad Ice Cream 3","tags":["Puzzle","Multiplayer","Arcade"]},{"id":"bad-icecream","name":"Bad Ice Cream","tags":["Puzzle","Multiplayer","Arcade"]},{"id":"bad-parenting","name":"Bad Parenting","tags":["Horror","Story","Psychological"]},{"id":"bad-piggies","name":"Bad Piggies","tags":["Puzzle","Physics","Building"]},{"id":"baldis-basics","name":"Baldi's Basics","tags":["Horror","Puzzle","Survival"]},{"id":"ball-maze","name":"Ball Maze","tags":["Puzzle","3D","Physics"]},{"id":"basket-random","name":"Basket Random","tags":["Sports","Multiplayer","Funny"]},{"id":"basketball-legends","name":"Basketball Legends","tags":["Sports","Multiplayer","Arcade"]},{"id":"basketball-stars","name":"Basketball Stars","tags":["Sports","Multiplayer","Competitive"]},{"id":"battle-karts","name":"Battle Karts","tags":["Racing","Multiplayer","Action"]},{"id":"big-flappy-tower-tiny-square","name":"Big Flappy Tower Tiny Square","tags":["Platformer","Challenge","Arcade"]},{"id":"big-ice-tower-tiny-square","name":"Big Ice Tower Tiny Square","tags":["Platformer","Challenge","Speed"]},{"id":"big-neon-tower-tiny-square","name":"Big Neon Tower Tiny Square","tags":["Platformer","Challenge","Neon"]},{"id":"big-tower-tiny-square-2","name":"Big Tower Tiny Square 2","tags":["Platformer","Challenge","Speed"]},{"id":"block-blast-2","name":"Block Blast 2","tags":["Puzzle","Casual","Strategy"]},{"id":"block-blast","name":"Block Blast","tags":["Puzzle","Casual","Strategy"]},{"id":"blood-money","name":"Blood Money","tags":["Action","Shooter","Upgrade"]},{"id":"bloxorz","name":"Bloxorz","tags":["Puzzle","3D","Strategy"]},{"id":"brawl-stars","name":"Brawl Stars","tags":["Multiplayer","Action","MOBA"]},{"id":"buckshot-roulette","name":"Buckshot Roulette","tags":["Horror","Strategy","Psychological"]},{"id":"burrito-bison-launch-alibre","name":"Burrito Bison Launcha Libre","tags":["Action","Upgrade","Casual"]},{"id":"celeste-2","name":"Celeste 2","tags":["Platformer","Challenge","Precision"]},{"id":"celeste","name":"Celeste","tags":["Platformer","Challenge","Story"]},{"id":"cluster-rush","name":"Cluster Rush","tags":["Parkour","3D","Speed"]},{"id":"cookie-clicker","name":"Cookie Clicker","tags":["Idle","Clicker","Strategy"]},{"id":"core-ball","name":"Core Ball","tags":["Puzzle","Timing","Arcade"]},{"id":"crazy-cars","name":"Crazy Cars","tags":["Racing","3D","Arcade"]},{"id":"crazy-cattle-3d","name":"Crazy Cattle 3D","tags":["3D","Casual","Strategy"]},{"id":"crossy-road","name":"Crossy Road","tags":["Arcade","Endless","Casual"]},{"id":"deltarune","name":"Deltarune","tags":["RPG","Story","Adventure"]},{"id":"drift-boss","name":"Drift Boss","tags":["Racing","Endless","Casual"]},{"id":"drive-mad","name":"Drive Mad","tags":["Racing","Physics","Challenge"]},{"id":"duck-life-2","name":"Duck Life 2","tags":["Simulation","Racing","Casual"]},{"id":"duck-life-3","name":"Duck Life 3","tags":["Simulation","Racing","Evolution"]},{"id":"duck-life","name":"Duck Life","tags":["Simulation","Racing","Casual"]},{"id":"eggy-car","name":"Eggy Car","tags":["Physics","Driving","Casual"]},{"id":"fire-boy-and-water-girl","name":"Fireboy and Watergirl","tags":["Puzzle","Co-op","Platformer"]},{"id":"flappy-bird","name":"Flappy Bird","tags":["Arcade","Endless","Challenge"]},{"id":"fnaf-2","name":"Five Nights at Freddy's 2","tags":["Horror","Survival","Strategy"]},{"id":"fnaf-3","name":"Five Nights at Freddy's 3","tags":["Horror","Survival","Strategy"]},{"id":"fnaf","name":"Five Nights at Freddy's","tags":["Horror","Survival","Strategy"]},{"id":"fnaw","name":"Five Nights at Winston's","tags":["Horror","Survival","Fan-made"]},{"id":"free-rider","name":"Free Rider","tags":["Physics","Creative","Racing"]},{"id":"funny-shooter-2","name":"Funny Shooter 2","tags":["Shooter","3D","Funny"]},{"id":"geometry-dash-3d","name":"Geometry Dash 3D","tags":["Platformer","Rhythm","3D"]},{"id":"granny","name":"Granny","tags":["Horror","Survival","Stealth"]},{"id":"grow-a-garden","name":"Grow a Garden","tags":["Simulation","Casual","Relaxing"]},{"id":"gta-2","name":"GTA 2","tags":["Action","Open-world","Classic"]},{"id":"happy-wheels","name":"Happy Wheels","tags":["Physics","Ragdoll","Challenge"]},{"id":"hextris","name":"Hextris","tags":["Puzzle","Arcade","Match"]},{"id":"1","name":"1","tags":["Puzzle","Strategy","Math"]},{"id":"learn-to-fly-2","name":"Learn to Fly 2","tags":["Upgrade","Physics","Casual"]},{"id":"learn-to-fly-3","name":"Learn to Fly 3","tags":["Upgrade","Physics","Strategy"]},{"id":"learn-to-fly","name":"Learn to Fly","tags":["Upgrade","Physics","Casual"]},{"id":"minecraft-1.5.2","name":"Minecraft 1.5.2","tags":["Sandbox","Building","Survival"]},{"id":"minecraft-indev","name":"Minecraft Indev","tags":["Sandbox","Classic","Retro"]},{"id":"minecraft-parkour","name":"Minecraft Parkour","tags":["Parkour","Challenge","Minecraft"]},{"id":"minecraft-tower-defence","name":"Minecraft Tower Defence","tags":["Tower Defense","Strategy","Minecraft"]},{"id":"minecraft-zeta-client","name":"Minecraft Zeta Client","tags":["Sandbox","Building","Modified"]},{"id":"motox3m-2","name":"Moto X3M 2","tags":["Racing","Stunts","Physics"]},{"id":"motox3m-3","name":"Moto X3M 3","tags":["Racing","Stunts","Physics"]},{"id":"motox3m-spookyland","name":"Moto X3M Spooky Land","tags":["Racing","Halloween","Stunts"]},{"id":"motox3m-winter","name":"Moto X3M Winter","tags":["Racing","Winter","Stunts"]},{"id":"motox3m","name":"Moto X3M","tags":["Racing","Stunts","Physics"]},{"id":"plants-vs-zombies","name":"Plants vs Zombies","tags":["Tower Defense","Strategy","Classic"]},{"id":"retro-bowl","name":"Retro Bowl","tags":["Sports","Management","Retro"]},{"id":"short-life","name":"Short Life","tags":["Platformer","Ragdoll","Challenge"]},{"id":"slither-io","name":"Slither.io","tags":["Multiplayer",".io","Arcade"]},{"id":"slope-3","name":"Slope 3","tags":["Endless","3D","Speed"]},{"id":"slow-roads","name":"Slow Roads","tags":["Driving","Relaxing","Endless"]},{"id":"snow-rider-3d","name":"Snow Rider 3D","tags":["Sports","3D","Endless"]},{"id":"soccer-random","name":"Soccer Random","tags":["Sports","Multiplayer","Funny"]},{"id":"subway-surfers","name":"Subway Surfers","tags":["Endless","Runner","Arcade"]},{"id":"super-hot","name":"SUPERHOT","tags":["Shooter","Puzzle","Innovative"]},{"id":"the-binding-of-isaac","name":"The Binding of Isaac","tags":["Roguelike","Dungeon Crawler","Dark"]},{"id":"the-legend-of-zelda-the-minish-cap","name":"The Legend of Zelda: The Minish Cap","tags":["Adventure","RPG","Classic"]},{"id":"the-worlds-hardest-game","name":"The World's Hardest Game","tags":["Puzzle","Challenge","Precision"]},{"id":"tiny-fishing","name":"Tiny Fishing","tags":["Casual","Fishing","Upgrade"]},{"id":"ultrakill","name":"ULTRAKILL","tags":["Shooter","FPS","Fast-paced"]},{"id":"vex-2","name":"Vex 2","tags":["Platformer","Challenge","Stickman"]},{"id":"vex-3","name":"Vex 3","tags":["Platformer","Challenge","Stickman"]},{"id":"vex-6","name":"Vex 6","tags":["Platformer","Challenge","Stickman"]},{"id":"vex-7","name":"Vex 7","tags":["Platformer","Challenge","Stickman"]},{"id":"vex-8","name":"Vex 8","tags":["Platformer","Challenge","Stickman"]},{"id":"vex","name":"Vex","tags":["Platformer","Challenge","Stickman"]},{"id":"volly-random","name":"Volley Random","tags":["Sports","Multiplayer","Funny"]},{"id":"word-wonders","name":"Word Wonders","tags":["Puzzle","Word","Casual"]},{"id":"wordle","name":"Wordle","tags":["Puzzle","Word","Daily"]},{"id":"yohoho-io","name":"YoHoHo.io","tags":["Multiplayer",".io","Battle Royale"]},{"id":"you-vs-100-skibidi-toilets","name":"You vs 100 Skibidi Toilets","tags":["Shooter","Meme","Survival"]},{"id":"zombocalypse-2","name":"Zombocalypse 2","tags":["Action","Zombies","Survival"]}];

const TAG_MAP = {
  'Action':     ['Action','Shooter','FPS','Fighting','Arcade'],
  'Puzzle':     ['Puzzle','Strategy','Word','Math','Timing'],
  'Horror':     ['Horror','Psychological','Dark'],
  'Racing':     ['Racing','Driving','Stunts','Sports'],
  'Platformer': ['Platformer','Parkour','Stickman'],
  'Multiplayer':['Multiplayer','.io','Co-op','MOBA','Battle Royale'],
  'Casual':     ['Casual','Idle','Clicker','Simulation','Relaxing','Fishing'],
  'Sandbox':    ['Sandbox','Building','Minecraft'],
};
const BUCKET_ORDER = ['Action','Puzzle','Horror','Racing','Platformer','Multiplayer','Casual','Sandbox'];

function gameBuckets(g) {
  const buckets = new Set();
  for (const [bucket, tagList] of Object.entries(TAG_MAP)) {
    if (g.tags.some(t => tagList.includes(t))) buckets.add(bucket);
  }
  return buckets;
}

let activeTag = null, searchQ = '';

const tagsBar = document.getElementById('tags-bar');
function makeTagBtn(label, tag) {
  const b = document.createElement('button');
  b.className = 'tag-btn' + (tag === null ? ' active' : '');
  b.textContent = label;
  if (tag) b.dataset.tag = tag;
  b.onclick = () => setTag(tag);
  tagsBar.appendChild(b);
}
makeTagBtn('All', null);
BUCKET_ORDER.forEach(t => makeTagBtn(t, t));

function setTag(tag) {
  activeTag = tag;
  document.querySelectorAll('.tag-btn').forEach(b =>
    b.classList.toggle('active', tag === null ? !b.dataset.tag : b.dataset.tag === tag)
  );
  render();
}

document.getElementById('search').addEventListener('input', e => {
  searchQ = e.target.value.trim().toLowerCase();
  render();
});

function render() {
  const grid = document.getElementById('grid');
  grid.querySelectorAll('.game-card').forEach(el => el.remove());
  const filtered = GAMES.filter(g => {
    const buckets = gameBuckets(g);
    const mt = !activeTag || buckets.has(activeTag);
    const ms = !searchQ || g.name.toLowerCase().includes(searchQ) || g.tags.some(t => t.toLowerCase().includes(searchQ));
    return mt && ms;
  });
  document.getElementById('count').textContent = filtered.length + ' games';
  document.getElementById('empty').classList.toggle('show', filtered.length === 0);
  filtered.forEach((g, i) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = Math.min(i * 14, 260) + 'ms';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';

    const img = document.createElement('img');
    img.className = 'card-thumb';
    img.src = '../img/games/' + g.id + '.png';
    img.alt = g.name;

    const placeholder = document.createElement('div');
    placeholder.className = 'card-thumb-placeholder';
    placeholder.style.display = 'none';
    placeholder.innerHTML = '<i class="fa-solid fa-gamepad"></i>';
    img.onerror = () => { img.style.display = 'none'; placeholder.style.display = 'flex'; };

    const playOverlay = document.createElement('div');
    playOverlay.className = 'card-play';
    playOverlay.innerHTML = '<i class="fa-solid fa-play"></i>';

    imgWrap.appendChild(img);
    imgWrap.appendChild(placeholder);
    imgWrap.appendChild(playOverlay);

    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `<div class="card-name">${g.name}</div><div class="card-tags">${g.tags.slice(0,2).map(t=>`<span class="card-tag">${t}</span>`).join('')}</div>`;

    card.appendChild(imgWrap);
    card.appendChild(info);
    card.addEventListener('click', () => openGame(g));
    grid.appendChild(card);
  });
}

function openGame(g) {
  document.getElementById('player-title').textContent = g.name;
  document.getElementById('player-frame').src = '../games/' + g.id + '.html';
  document.getElementById('player-backdrop').classList.add('open');
  document.getElementById('player').classList.add('open');
}

function closePlayer() {
  document.getElementById('player-backdrop').classList.remove('open');
  document.getElementById('player').classList.remove('open');
  if (document.fullscreenElement) document.exitFullscreen();
  setTimeout(() => { document.getElementById('player-frame').src = ''; }, 240);
  document.getElementById('fs-icon').className = 'fa-solid fa-expand';
}

function toggleFullscreen() {
  const frame = document.getElementById('player-frame');
  const icon = document.getElementById('fs-icon');
  if (!document.fullscreenElement) {
    (frame.requestFullscreen || frame.webkitRequestFullscreen).call(frame)
      .then(() => { icon.className = 'fa-solid fa-compress'; }).catch(() => {});
  } else {
    document.exitFullscreen().then(() => { icon.className = 'fa-solid fa-expand'; }).catch(() => {});
  }
}

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    document.getElementById('fs-icon').className = 'fa-solid fa-expand';
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });

render();