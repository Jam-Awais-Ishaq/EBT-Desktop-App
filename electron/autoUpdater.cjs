const { app, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

let checkTimer = null;
let updateReady = false;

function isAutoUpdateEnabled() {
  return app.isPackaged && !process.env.VITE_DEV_SERVER_URL;
}

function promptRestart() {
  if (updateReady) return;
  updateReady = true;

  void dialog
    .showMessageBox({
      type: "info",
      title: "Update ready",
      message: "A new version of Elevate Bright Tec has been downloaded.",
      detail: "Restart the app to install the update.",
      buttons: ["Restart now", "Later"],
      defaultId: 0,
      cancelId: 1,
    })
    .then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      } else {
        updateReady = false;
      }
    });
}

function initAutoUpdater() {
  if (!isAutoUpdateEnabled()) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-downloaded", () => {
    promptRestart();
  });

  autoUpdater.on("error", (error) => {
    console.error("[auto-updater]", error?.message || error);
  });

  const check = () => {
    void autoUpdater.checkForUpdates().catch((error) => {
      console.error("[auto-updater] check failed:", error?.message || error);
    });
  };

  check();
  checkTimer = setInterval(check, CHECK_INTERVAL_MS);
}

function stopAutoUpdater() {
  if (checkTimer) {
    clearInterval(checkTimer);
    checkTimer = null;
  }
}

module.exports = { initAutoUpdater, stopAutoUpdater, isAutoUpdateEnabled };
