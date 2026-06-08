/**
 * Before Electron dev: free port 5173 + clear stale Vite optimizer cache.
 */
const fs = require("node:fs");
const path = require("node:path");
async function prepElectronDev() {
  const viteCache = path.join(__dirname, "..", "node_modules", ".vite");
  if (fs.existsSync(viteCache)) {
    fs.rmSync(viteCache, { recursive: true, force: true });
    console.log("[prep-electron-dev] cleared node_modules/.vite");
  }
}

module.exports = { prepElectronDev };

if (require.main === module) {
  prepElectronDev().catch((err) => {
    console.error("[prep-electron-dev]", err.message || err);
    process.exit(1);
  });
}
