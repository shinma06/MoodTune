#!/usr/bin/env node
/**
 * Run FastAPI (uvicorn) from api/.venv. Cross-platform.
 * Used by npm run dev:api and npm run dev.
 */
import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const apiDir = path.join(root, "api")
const isWin = process.platform === "win32"
const uvicorn = path.join(
  apiDir,
  ".venv",
  isWin ? "Scripts" : "bin",
  isWin ? "uvicorn.cmd" : "uvicorn"
)

const child = spawn(
  uvicorn,
  ["main:app", "--reload", "--port", "8000"],
  { cwd: apiDir, stdio: "inherit", shell: isWin }
)
child.on("exit", (code) => process.exit(code ?? 0))
