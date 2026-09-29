import { OpenAPIHono } from "@hono/zod-openapi";
import { triggerHandler } from "./trigger.handler";
import { triggerRoute } from "./trigger.route";

const router = new OpenAPIHono();

router.openapi(triggerRoute, triggerHandler);

export default router;
