// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { handleApiRequest } from "./src/lib/api-handlers";

function taskforgeApiPlugin(): Plugin {
  return {
    name: "taskforge-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/")) {
          const host = req.headers.host || "localhost";
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const url = new URL(req.url, `${protocol}://${host}`);
          const apiRes = handleApiRequest(url);
          if (apiRes) {
            res.statusCode = apiRes.status;
            apiRes.headers.forEach((val, key) => res.setHeader(key, val));
            const body = await apiRes.text();
            res.end(body);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [taskforgeApiPlugin()],
  },
});
