/**
 * Free a dev port before Vite (Windows: PowerShell + taskkill + bind check).
 */
const { execSync } = require("node:child_process");
const { canBind, waitPortFree, HOST } = require("./wait-port-free.cjs");

const DEFAULT_PORT = 5173;

function processExists(pid) {
  try {
    const out = execSync(`tasklist /FI "PID eq ${pid}" /NH`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return new RegExp(`\\b${pid}\\b`).test(out);
  } catch {
    return false;
  }
}

function getListeningPids(port) {
  const pids = new Set();
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    for (const line of out.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0") pids.add(pid);
    }
  } catch {
    /* no listeners */
  }
  return [...pids];
}

function killListenersOnce(port) {
  const pids = getListeningPids(port);
  for (const pid of pids) {
    if (!processExists(pid)) continue;
    console.log(`[free-port] stopping PID ${pid} on :${port}`);
    try {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: "ignore" });
    } catch {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      } catch {
        /* ignore */
      }
    }
  }
}

async function freePort(port) {
  if (await canBind(port)) return true;

  const livePids = () => getListeningPids(port).filter(processExists);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    if (livePids().length === 0) break;
    killListenersOnce(port);
    if (await waitPortFree(4000, port)) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return canBind(port);
}

async function freePort5173() {
  return freePort(DEFAULT_PORT);
}

if (require.main === module) {
  freePort5173()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch(() => process.exit(1));
} else {
  module.exports = { freePort, freePort5173, killListenersOnce, HOST };
}
