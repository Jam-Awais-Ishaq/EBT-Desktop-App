const { execSync, spawnSync } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const root = path.join(__dirname, "..");
const output = path.join(os.tmpdir(), "time-tracker-release");
const publish = process.argv.includes("--publish");

if (publish && !process.env.GH_TOKEN) {
  console.error(
    "GH_TOKEN is not set. Create a GitHub token with repo scope, then run:\n" +
      '  $env:GH_TOKEN = "your_token"\n' +
      "  npm run electron:publish",
  );
  process.exit(1);
}

const builderArgs = [
  "electron-builder",
  "--win",
  `--config.directories.output=${output}`,
];
if (publish) {
  builderArgs.push("--publish", "always");
}

console.log(`Build output: ${output}`);

execSync("vite build", { cwd: root, stdio: "inherit" });
const result = spawnSync("npx", builderArgs, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`\nDone. Installer files are in:\n${output}`);
