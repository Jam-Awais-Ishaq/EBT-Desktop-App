/**
 * Check whether a TCP port can be bound (accurate for Vite strictPort).
 */
const net = require("node:net");

const HOST = "127.0.0.1";
const DEFAULT_PORT = 5173;

function canBind(port = DEFAULT_PORT) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.listen(port, HOST, () => {
      server.close(() => resolve(true));
    });
  });
}

async function waitPortFree(maxMs = 20_000, port = DEFAULT_PORT) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (await canBind(port)) return true;
    await new Promise((r) => setTimeout(r, 350));
  }
  return false;
}

module.exports = { canBind, waitPortFree, HOST, DEFAULT_PORT };
