import { OpenAPIHono } from "@hono/zod-openapi";
import { stacksHandler } from "./stacks.handler";
import { stacksRoute } from "./stacks.route";

const router = new OpenAPIHono();

router.openapi(stacksRoute, stacksHandler);

export default router;
