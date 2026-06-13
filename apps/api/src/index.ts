import { Elysia } from "elysia";
import { folderRoutes } from "./routes/folders.routes";

const app = new Elysia()
  .use(folderRoutes)
  .get("/", () => "Windows Explorer API")
  .listen(3001);

console.log(`API running at http://${app.server?.hostname}:${app.server?.port}`);
