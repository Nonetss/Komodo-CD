import { OpenAPIHono } from "@hono/zod-openapi";
import { historyHandler } from "./history.handler";
import { historyRoute } from "./history.route";

const router = new OpenAPIHono();

router.openapi(historyRoute, historyHandler);

export default router;
