/**
 * 同时启动前端 Vite（5173）与后端 Express（3001）
 * 用法：npm run dev:all
 * 退出：按 Ctrl+C 同时结束两个进程
 */
import { spawn } from "node:child_process";

const children = [];
const isWin = process.platform === "win32";

function start(name, cmd, args) {
  console.log(`\n▶ 启动 ${name} ...`);
  const child = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });
  children.push(child);
  child.on("exit", (code) => {
    console.log(`\n■ ${name} 已退出（code=${code}）`);
    if (code !== 0) process.exit(code);
  });
  return child;
}

start("前端 Vite（http://localhost:5173）", "npm", ["run", "dev"]);
start("后端 Express（http://localhost:3001）", "npm", ["run", "server"]);

process.on("SIGINT", () => {
  children.forEach((c) => c.kill("SIGINT"));
  process.exit(0);
});
