// Preload til retro-spil-vinduet.
// Overvaager controlleren: hold SELECT + START nede i ca. 1 sekund
// for at lukke vinduet og vende tilbage til KloppHits.

const { ipcRenderer } = require('electron');

const HOLD_MS = 1000;
const POLL_MS = 100;
let heldSince = null;

setInterval(() => {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let comboDown = false;
  for (const pad of pads) {
    if (!pad || !pad.buttons) continue;
    const select = pad.buttons[8] && pad.buttons[8].pressed;
    const start = pad.buttons[9] && pad.buttons[9].pressed;
    if (select && start) {
      comboDown = true;
      break;
    }
  }
  if (comboDown) {
    if (heldSince === null) heldSince = Date.now();
    if (Date.now() - heldSince >= HOLD_MS) {
      heldSince = null;
      ipcRenderer.send('retro:close');
    }
  } else {
    heldSince = null;
  }
}, POLL_MS);

// Vis en kort hjaelpetekst naar siden er indlaest.
window.addEventListener('DOMContentLoaded', () => {
  try {
    const hint = document.createElement('div');
    hint.textContent = 'Hold SELECT + START for at vende tilbage til KloppHits';
    hint.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:50%',
      'transform:translateX(-50%)',
      'background:rgba(0,0,0,0.85)',
      'color:#fff',
      'padding:12px 24px',
      'border-radius:999px',
      'font:600 16px/1.2 sans-serif',
      'z-index:2147483647',
      'pointer-events:none',
      'transition:opacity 1s ease'
    ].join(';');
    document.body.appendChild(hint);
    setTimeout(() => {
      hint.style.opacity = '0';
      setTimeout(() => hint.remove(), 1200);
    }, 6000);
  } catch {
    /* nogle sider tillader ikke DOM-injektion - ignorer */
  }
});
