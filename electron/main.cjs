/** Dev only: keep `npm run electron:dev` terminal free of Electron/Chromium noise. */
if (process.env.VITE_DEV_SERVER_URL) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Menu,
  desktopCapturer,
  nativeTheme,
} = require("electron");
const fs = require("fs");
const path = require("path");
const { startGlobalInputTracker } = require("./globalInputTracker.cjs");
const { createAppUsageTracker } = require("./appUsageTracker.cjs");
const { initAutoUpdater, stopAutoUpdater } = require("./autoUpdater.cjs");

/** `null` = hook not running. Only active while task timer runs (renderer IPC). */
let globalInputTracker = null;

let appUsageTracker = null;
function getAppUsageTracker() {
  if (!appUsageTracker) {
    appUsageTracker = createAppUsageTracker({ pollMs: 5000 });
  }
  return appUsageTracker;
}

/** Whether `uiohook-napi` can be loaded (does not mean hook is currently running). */
let nativeModuleAvailable = null;
function probeNativeModule() {
  if (nativeModuleAvailable != null) return nativeModuleAvailable;
  try {
    require("uiohook-napi");
    nativeModuleAvailable = true;
  } catch {
    nativeModuleAvailable = false;
  }
  return nativeModuleAvailable;
}

ipcMain.handle("global-input-tracker-status", () => ({
  native: probeNativeModule(),
  active: Boolean(globalInputTracker?.nativeOk),
}));

/** Start/stop global input hook (call `enabled: false` when timer stops). */
ipcMain.handle("set-global-input-tracking", (_event, payload) => {
  const enabled = Boolean(payload?.enabled);
  if (enabled) {
    if (!probeNativeModule()) {
      return { ok: true, native: false };
    }
    if (globalInputTracker?.nativeOk) {
      return { ok: true, native: true };
    }
    if (globalInputTracker?.stop) globalInputTracker.stop();
    globalInputTracker = startGlobalInputTracker();
    if (!globalInputTracker.nativeOk) {
      globalInputTracker.stop();
      globalInputTracker = null;
      return { ok: true, native: false };
    }
    return { ok: true, native: true };
  }
  if (globalInputTracker?.stop) {
    globalInputTracker.stop();
  }
  globalInputTracker = null;
  return { ok: true, native: probeNativeModule() };
});

ipcMain.handle("app-usage-tracker-status", () => {
  const snapshot = getAppUsageTracker().getSnapshot();
  return {
    ok: true,
    platform: process.platform,
    tracking: snapshot.tracking,
    supported: snapshot.supported,
  };
});

ipcMain.handle("set-app-usage-tracking", (_event, payload) => {
  const enabled = Boolean(payload?.enabled);
  return enabled ? getAppUsageTracker().start() : getAppUsageTracker().stop();
});

ipcMain.handle("app-usage-get-snapshot", () => ({
  ok: true,
  ...getAppUsageTracker().getSnapshot(),
}));

ipcMain.handle("app-usage-consume-for-sync", () => ({
  ok: true,
  ...getAppUsageTracker().consumeForSync(),
}));

/** Set by `npm run electron:dev` when loading the Vite dev server. */
const devServerUrl = process.env.VITE_DEV_SERVER_URL;
const loadFromDisk = !devServerUrl;

const APP_ICON = path.join(__dirname, "..", "public", "trackerLogo.png");

function buildCspHeader() {
  // Keep it strict (no unsafe-eval). Allow dev server + local APIs.
  const self = `'self'`;
  const sources = {
    defaultSrc: [self],
    baseUri: [self],
    objectSrc: [`'none'`],
    frameAncestors: [`'none'`],
    imgSrc: [
      self,
      "data:",
      "https:",
      "http://127.0.0.1:5001",
      "http://localhost:5001",
    ],
    styleSrc: [self, `'unsafe-inline'`, "https://fonts.googleapis.com"],
    fontSrc: [self, "https://fonts.gstatic.com", "data:"],
    scriptSrc: loadFromDisk
      ? [self]
      : [self, `'unsafe-inline'`, `'unsafe-eval'`],
    connectSrc: [
      self,
      // Production APIs (Render etc.) — built app must reach https backends.
      "https:",

      "http://127.0.0.1:3000",
      "http://localhost:3000",

      "http://127.0.0.1:4000",
      "http://localhost:4000",

      "http://127.0.0.1:5001",
      "http://localhost:5001",

      "http://127.0.0.1:5173",
      "http://localhost:5173",

      "ws://127.0.0.1:5173",
      "ws://localhost:5173",
    ],
  };

  return [
    `default-src ${sources.defaultSrc.join(" ")}`,
    `base-uri ${sources.baseUri.join(" ")}`,
    `object-src ${sources.objectSrc.join(" ")}`,
    `frame-ancestors ${sources.frameAncestors.join(" ")}`,
    `img-src ${sources.imgSrc.join(" ")}`,
    `style-src ${sources.styleSrc.join(" ")}`,
    `font-src ${sources.fontSrc.join(" ")}`,
    `script-src ${sources.scriptSrc.join(" ")}`,
    `connect-src ${sources.connectSrc.join(" ")}`,
  ].join("; ");
}

function isAllowedExternalUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

/** Chromium/Electron dev noise forwarded to the terminal — suppress, not app errors. */
function isDevRendererConsoleNoise(message) {
  const m = String(message || "");
  if (!m) return false;
  if (m.includes("Electron Security Warning")) return true;
  if (m.includes("Insecure Content-Security-Policy")) return true;
  if (m.includes("[Violation]")) return true;
  if (m.includes("Blocked aria-hidden")) return true;
  if (/handler took \d+ms/i.test(m)) return true;
  return false;
}

function attachSuppressDevConsoleNoise(webContents) {
  if (!devServerUrl) return;
  webContents.on("console-message", (event, _level, message) => {
    const text = String(
      message ?? event?.message ?? "",
    );
    if (text.includes("console-message") && text.includes("deprecated")) {
      return;
    }
    if (!isDevRendererConsoleNoise(text)) return;
    if (typeof event?.preventDefault === "function") {
      event.preventDefault();
    }
  });
}

function indexHtmlPath() {
  return path.normalize(path.join(__dirname, "..", "dist", "index.html"));
}

ipcMain.handle("open-external", async (_event, url) => {
  if (!isAllowedExternalUrl(url)) {
    return { ok: false, error: "invalid url" };
  }
  await shell.openExternal(url);
  return { ok: true };
});

/** Largest display thumbnail → PNG base64 (work-tracker style; moderate size like Upwork-style grabs). */
ipcMain.handle("capture-work-screenshot", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1440, height: 900 },
    });
    if (!sources.length) return { ok: false, error: "no_display" };
    const best = sources.reduce((acc, cur) => {
      const a = acc.thumbnail.getSize();
      const c = cur.thumbnail.getSize();
      return a.width * a.height >= c.width * c.height ? acc : cur;
    });
    const png = best.thumbnail.toPNG();
    return { ok: true, base64: Buffer.from(png).toString("base64") };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
});

const WINDOW_WIDTH = 420;

const WINDOW_CHROME = {
  light: {
    backgroundColor: "#f5f5f5",
    titleBarColor: "#ffffff",
    titleBarSymbolColor: "#171717",
  },
  dark: {
    backgroundColor: "#252528",
    titleBarColor: "#2e2e32",
    titleBarSymbolColor: "#ffffff",
  },
};

let mainWindow = null;

function applyWindowChrome(win, mode) {
  if (!win || win.isDestroyed()) return;
  const chrome = WINDOW_CHROME[mode === "dark" ? "dark" : "light"];
  win.setBackgroundColor(chrome.backgroundColor);
  if (process.platform === "win32" && typeof win.setTitleBarOverlay === "function") {
    try {
      win.setTitleBarOverlay({
        color: chrome.titleBarColor,
        symbolColor: chrome.titleBarSymbolColor,
        height: 32,
      });
    } catch {
      /* unsupported on older Windows */
    }
  }
}

ipcMain.handle("set-window-theme", (_event, payload) => {
  const mode = payload?.mode === "dark" ? "dark" : "light";
  nativeTheme.themeSource = mode;
  applyWindowChrome(mainWindow, mode);
  return { ok: true };
});

function createWindow() {
  const initialChrome = WINDOW_CHROME.light;
  const win = new BrowserWindow({
    title: "Elevate Bright Tech",
    icon: fs.existsSync(APP_ICON) ? APP_ICON : undefined,
    width: WINDOW_WIDTH,
    minWidth: WINDOW_WIDTH,
    maxWidth: WINDOW_WIDTH,
    height: 700,
    backgroundColor: initialChrome.backgroundColor,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      // Preload + contextBridge is more reliable with sandbox off on some Windows setups.
      sandbox: false,
      // Vite's built index uses file://; webSecurity blocks many ES-module / chunk loads there.
      webSecurity: !loadFromDisk,
    },
    autoHideMenuBar: true,
  });
  mainWindow = win;
  nativeTheme.themeSource = "light";
  applyWindowChrome(win, "light");
  win.setMenuBarVisibility(false);
  attachSuppressDevConsoleNoise(win.webContents);

  // Set CSP via response headers so it applies in Electron,
  // without breaking Vite when opened in a regular browser.
  const csp = buildCspHeader();
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = {
      ...(details.responseHeaders || {}),
      // Set both casings to cover Electron/chromium variations.
      "Content-Security-Policy": [csp],
      "content-security-policy": [csp],
    };
    callback({ responseHeaders });
  });

  win.webContents.setWindowOpenHandler((details) => {
    if (isAllowedExternalUrl(details.url)) {
      void shell.openExternal(details.url);
    }
    return { action: "deny" };
  });

  const ensureVisible = () => {
    if (!win.isDestroyed() && !win.isVisible()) win.show();
  };

  win.once("ready-to-show", ensureVisible);
  // If load fails or ready-to-show never fires, still show the window (and devtools can help).
  setTimeout(ensureVisible, 2500);

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, failedUrl) => {
      // ERR_ABORTED — navigation replaced; not a user-facing failure.
      if (errorCode === -3) return;

      const indexPath = indexHtmlPath();
      dialog.showErrorBox(
        "Elevate Bright Tech — failed to load",
        [
          "The app window could not load the UI.",
          "",
          `Error ${errorCode}: ${errorDescription}`,
          `URL: ${failedUrl}`,
          "",
          `Expected file: ${indexPath}`,
          `File exists: ${fs.existsSync(indexPath) ? "yes" : 'NO — rebuild with "npm run electron:build"'}`,
        ].join("\n"),
      );
      ensureVisible();
    },
  );

  if (devServerUrl) {
    void win.loadURL(devServerUrl);
  } else {
    const indexPath = indexHtmlPath();
    if (!fs.existsSync(indexPath)) {
      dialog.showErrorBox(
        "Elevate Bright Tech — missing files",
        [
          "index.html was not found next to the app.",
          "",
          indexPath,
          "",
          "Install a fresh build or run: npm run electron:build",
        ].join("\n"),
      );
      win.show();
      return;
    }
    void win.loadFile(indexPath);
  }
}

app.whenReady().then(() => {
  app.setName("Elevate Bright Tech");
  createWindow();
  probeNativeModule();
  initAutoUpdater();
});
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
});

app.on("will-quit", () => {
  stopAutoUpdater();
  if (globalInputTracker?.stop) {
    globalInputTracker.stop();
    globalInputTracker = null;
  }
  if (appUsageTracker?.stop) {
    appUsageTracker.stop();
    appUsageTracker = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

