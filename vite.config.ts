import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ER09_CAPTURE_FILES = new Set([
  "er-09-runtime-hero.png",
  "er-09-runtime-alternate.png",
  "er-09-runtime-reactor-closeup.png",
  "er-09-runtime-console.png",
  "er-10-runtime-hero.png",
  "er-10-runtime-alternate.png",
  "er-10-runtime-reactor-closeup.png",
  "er-10-runtime-console.png",
  "er-10-runtime-exterior.png",
  "er-10b-runtime-hero.png",
  "er-10b-runtime-alternate.png",
  "er-10b-runtime-reactor-closeup.png",
  "er-10b-runtime-console.png",
  "er-12a-runtime-hero.png",
  "er-12a-runtime-alternate.png",
  "er-12a-runtime-reactor-closeup.png",
  "er-12a-runtime-console.png",
]);

function er09CapturePlugin() {
  return {
    name: "core-vault-er09-local-capture",
    apply: "serve" as const,
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use("/__er09_capture", (request: any, response: any) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end("Method not allowed");
          return;
        }
        const filename = request.headers["x-er09-filename"];
        if (typeof filename !== "string" || !ER09_CAPTURE_FILES.has(filename)) {
          response.statusCode = 400;
          response.end("Invalid ER-09 capture filename");
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        request.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 32 * 1024 * 1024) request.destroy();
          else chunks.push(chunk);
        });
        request.on("end", async () => {
          try {
            const payload = Buffer.concat(chunks).toString("utf8");
            const prefix = "data:image/png;base64,";
            if (!payload.startsWith(prefix)) throw new Error("Capture is not PNG data");
            const reviewDir = resolve(
              process.cwd(),
              "art-source/blender/engine-room/review",
            );
            await mkdir(reviewDir, { recursive: true });
            await writeFile(
              resolve(reviewDir, filename),
              Buffer.from(payload.slice(prefix.length), "base64"),
            );
            response.statusCode = 204;
            response.end();
          } catch (error) {
            response.statusCode = 500;
            response.end(error instanceof Error ? error.message : String(error));
          }
        });
      });
      server.middlewares.use("/__er10_performance", (request: any, response: any) => {
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end("Method not allowed");
          return;
        }
        const scenario = request.headers["x-er10-scenario"];
        if (typeof scenario !== "string" || !/^[A-F]$/.test(scenario)) {
          response.statusCode = 400;
          response.end("Invalid ER-10 performance scenario");
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        request.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 64 * 1024) request.destroy();
          else chunks.push(chunk);
        });
        request.on("end", async () => {
          try {
            const reviewDir = resolve(
              process.cwd(),
              "art-source/blender/engine-room/review",
            );
            await mkdir(reviewDir, { recursive: true });
            await writeFile(
              resolve(reviewDir, `er-10-performance-${scenario}.json`),
              Buffer.concat(chunks),
            );
            response.statusCode = 204;
            response.end();
          } catch (error) {
            response.statusCode = 500;
            response.end(error instanceof Error ? error.message : String(error));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), er09CapturePlugin()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: process.env.TAURI_DEBUG ? false : "oxc",
    sourcemap: Boolean(process.env.TAURI_DEBUG),
  },
});
