// KloppHits - Electron hovedproces
// Big screen launcher styret med controller.

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require('url');

const WINDOWED = process.argv.includes('--windowed');

let mainWindow = null;
let retroWindow = null;

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG = {
  photosDir: null,
  videosDir: null,
  retroSites: [
    {
      name: 'Internet Arcade',
      description: 'Klassiske arkadespil i browseren (archive.org)',
      url: 'https://archive.org/details/internetarcade'
    },
    {
      name: 'Console Living Room',
      description: 'Retro konsolspil (archive.org)',
      url: 'https://archive.org/details/consolelivingroom'
    },
    {
      name: 'MS-DOS Games',
      description: 'Tusindvis af DOS-spil (archive.org)',
      url: 'https://archive.org/details/softwarelibrary_msdos_games'
    },
    {
      name: 'itch.io - Gratis browserspil',
      description: 'Gratis indie- og retrospil der koerer i browseren',
      url: 'https://itch.io/games/free/platform-web'
    }
  ]
};

function configPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(configPath(), 'utf8'));
    return { ...DEFAULT_CONFIG, ...raw };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(cfg) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
}

// ---------------------------------------------------------------------------
// Medie-scanning (billeder & videoer)
// ---------------------------------------------------------------------------

const PHOTO_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const VIDEO_EXTS = ['.mp4', '.m4v', '.webm', '.mov', '.mkv'];
const MAX_FILES = 2000;
const MAX_DEPTH = 5;

function walkMedia(dir, exts, depth = 0, out = []) {
  if (depth > MAX_DEPTH || out.length >= MAX_FILES) return out;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (out.length >= MAX_FILES) break;
    if (e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkMedia(p, exts, depth + 1, out);
    } else if (exts.includes(path.extname(e.name).toLowerCase())) {
      out.push(p);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Steam-bibliotek
// ---------------------------------------------------------------------------

function steamRoots() {
  const home = os.homedir();
  let candidates = [];
  if (process.platform === 'win32') {
    candidates = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam'
    ];
  } else if (process.platform === 'darwin') {
    candidates = [path.join(home, 'Library', 'Application Support', 'Steam')];
  } else {
    candidates = [
      path.join(home, '.steam', 'steam'),
      path.join(home, '.local', 'share', 'Steam'),
      path.join(home, '.var', 'app', 'com.valvesoftware.Steam', '.local', 'share', 'Steam')
    ];
  }
  return candidates.filter((p) => {
    try {
      return fs.existsSync(path.join(p, 'steamapps'));
    } catch {
      return false;
    }
  });
}

function steamLibraryDirs() {
  const dirs = new Set();
  for (const root of steamRoots()) {
    const steamapps = path.join(root, 'steamapps');
    dirs.add(steamapps);
    // Ekstra biblioteker fra libraryfolders.vdf
    try {
      const vdf = fs.readFileSync(path.join(steamapps, 'libraryfolders.vdf'), 'utf8');
      const re = /"path"\s+"([^"]+)"/g;
      let m;
      while ((m = re.exec(vdf)) !== null) {
        const lib = path.join(m[1].replace(/\\\\/g, '\\'), 'steamapps');
        if (fs.existsSync(lib)) dirs.add(lib);
      }
    } catch {
      /* ingen libraryfolders.vdf */
    }
  }
  return [...dirs];
}

const STEAM_EXCLUDE_NAMES = /proton|steam linux runtime|steamworks common/i;
const STEAM_EXCLUDE_APPIDS = new Set(['228980', '1070560', '1391110', '1628350']);

function findLocalCover(appid) {
  for (const root of steamRoots()) {
    const cacheDir = path.join(root, 'appcache', 'librarycache');
    const candidates = [
      path.join(cacheDir, `${appid}_library_600x900.jpg`),
      path.join(cacheDir, String(appid), 'library_600x900.jpg')
    ];
    for (const c of candidates) {
      try {
        if (fs.existsSync(c)) return pathToFileURL(c).href;
      } catch {
        /* ignorer */
      }
    }
  }
  return null;
}

function scanSteamGames() {
  const games = new Map();
  for (const lib of steamLibraryDirs()) {
    let files = [];
    try {
      files = fs.readdirSync(lib).filter((f) => /^appmanifest_\d+\.acf$/.test(f));
    } catch {
      continue;
    }
    for (const f of files) {
      try {
        const acf = fs.readFileSync(path.join(lib, f), 'utf8');
        const appid = (acf.match(/"appid"\s+"(\d+)"/) || [])[1];
        const name = (acf.match(/"name"\s+"([^"]+)"/) || [])[1];
        if (!appid || !name) continue;
        if (STEAM_EXCLUDE_APPIDS.has(appid)) continue;
        if (STEAM_EXCLUDE_NAMES.test(name)) continue;
        if (!games.has(appid)) {
          games.set(appid, { appid, name, localCover: findLocalCover(appid) });
        }
      } catch {
        /* spring defekt manifest over */
      }
    }
  }
  return [...games.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'da', { sensitivity: 'base' })
  );
}

// ---------------------------------------------------------------------------
// Retro-spil vindue
// ---------------------------------------------------------------------------

function openRetroWindow(url) {
  if (retroWindow && !retroWindow.isDestroyed()) {
    retroWindow.focus();
    return;
  }
  retroWindow = new BrowserWindow({
    fullscreen: !WINDOWED,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'retro-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  retroWindow.loadURL(url);
  retroWindow.on('closed', () => {
    retroWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

function registerIpc() {
  ipcMain.handle('config:get', () => loadConfig());

  ipcMain.handle('config:set', (_e, patch) => {
    const cfg = { ...loadConfig(), ...patch };
    saveConfig(cfg);
    return cfg;
  });

  ipcMain.handle('media:list', (_e, kind) => {
    const cfg = loadConfig();
    const dir = kind === 'photos' ? cfg.photosDir : cfg.videosDir;
    if (!dir || !fs.existsSync(dir)) return { dir: null, items: [] };
    const exts = kind === 'photos' ? PHOTO_EXTS : VIDEO_EXTS;
    const files = walkMedia(dir, exts).sort((a, b) =>
      a.localeCompare(b, 'da', { numeric: true, sensitivity: 'base' })
    );
    return {
      dir,
      items: files.map((p) => ({
        name: path.basename(p),
        fileUrl: pathToFileURL(p).href
      }))
    };
  });

  ipcMain.handle('fs:listDirs', (_e, dirPath) => {
    const target = dirPath || os.homedir();
    let dirs = [];
    try {
      dirs = fs
        .readdirSync(target, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b, 'da', { sensitivity: 'base' }));
    } catch {
      /* utilgaengelig mappe */
    }
    const parent = path.dirname(target);
    return {
      path: target,
      parent: parent !== target ? parent : null,
      dirs
    };
  });

  ipcMain.handle('steam:list', () => {
    const games = scanSteamGames();
    return { found: steamRoots().length > 0, games };
  });

  ipcMain.handle('steam:launch', (_e, appid) => {
    if (!/^\d+$/.test(String(appid))) return false;
    shell.openExternal(`steam://rungameid/${appid}`);
    return true;
  });

  ipcMain.handle('steam:bigpicture', () => {
    shell.openExternal('steam://open/bigpicture');
    return true;
  });

  ipcMain.handle('retro:open', (_e, url) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    } catch {
      return false;
    }
    openRetroWindow(url);
    return true;
  });

  ipcMain.on('retro:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });
}

// ---------------------------------------------------------------------------
// Hovedvindue
// ---------------------------------------------------------------------------

function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: !WINDOWED,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    backgroundColor: '#0b0d17',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpc();
    createMainWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
