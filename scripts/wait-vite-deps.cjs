/**
 * Wait until Vite serves pre-bundled deps (avoids 504 Outdated Optimize Dep in Electron).
 */
const http = require("node:http");

const HOST = "127.0.0.1";
const PORT = 5173;
const TIMEOUT_MS = 120_000;
const INTERVAL_MS = 400;

const DEP_PATHS = [
  "/node_modules/.vite/deps/react.js",
  "/node_modules/.vite/deps/react-dom_client.js",
  "/node_modules/.vite/deps/react-redux.js",
  "/node_modules/.vite/deps/react_jsx-dev-runtime.js",
];

function fetchStatus(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: HOST, port: PORT, path: pathname, timeout: 3000 },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function waitUntil(check, label) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      if (await check()) {
        console.log(`[wait-vite-deps] ${label}`);
        return;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  throw new Error(`[wait-vite-deps] timed out: ${label}`);
}

async function main() {
  await waitUntil(async () => {
    const code = await fetchStatus("/");
    return code === 200;
  }, "Vite server up");

  await waitUntil(async () => {
    for (const dep of DEP_PATHS) {
      const code = await fetchStatus(dep);
      if (code !== 200) return false;
    }
    return true;
  }, "optimized dependencies ready");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
