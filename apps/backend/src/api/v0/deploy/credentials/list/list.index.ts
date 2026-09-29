import { OpenAPIHono } from "@hono/zod-openapi";
import { listHandler } from "./list.handler";
import { listRoute } from "./list.route";

const router = new OpenAPIHono();

router.openapi(listRoute, listHandler);

export default router;
