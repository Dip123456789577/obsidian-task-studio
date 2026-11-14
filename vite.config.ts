// TASKFORGE Vite config
// Note: @lovable.dev/vite-tanstack-config bundles TanStack Start, React, Tailwind, Nitro, and
// other build plugins. Do NOT add duplicates manually.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";
import { handleApiRequest } from "./src/lib/api-handlers";

function taskforgeApiPlugin(): Plugin {
  return {
    name: "taskforge-api-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/")) {
          const host = req.headers.host || "localhost:8080";
          const protocol = req.headers["x-forwarded-proto"] || "http";
          const url = new URL(req.url, `${protocol}://${host}`);

          let body = "";
          if (req.method === "POST" || req.method === "PUT") {
            for await (const chunk of req) {
              body += chunk;
            }
          }

          const reqInit: RequestInit = {
            method: req.method || "GET",
            headers: (req.headers as unknown as HeadersInit) || {},
          };
          if (body) {
            reqInit.body = body;
          }

          const request = new Request(url.href, reqInit);

          const apiRes = await handleApiRequest(url, request);
          if (apiRes) {
            res.statusCode = apiRes.status;
            apiRes.headers.forEach((val, key) => res.setHeader(key, val));
            const resBody = await apiRes.text();
            res.end(resBody);
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
