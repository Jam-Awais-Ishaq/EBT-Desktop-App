/**
 * Start Vite, wait until deps are ready, then Electron (no port race with concurrently).
 */
const { spawn } = require("node:child_process");
const path = require("node:path");
const http = require("node:http");

const root = path.join(__dirname, "..");
const HOST = "127.0.0.1";
const PORT_CANDIDATES = [5173, 5174, 5175];

const DEP_PATHS = [
  "/node_modules/.vite/deps/react.js",
  "/node_modules/.vite/deps/react-dom_client.js",
  "/node_modules/.vite/deps/react-redux.js",
  "/node_modules/.vite/deps/react_jsx-dev-runtime.js",
];

function fetchStatus(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: HOST, port, path: pathname, timeout: 5000 },
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

async function waitForViteReady(port) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const rootOk = (await fetchStatus(port, "/")) === 200;
      if (!rootOk) throw new Error("root not 200");
      for (const dep of DEP_PATHS) {
        const code = await fetchStatus(port, dep);
        if (code !== 200) throw new Error(`dep ${dep} -> ${code}`);
      }
      console.log("[electron-dev] Vite ready (server + optimized deps)");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error("[electron-dev] timed out waiting for Vite");
}

async function resolveDevPort() {
  const { freePort } = require("./free-port-5173.cjs");
  for (const port of PORT_CANDIDATES) {
    if (await freePort(port)) {
      if (port !== 5173) {
        console.log(`[electron-dev] port 5173 busy — using ${port}`);
      }
      return port;
    }
  }
  throw new Error(
    `ports ${PORT_CANDIDATES.join(", ")} are in use — close other dev servers and try again`,
  );
}

function spawnProc(execPath, args, env) {
  return spawn(execPath, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: false,
    windowsHide: true,
  });
}

async function main() {
  const { prepElectronDev } = require("./prep-electron-dev.cjs");
  await prepElectronDev();

  const port = await resolveDevPort();
  const viteEnv = { ELECTRON: "true" };
  const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");

  console.log("[electron-dev] starting Vite on port", port);
  const vite = spawnProc(process.execPath, [
    viteBin,
    "--port",
    String(port),
    "--strictPort",
    "--host",
    HOST,
  ], viteEnv);

  let electron = null;

  const shutdown = (code = 0) => {
    if (electron && !electron.killed) electron.kill("SIGTERM");
    if (vite && !vite.killed) vite.kill("SIGTERM");
    setTimeout(() => process.exit(code), 300);
  };

  process.on("SIGINT", () => shutdown(0));
  process.on("SIGTERM", () => shutdown(0));

  vite.on("error", (err) => {
    console.error("[electron-dev] Vite failed:", err.message);
    shutdown(1);
  });

  vite.on("exit", (code) => {
    if (code != null && code !== 0) {
      console.error("[electron-dev] Vite exited with code", code);
      shutdown(code);
    }
  });

  try {
    await waitForViteReady(port);
  } catch (err) {
    console.error(err.message || err);
    shutdown(1);
    return;
  }

  const electronEnv = {
    ELECTRON: "true",
    ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
    VITE_DEV_SERVER_URL: `http://${HOST}:${port}`,
  };

  const electronCli = path.join(root, "node_modules", "electron", "cli.js");
  console.log("[electron-dev] starting Electron");
  electron = spawnProc(process.execPath, [electronCli, "."], electronEnv);

  electron.on("error", (err) => {
    console.error("[electron-dev] Electron failed:", err.message);
    shutdown(1);
  });

  electron.on("exit", (code) => {
    shutdown(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
