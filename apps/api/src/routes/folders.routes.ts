import { Elysia, t } from "elysia";
import { FolderService } from "../services/folder.service";
import { FolderRepository } from "../repositories/folder.repository";

const folderService = new FolderService(new FolderRepository());

export const folderRoutes = new Elysia({ prefix: "/api/v1/folders" })
  .get("/tree", async () => {
    return await folderService.getTree();
  })
  .get(
    "/files/search",
    async ({ query }) => {
      return await folderService.searchFiles(query.q ?? "");
    },
    {
      query: t.Object({ q: t.Optional(t.String()) }),
    }
  )
  .get(
    "/:id/children",
    async ({ params, set }) => {
      const result = await folderService.getChildren(Number(params.id));
      if (!result) {
        set.status = 404;
        return { error: "Folder not found" };
      }
      return result;
    },
    {
      params: t.Object({ id: t.Numeric() }),
    }
  );
