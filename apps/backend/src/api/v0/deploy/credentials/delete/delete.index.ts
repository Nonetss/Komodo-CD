import { OpenAPIHono } from "@hono/zod-openapi";
import { deleteHandler } from "./delete.handler";
import { deleteRoute } from "./delete.route";

const router = new OpenAPIHono();

router.openapi(deleteRoute, deleteHandler);

export default router;
