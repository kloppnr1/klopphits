// KloppHits - brugerflade og skaermlogik.
// Al navigation foregaar med controller (se gamepad.js).

/* global Input */

const api = window.api;

// ---------------------------------------------------------------------------
// Ikoner (rene stregikoner, farves med currentColor)
// ---------------------------------------------------------------------------

const STROKE = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  photos: `<svg viewBox="0 0 24 24" ${STROKE}><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 4.5-4.5L21 16"/></svg>`,
  videos: `<svg viewBox="0 0 24 24" ${STROKE}><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21M6.5 5v14M17.5 5v14"/><path d="M10.6 9.8v4.4l3.8-2.2z" fill="currentColor" stroke="none"/></svg>`,
  steam: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M6.8 7.5h10.4a4.8 4.8 0 0 1 4.77 5.3c-.2 1.9-1.7 3.7-3.67 3.7-1.11 0-2.16-.53-2.83-1.42L14.3 13.6H9.7l-1.17 1.48c-.67.89-1.72 1.42-2.83 1.42-1.97 0-3.47-1.8-3.67-3.7A4.8 4.8 0 0 1 6.8 7.5z"/><path d="M8.2 10.4v3M6.7 11.9h3"/><circle cx="15.3" cy="11" r="0.9" fill="currentColor" stroke="none"/><circle cx="17.6" cy="12.9" r="0.9" fill="currentColor" stroke="none"/></svg>`,
  retro: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4h2v2H5zM17 4h2v2h-2zM7 6h2v2H7zM15 6h2v2h-2zM5 8h14v2H5zM3 10h4v2H3zM9 10h6v2H9zM17 10h4v2h-4zM1 12h22v2H1zM1 14h2v2H1zM5 14h14v2H5zM21 14h2v2h-2zM1 16h2v2H1zM5 16h2v2H5zM17 16h2v2h-2zM21 16h2v2h-2zM7 18h4v2H7zM13 18h4v2h-4z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" ${STROKE}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .33 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.6 1.6 0 0 0 15 19.4a1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.09A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.77.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.09A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.33-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.09a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.26.6.86 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.65 0-1.25.4-1.51 1z"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
  up: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  power: `<svg viewBox="0 0 24 24" ${STROKE}><path d="M12 3v8"/><path d="M6.3 6.5a8 8 0 1 0 11.4 0"/></svg>`
};

function icon(name) {
  const wrap = el('span', 'icon-wrap');
  wrap.innerHTML = ICONS[name];
  return wrap;
}

// ---------------------------------------------------------------------------
// Smaa hjaelpere
// ---------------------------------------------------------------------------

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return (h > 0 ? h + ':' : '') + mm + ':' + String(s).padStart(2, '0');
}

let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}

function setHints(hints) {
  const bar = document.getElementById('hints');
  bar.innerHTML = '';
  for (const [btn, label] of hints) {
    const h = el('div', 'hint');
    const b = el('span', 'btn btn-' + btn.toLowerCase(), btn);
    h.appendChild(b);
    h.appendChild(el('span', null, label));
    bar.appendChild(h);
  }
}

// ---------------------------------------------------------------------------
// Levende baggrund paa hjemmeskaermen (dine egne billeder, nedtonet)
// ---------------------------------------------------------------------------

const Ambient = (() => {
  const root = document.getElementById('ambient');
  const layers = [el('div', 'amb-layer'), el('div', 'amb-layer')];
  layers.forEach((l) => root.appendChild(l));

  let photos = [];
  let active = 0;
  let timer = null;
  let lastScan = 0;

  function next() {
    if (!photos.length) return;
    const pick = photos[Math.floor(Math.random() * photos.length)];
    active = 1 - active;
    layers[active].style.backgroundImage = `url("${pick.fileUrl}")`;
    layers[active].classList.add('visible');
    layers[1 - active].classList.remove('visible');
  }

  async function refresh() {
    if (Date.now() - lastScan < 60000) return;
    lastScan = Date.now();
    const result = await api.listMedia('photos');
    photos = result.items || [];
    if (photos.length && !timer) {
      next();
      timer = setInterval(next, 25000);
    } else if (!photos.length && timer) {
      clearInterval(timer);
      timer = null;
      layers.forEach((l) => l.classList.remove('visible'));
    }
  }

  return { refresh };
})();

// ---------------------------------------------------------------------------
// Fokus-gitter: haandterer markering og bevaegelse i et grid/liste
// ---------------------------------------------------------------------------

class Grid {
  constructor(cols) {
    this.cols = cols;
    this.items = [];
    this.index = 0;
  }

  setItems(elements) {
    this.items = elements;
    this.index = Math.min(this.index, Math.max(0, elements.length - 1));
    this.applyFocus(false);
  }

  applyFocus(scroll = true) {
    this.items.forEach((item, i) => {
      item.classList.toggle('focused', i === this.index);
    });
    const cur = this.items[this.index];
    if (cur && scroll) {
      cur.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  move(dir) {
    if (!this.items.length) return false;
    let i = this.index;
    if (dir === 'left') i -= 1;
    else if (dir === 'right') i += 1;
    else if (dir === 'up') i -= this.cols;
    else if (dir === 'down') i += this.cols;
    else return false;

    if (dir === 'down' && i >= this.items.length) {
      // Hop til sidste element hvis vi ikke allerede staar paa nederste raekke
      const lastRowStart = Math.floor((this.items.length - 1) / this.cols) * this.cols;
      if (this.index < lastRowStart) i = this.items.length - 1;
      else return false;
    }
    if (i < 0 || i >= this.items.length) return false;
    if (i === this.index) return false;
    this.index = i;
    this.applyFocus();
    return true;
  }

  get current() {
    return this.items[this.index] || null;
  }
}

// ---------------------------------------------------------------------------
// Skaerm-haandtering (stak: kun oeverste skaerm er synlig og modtager input)
// ---------------------------------------------------------------------------

const Screens = {
  stack: [],

  push(screen, params) {
    const prev = this.top();
    if (prev) {
      if (prev.pause) prev.pause();
      prev.el.classList.remove('active');
    }
    this.stack.push(screen);
    screen.el.classList.add('active');
    if (screen.enter) screen.enter(params);
    this.refresh();
  },

  pop() {
    const screen = this.stack.pop();
    if (screen) {
      if (screen.leave) screen.leave();
      screen.el.classList.remove('active');
    }
    const top = this.top();
    if (top) {
      top.el.classList.add('active');
      if (top.resume) top.resume();
    }
    this.refresh();
  },

  top() {
    return this.stack[this.stack.length - 1] || null;
  },

  refresh() {
    const top = this.top();
    setHints(top && top.hints ? top.hints() : []);
    document.body.classList.toggle('on-home', top === homeScreen);
  },

  handle(action) {
    const top = this.top();
    if (top && top.onInput) top.onInput(action);
  }
};

function makeScreen(id, build) {
  const container = document.getElementById('screens');
  const elScreen = el('section', 'screen');
  elScreen.id = 'screen-' + id;
  container.appendChild(elScreen);
  const screen = { el: elScreen };
  build(screen, elScreen);
  return screen;
}

// ---------------------------------------------------------------------------
// Hjem
// ---------------------------------------------------------------------------

const MENU = [
  { id: 'photos', icon: 'photos', label: 'Billeder', sub: 'Dine private billeder' },
  { id: 'videos', icon: 'videos', label: 'Videoklip', sub: 'Dine private videoer' },
  { id: 'steam', icon: 'steam', label: 'Steam', sub: 'Installerede Steam-spil' },
  { id: 'retro', icon: 'retro', label: 'Retro spil', sub: 'Online retro-klassikere' },
  { id: 'settings', icon: 'settings', label: 'Indstillinger', sub: 'Mapper og program' }
];

const homeScreen = makeScreen('home', (screen, root) => {
  root.appendChild(el('h2', 'screen-title', 'Hvad skal vi i dag?'));
  const area = el('div', 'scroll-area');
  const grid = el('div', 'grid');
  grid.style.gridTemplateColumns = `repeat(${MENU.length}, 1fr)`;
  area.appendChild(grid);
  root.appendChild(area);

  const focus = new Grid(MENU.length);
  const tiles = MENU.map((m) => {
    const tile = el('div', 'tile menu-tile');
    tile.dataset.target = m.id;
    tile.appendChild(icon(m.icon));
    tile.appendChild(el('div', 'label', m.label));
    tile.appendChild(el('div', 'sub', m.sub));
    grid.appendChild(tile);
    return tile;
  });
  focus.setItems(tiles);

  screen.enter = () => {
    focus.applyFocus();
    Ambient.refresh();
  };
  screen.resume = () => Ambient.refresh();
  screen.hints = () => [
    ['A', 'Vælg'],
    ['✚', 'Navigér']
  ];
  screen.onInput = (action) => {
    if (['up', 'down', 'left', 'right'].includes(action)) {
      // Enkelt raekke: op/ned mappes til venstre/hoejre
      focus.move(action === 'up' ? 'left' : action === 'down' ? 'right' : action);
    } else if (action === 'a') {
      const target = focus.current && focus.current.dataset.target;
      if (target === 'photos') Screens.push(photosScreen);
      else if (target === 'videos') Screens.push(videosScreen);
      else if (target === 'steam') Screens.push(steamScreen);
      else if (target === 'retro') Screens.push(retroScreen);
      else if (target === 'settings') Screens.push(settingsScreen);
    }
  };
});

// ---------------------------------------------------------------------------
// Medie-galleri (faelles for billeder og videoklip)
// ---------------------------------------------------------------------------

function makeGalleryScreen({ id, title, kind, cols, makeTile, onSelect, emptyMsg }) {
  return makeScreen(id, (screen, root) => {
    root.appendChild(el('h2', 'screen-title', title));
    const subtitle = el('p', 'screen-subtitle', '');
    root.appendChild(subtitle);
    const area = el('div', 'scroll-area');
    root.appendChild(area);

    const focus = new Grid(cols);
    let items = [];

    screen.enter = async () => {
      area.innerHTML = '';
      subtitle.textContent = 'Indlæser…';
      const result = await api.listMedia(kind);
      items = result.items;

      if (!result.dir) {
        subtitle.textContent = '';
        const empty = el('div', 'empty-state');
        empty.appendChild(icon('folder'));
        empty.appendChild(el('div', 'msg', emptyMsg + ' Tryk A for at vælge en mappe i Indstillinger.'));
        area.appendChild(empty);
        focus.setItems([]);
        return;
      }

      subtitle.textContent = `${items.length} filer · ${result.dir}`;
      if (!items.length) {
        const empty = el('div', 'empty-state');
        empty.appendChild(icon('folder'));
        empty.appendChild(el('div', 'msg', 'Mappen er tom. Læg filer i ' + result.dir));
        area.appendChild(empty);
        focus.setItems([]);
        return;
      }

      const grid = el('div', 'grid');
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      area.appendChild(grid);
      const tiles = items.map((item, i) => {
        const tile = makeTile(item);
        tile.dataset.index = i;
        grid.appendChild(tile);
        return tile;
      });
      focus.index = 0;
      focus.setItems(tiles);
      focus.applyFocus();
    };

    screen.hints = () => [
      ['A', 'Åbn'],
      ['B', 'Tilbage'],
      ['✚', 'Navigér']
    ];

    screen.onInput = (action) => {
      if (['up', 'down', 'left', 'right'].includes(action)) {
        focus.move(action);
      } else if (action === 'a') {
        if (!focus.items.length) {
          Screens.push(settingsScreen);
          return;
        }
        const i = Number(focus.current.dataset.index);
        onSelect(items, i);
      } else if (action === 'b') {
        Screens.pop();
      }
    };
  });
}

const photosScreen = makeGalleryScreen({
  id: 'photos',
  title: 'Billeder',
  kind: 'photos',
  cols: 5,
  emptyMsg: 'Der er ikke valgt en billedmappe endnu.',
  makeTile(item) {
    const tile = el('div', 'tile media-tile');
    const img = el('img');
    img.loading = 'lazy';
    img.src = item.fileUrl;
    tile.appendChild(img);
    tile.appendChild(el('div', 'caption', item.name));
    return tile;
  },
  onSelect(items, index) {
    Screens.push(photoViewer, { items, index });
  }
});

const videosScreen = makeGalleryScreen({
  id: 'videos',
  title: 'Videoklip',
  kind: 'videos',
  cols: 4,
  emptyMsg: 'Der er ikke valgt en videomappe endnu.',
  makeTile(item) {
    const tile = el('div', 'tile media-tile');
    const vid = el('video');
    vid.preload = 'metadata';
    vid.muted = true;
    vid.src = item.fileUrl + '#t=1';
    tile.appendChild(vid);
    tile.appendChild(el('div', 'caption', item.name));
    return tile;
  },
  onSelect(items, index) {
    Screens.push(videoPlayer, { items, index });
  }
});

// ---------------------------------------------------------------------------
// Billedviser (fuld skaerm + diasshow)
// ---------------------------------------------------------------------------

const photoViewer = (() => {
  const root = el('div');
  root.id = 'viewer';
  document.body.appendChild(root);
  const img = el('img');
  const info = el('div', 'viewer-info');
  root.appendChild(img);
  root.appendChild(info);

  let items = [];
  let index = 0;
  let slideTimer = null;

  function show() {
    const item = items[index];
    if (!item) return;
    img.src = item.fileUrl;
    info.textContent = `${index + 1} / ${items.length} · ${item.name}` + (slideTimer ? ' · Diasshow' : '');
  }

  function step(delta) {
    index = (index + delta + items.length) % items.length;
    show();
  }

  function stopSlideshow() {
    clearInterval(slideTimer);
    slideTimer = null;
  }

  const screen = { el: root };
  screen.enter = (params) => {
    items = params.items;
    index = params.index;
    stopSlideshow();
    show();
  };
  screen.leave = () => {
    stopSlideshow();
    img.src = '';
  };
  screen.hints = () => [
    ['A', 'Diasshow til/fra'],
    ['B', 'Tilbage'],
    ['✚', 'Forrige / Næste']
  ];
  screen.onInput = (action) => {
    if (action === 'left' || action === 'lb') step(-1);
    else if (action === 'right' || action === 'rb') step(1);
    else if (action === 'a') {
      if (slideTimer) {
        stopSlideshow();
        toast('Diasshow stoppet');
      } else {
        slideTimer = setInterval(() => step(1), 6000);
        toast('Diasshow startet');
      }
      show();
    } else if (action === 'b') {
      Screens.pop();
    }
  };
  return screen;
})();

// ---------------------------------------------------------------------------
// Videoafspiller
// ---------------------------------------------------------------------------

const videoPlayer = (() => {
  const root = el('div');
  root.id = 'player';
  document.body.appendChild(root);
  const video = el('video');
  root.appendChild(video);

  const osd = el('div', 'player-osd');
  const osdTitle = el('div', 'osd-title');
  const osdBar = el('div', 'osd-bar');
  const osdProgress = el('div', 'osd-progress');
  const osdTime = el('div', 'osd-time');
  osdBar.appendChild(osdProgress);
  osd.appendChild(osdTitle);
  osd.appendChild(osdBar);
  osd.appendChild(osdTime);
  root.appendChild(osd);

  let items = [];
  let index = 0;
  let osdTimer = null;
  let tickTimer = null;

  function showOsd() {
    osd.classList.remove('hidden-osd');
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => {
      if (!video.paused) osd.classList.add('hidden-osd');
    }, 3000);
  }

  function updateOsd() {
    const dur = video.duration || 0;
    const cur = video.currentTime || 0;
    osdProgress.style.width = dur ? (cur / dur) * 100 + '%' : '0%';
    osdTime.textContent = `${formatTime(cur)} / ${formatTime(dur)}  ·  Lyd ${Math.round(video.volume * 100)} %`;
  }

  function load(i) {
    index = (i + items.length) % items.length;
    const item = items[index];
    osdTitle.textContent = `${index + 1} / ${items.length} · ${item.name}`;
    video.src = item.fileUrl;
    video.play().catch(() => toast('Kan ikke afspille: ' + item.name));
    showOsd();
  }

  video.addEventListener('ended', () => load(index + 1));
  video.addEventListener('error', () => {
    toast('Formatet understøttes ikke: ' + (items[index] ? items[index].name : ''));
  });

  const screen = { el: root };
  screen.enter = (params) => {
    items = params.items;
    load(params.index);
    tickTimer = setInterval(updateOsd, 250);
  };
  screen.leave = () => {
    clearInterval(tickTimer);
    clearTimeout(osdTimer);
    video.pause();
    video.removeAttribute('src');
    video.load();
  };
  screen.hints = () => [
    ['A', 'Pause / Afspil'],
    ['B', 'Tilbage'],
    ['✚', '±10 sek. / Lydstyrke'],
    ['X', 'Forrige klip'],
    ['Y', 'Næste klip']
  ];
  screen.onInput = (action) => {
    if (action === 'a') {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
      showOsd();
    } else if (action === 'left') {
      video.currentTime = Math.max(0, video.currentTime - 10);
      showOsd();
    } else if (action === 'right') {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
      showOsd();
    } else if (action === 'up') {
      video.volume = Math.min(1, video.volume + 0.1);
      showOsd();
    } else if (action === 'down') {
      video.volume = Math.max(0, video.volume - 0.1);
      showOsd();
    } else if (action === 'x' || action === 'lb') {
      load(index - 1);
    } else if (action === 'y' || action === 'rb') {
      load(index + 1);
    } else if (action === 'b') {
      Screens.pop();
    }
  };
  return screen;
})();

// ---------------------------------------------------------------------------
// Steam
// ---------------------------------------------------------------------------

const steamScreen = makeScreen('steam', (screen, root) => {
  root.appendChild(el('h2', 'screen-title', 'Steam'));
  const subtitle = el('p', 'screen-subtitle', '');
  root.appendChild(subtitle);
  const area = el('div', 'scroll-area');
  root.appendChild(area);

  const COLS = 5;
  const focus = new Grid(COLS);
  let games = [];

  function coverUrl(game) {
    return (
      game.localCover ||
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`
    );
  }

  screen.enter = async () => {
    area.innerHTML = '';
    subtitle.textContent = 'Scanner Steam-bibliotek…';
    const result = await api.steamList();
    games = result.games;

    if (!result.found) {
      subtitle.textContent = '';
      const empty = el('div', 'empty-state');
      empty.appendChild(icon('steam'));
      empty.appendChild(el('div', 'msg', 'Steam blev ikke fundet på denne maskine. Installér Steam for at se dine spil her.'));
      area.appendChild(empty);
      focus.setItems([]);
      return;
    }

    subtitle.textContent = `${games.length} installerede spil`;
    if (!games.length) {
      const empty = el('div', 'empty-state');
      empty.appendChild(icon('steam'));
      empty.appendChild(el('div', 'msg', 'Ingen installerede spil fundet i Steam-biblioteket.'));
      area.appendChild(empty);
      focus.setItems([]);
      return;
    }

    const grid = el('div', 'grid');
    grid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    area.appendChild(grid);
    const tiles = games.map((game, i) => {
      const tile = el('div', 'tile steam-tile');
      tile.dataset.index = i;

      const fallback = el('div', 'fallback');
      fallback.appendChild(el('div', 'big-letter', game.name.charAt(0).toUpperCase()));
      fallback.appendChild(el('div', 'name', game.name));
      tile.appendChild(fallback);

      const img = el('img');
      img.loading = 'lazy';
      img.src = coverUrl(game);
      img.addEventListener('error', () => img.remove());
      tile.appendChild(img);

      grid.appendChild(tile);
      return tile;
    });
    focus.index = 0;
    focus.setItems(tiles);
    focus.applyFocus();
  };

  screen.hints = () => [
    ['A', 'Start spil'],
    ['B', 'Tilbage'],
    ['Y', 'Steam Big Picture'],
    ['✚', 'Navigér']
  ];

  screen.onInput = (action) => {
    if (['up', 'down', 'left', 'right'].includes(action)) {
      focus.move(action);
    } else if (action === 'a' && focus.items.length) {
      const game = games[Number(focus.current.dataset.index)];
      api.steamLaunch(game.appid);
      toast('Starter ' + game.name + '…');
    } else if (action === 'y') {
      api.openBigPicture();
      toast('Åbner Steam Big Picture…');
    } else if (action === 'b') {
      Screens.pop();
    }
  };
});

// ---------------------------------------------------------------------------
// Retro-spil (online)
// ---------------------------------------------------------------------------

const retroScreen = makeScreen('retro', (screen, root) => {
  root.appendChild(el('h2', 'screen-title', 'Retro spil'));
  root.appendChild(
    el('p', 'screen-subtitle', 'Online retro-spil i fuld skærm. Hold SELECT + START på controlleren for at vende tilbage.')
  );
  const area = el('div', 'scroll-area');
  root.appendChild(area);

  const COLS = 2;
  const focus = new Grid(COLS);
  let sites = [];

  screen.enter = async () => {
    area.innerHTML = '';
    const cfg = await api.getConfig();
    sites = cfg.retroSites || [];

    const grid = el('div', 'grid');
    grid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    area.appendChild(grid);
    const tiles = sites.map((site, i) => {
      const tile = el('div', 'tile retro-tile');
      tile.dataset.index = i;
      const name = el('div', 'name');
      name.appendChild(icon('retro'));
      name.appendChild(el('span', null, site.name));
      tile.appendChild(name);
      tile.appendChild(el('div', 'desc', site.description || ''));
      tile.appendChild(el('div', 'url', site.url));
      grid.appendChild(tile);
      return tile;
    });
    focus.index = 0;
    focus.setItems(tiles);
    focus.applyFocus();
  };

  screen.hints = () => [
    ['A', 'Åbn'],
    ['B', 'Tilbage'],
    ['✚', 'Navigér']
  ];

  screen.onInput = (action) => {
    if (['up', 'down', 'left', 'right'].includes(action)) {
      focus.move(action);
    } else if (action === 'a' && focus.items.length) {
      const site = sites[Number(focus.current.dataset.index)];
      api.retroOpen(site.url);
      toast('Åbner ' + site.name + '…');
    } else if (action === 'b') {
      Screens.pop();
    }
  };
});

// ---------------------------------------------------------------------------
// Mappevaelger (bruges af Indstillinger)
// ---------------------------------------------------------------------------

const folderPicker = makeScreen('folder-picker', (screen, root) => {
  root.appendChild(el('h2', 'screen-title', 'Vælg mappe'));
  const pathLabel = el('p', 'screen-subtitle', '');
  root.appendChild(pathLabel);
  const area = el('div', 'scroll-area');
  root.appendChild(area);

  const focus = new Grid(1);
  let current = null;
  let parent = null;
  let onPick = null;

  function makeRow(iconName, label, dir) {
    const row = el('div', 'row-item');
    if (dir) row.dataset.dir = dir;
    const lab = el('div', 'row-label');
    lab.appendChild(icon(iconName));
    lab.appendChild(el('span', null, label));
    row.appendChild(lab);
    return row;
  }

  async function browse(dirPath) {
    const result = await api.listDirs(dirPath);
    current = result.path;
    parent = result.parent;
    pathLabel.textContent = current;

    area.innerHTML = '';
    const rows = el('div', 'rows');
    area.appendChild(rows);

    const items = [];
    if (parent) {
      const up = makeRow('up', 'Op til overmappe', '..');
      rows.appendChild(up);
      items.push(up);
    }
    for (const name of result.dirs) {
      const row = makeRow('folder', name, name);
      rows.appendChild(row);
      items.push(row);
    }
    if (!items.length) {
      const msg = el('div', 'row-item');
      msg.appendChild(el('div', 'row-value', 'Ingen undermapper'));
      rows.appendChild(msg);
    }
    focus.index = 0;
    focus.setItems(items);
    focus.applyFocus();
  }

  screen.enter = (params) => {
    onPick = params.onPick;
    browse(params.startPath || null);
  };
  screen.hints = () => [
    ['A', 'Åbn mappe'],
    ['X', 'Vælg denne mappe'],
    ['B', 'Annullér'],
    ['✚', 'Navigér']
  ];
  screen.onInput = (action) => {
    if (action === 'up' || action === 'down') {
      focus.move(action);
    } else if (action === 'a' && focus.current) {
      const dir = focus.current.dataset.dir;
      if (dir === '..') browse(parent);
      else if (dir) browse(current + (current.endsWith('/') || current.endsWith('\\') ? '' : '/') + dir);
    } else if (action === 'x') {
      const cb = onPick;
      Screens.pop();
      if (cb) cb(current);
    } else if (action === 'b') {
      Screens.pop();
    }
  };
});

// ---------------------------------------------------------------------------
// Indstillinger
// ---------------------------------------------------------------------------

const settingsScreen = makeScreen('settings', (screen, root) => {
  root.appendChild(el('h2', 'screen-title', 'Indstillinger'));
  root.appendChild(el('p', 'screen-subtitle', 'Vælg hvor dine billeder og videoklip ligger.'));
  const area = el('div', 'scroll-area');
  root.appendChild(area);

  const focus = new Grid(1);
  let cfg = null;

  async function render() {
    cfg = await api.getConfig();
    area.innerHTML = '';
    const rows = el('div', 'rows');
    area.appendChild(rows);

    const defs = [
      { id: 'photosDir', icon: 'photos', label: 'Billedmappe', value: cfg.photosDir || 'Ikke valgt' },
      { id: 'videosDir', icon: 'videos', label: 'Videomappe', value: cfg.videosDir || 'Ikke valgt' },
      { id: 'quit', icon: 'power', label: 'Afslut KloppHits', value: '', danger: true }
    ];

    const items = defs.map((d) => {
      const row = el('div', 'row-item' + (d.danger ? ' danger' : ''));
      row.dataset.id = d.id;
      const lab = el('div', 'row-label');
      lab.appendChild(icon(d.icon));
      lab.appendChild(el('span', null, d.label));
      row.appendChild(lab);
      row.appendChild(el('div', 'row-value', d.value));
      rows.appendChild(row);
      return row;
    });
    focus.index = Math.min(focus.index, items.length - 1);
    focus.setItems(items);
    focus.applyFocus();
  }

  screen.enter = () => {
    focus.index = 0;
    render();
  };
  screen.resume = () => render();
  screen.hints = () => [
    ['A', 'Vælg'],
    ['B', 'Tilbage'],
    ['✚', 'Navigér']
  ];
  screen.onInput = (action) => {
    if (action === 'up' || action === 'down') {
      focus.move(action);
    } else if (action === 'a' && focus.current) {
      const id = focus.current.dataset.id;
      if (id === 'photosDir' || id === 'videosDir') {
        Screens.push(folderPicker, {
          startPath: cfg[id] || null,
          onPick: async (dir) => {
            await api.setConfig({ [id]: dir });
            toast('Mappe gemt: ' + dir);
          }
        });
      } else if (id === 'quit') {
        api.quit();
      }
    } else if (action === 'b') {
      Screens.pop();
    }
  };
});

// ---------------------------------------------------------------------------
// Ur + controller-status + opstart
// ---------------------------------------------------------------------------

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('da-DK', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
updateClock();
setInterval(updateClock, 15000);

setInterval(() => {
  document.getElementById('no-gamepad').classList.toggle('hidden', Input.connected);
}, 1000);

Input.on((action) => Screens.handle(action));
Screens.push(homeScreen);
