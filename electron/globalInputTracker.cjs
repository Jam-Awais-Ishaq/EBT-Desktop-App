/**
 * System-wide mouse click + keyboard activity (Windows/macOS/Linux via libuiohook).
 * Runs in Electron **main** process only — not in React.
 *
 * Start only while the task timer is running (`set-global-input-tracking` from renderer).
 * Forwards events via `webContents.send('global-input-activity', payload)`.
 */
const { BrowserWindow } = require("electron");

function broadcast(payload) {
  const wins = BrowserWindow.getAllWindows();
  for (let i = 0; i < wins.length; i += 1) {
    const win = wins[i];
    try {
      if (win && !win.isDestroyed()) win.webContents.send("global-input-activity", payload);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @returns {{ stop: () => void; nativeOk: boolean }}
 */
function startGlobalInputTracker() {
  let uIOhook;
  try {
    ({ uIOhook } = require("uiohook-napi"));
  } catch (err) {
    console.warn("[globalInputTracker] uiohook-napi failed to load:", err?.message || err);
    return { stop: () => {}, nativeOk: false };
  }

  const onClick = () => broadcast({ type: "click" });
  const onKeydown = () => broadcast({ type: "keypress" });

  uIOhook.on("click", onClick);
  uIOhook.on("keydown", onKeydown);

  try {
    uIOhook.start();
    console.log("[globalInputTracker] started (timer session — system-wide clicks + keydowns)");
  } catch (err) {
    console.warn("[globalInputTracker] uIOhook.start failed:", err?.message || err);
    try {
      uIOhook.removeListener("click", onClick);
      uIOhook.removeListener("keydown", onKeydown);
    } catch {
      /* ignore */
    }
    return { stop: () => {}, nativeOk: false };
  }

  return {
    nativeOk: true,
    stop: () => {
      try {
        uIOhook.removeListener("click", onClick);
        uIOhook.removeListener("keydown", onKeydown);
      } catch {
        /* ignore */
      }
      try {
        uIOhook.stop();
      } catch {
        /* ignore */
      }
      console.log("[globalInputTracker] stopped");
    },
  };
}

module.exports = { startGlobalInputTracker };
