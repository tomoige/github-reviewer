#!/usr/bin/env node
/**
 * Cross-platform dev launcher for GitReview AI.
 *
 * For each requested app it will:
 *   1. Copy the .env example file into place if it does not exist yet.
 *   2. Run `npm install` if node_modules is missing.
 *   3. Start the app's `npm run dev` server.
 *
 * Usage:
 *   node scripts/dev.js backend
 *   node scripts/dev.js frontend
 *   node scripts/dev.js all        (runs both with prefixed output)
 */
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const APPS = {
  backend: { dir: "backend", envFile: ".env" },
  frontend: { dir: "frontend", envFile: ".env.local" },
};

function prepare(name) {
  const app = APPS[name];
  const dir = path.join(ROOT, app.dir);
  const envPath = path.join(dir, app.envFile);
  const examplePath = path.join(dir, ".env.example");

  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`[${name}] created ${app.envFile} from .env.example`);
  }

  if (!fs.existsSync(path.join(dir, "node_modules"))) {
    console.log(`[${name}] installing dependencies...`);
    const result = spawnSync("npm", ["install"], {
      cwd: dir,
      stdio: "inherit",
      shell: true,
    });
    if (result.status !== 0) {
      console.error(`[${name}] dependency install failed.`);
      process.exit(result.status ?? 1);
    }
  }

  return dir;
}

function runSingle(name) {
  const dir = prepare(name);
  const child = spawn("npm", ["run", "dev"], {
    cwd: dir,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => process.exit(code ?? 0));
}

function runWithPrefix(name, dir) {
  const child = spawn("npm", ["run", "dev"], { cwd: dir, shell: true });
  const prefix = `[${name}] `;
  const pipe = (stream, out) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) out.write(prefix + line + "\n");
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
}

function runAll() {
  const children = Object.keys(APPS).map((name) => {
    const dir = prepare(name);
    return runWithPrefix(name, dir);
  });

  const shutdown = () => children.forEach((c) => c.kill());
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

const target = (process.argv[2] || "all").toLowerCase();

if (target === "all") {
  runAll();
} else if (APPS[target]) {
  runSingle(target);
} else {
  console.error(`Unknown target "${target}". Use: backend | frontend | all`);
  process.exit(1);
}
