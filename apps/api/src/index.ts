import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { folderRoutes } from "./routes/folders.routes";

const app = new Elysia()
  .use(cors())
  .use(folderRoutes)
  .get("/", () => "Windows Explorer API")
  .listen({
    port: Number(process.env.PORT ?? 3001),
    hostname: "0.0.0.0",
  });

console.log(`API running at http://${app.server?.hostname}:${app.server?.port}`);
