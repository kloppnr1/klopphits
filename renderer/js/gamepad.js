// Controller-input til KloppHits.
// Poller Gamepad API'et og udsender abstrakte handlinger:
//   up, down, left, right, a, b, x, y, lb, rb, start, select
// Retningsknapper gentages ved hold (som i konsol-menuer).
// Tastatur virker som reserve under udvikling.

const Input = (() => {
  const listeners = [];
  const REPEAT_DELAY = 420; // ms foer gentagelse starter
  const REPEAT_RATE = 130;  // ms mellem gentagelser
  const STICK_THRESHOLD = 0.55;
  const DIRECTIONAL = new Set(['up', 'down', 'left', 'right']);

  const BUTTON_MAP = {
    0: 'a',
    1: 'b',
    2: 'x',
    3: 'y',
    4: 'lb',
    5: 'rb',
    8: 'select',
    9: 'start',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right'
  };

  // action -> { since, lastRepeat }
  const held = new Map();
  let anyGamepad = false;

  function emit(action) {
    for (const fn of listeners) fn(action);
  }

  function activeActions() {
    const actions = new Set();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    anyGamepad = false;
    for (const pad of pads) {
      if (!pad) continue;
      anyGamepad = true;
      pad.buttons.forEach((btn, i) => {
        if (btn.pressed && BUTTON_MAP[i]) actions.add(BUTTON_MAP[i]);
      });
      if (pad.axes.length >= 2) {
        if (pad.axes[0] < -STICK_THRESHOLD) actions.add('left');
        if (pad.axes[0] > STICK_THRESHOLD) actions.add('right');
        if (pad.axes[1] < -STICK_THRESHOLD) actions.add('up');
        if (pad.axes[1] > STICK_THRESHOLD) actions.add('down');
      }
    }
    return actions;
  }

  function tick() {
    const now = performance.now();
    const actions = activeActions();

    // Slip handlinger der ikke laengere er aktive
    for (const action of [...held.keys()]) {
      if (!actions.has(action)) held.delete(action);
    }

    for (const action of actions) {
      const h = held.get(action);
      if (!h) {
        held.set(action, { since: now, lastRepeat: now });
        emit(action);
      } else if (DIRECTIONAL.has(action)) {
        if (now - h.since >= REPEAT_DELAY && now - h.lastRepeat >= REPEAT_RATE) {
          h.lastRepeat = now;
          emit(action);
        }
      }
    }

    requestAnimationFrame(tick);
  }

  // Tastatur-reserve (praktisk under udvikling)
  const KEY_MAP = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Enter: 'a',
    Escape: 'b',
    Backspace: 'b',
    x: 'x',
    y: 'y',
    q: 'lb',
    e: 'rb'
  };

  window.addEventListener('keydown', (ev) => {
    const action = KEY_MAP[ev.key];
    if (action) {
      ev.preventDefault();
      emit(action);
    }
  });

  requestAnimationFrame(tick);

  return {
    on(fn) {
      listeners.push(fn);
    },
    get connected() {
      return anyGamepad;
    }
  };
})();
