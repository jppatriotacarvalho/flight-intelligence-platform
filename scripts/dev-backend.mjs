// Sobe o backend em modo de desenvolvimento.
//
// Existe para o "npm run dev" funcionar em qualquer sistema: o caminho do
// python dentro de um venv muda entre Windows (venv\Scripts\python.exe) e
// Linux/Mac (venv/bin/python), e o script antigo tinha o caminho do Windows
// escrito na mao dentro do package.json.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const windows = process.platform === "win32";

const pythonDoVenv = path.join(
  raiz, "backend", "venv",
  windows ? "Scripts" : "bin",
  windows ? "python.exe" : "python",
);

// Usa o venv do projeto quando ele existe; senao cai no python do PATH.
const python = existsSync(pythonDoVenv) ? pythonDoVenv : (windows ? "python" : "python3");

const filho = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--reload"],
  { cwd: raiz, stdio: "inherit" },
);

filho.on("exit", (codigo) => process.exit(codigo ?? 0));
