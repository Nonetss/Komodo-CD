import { OpenAPIHono } from "@hono/zod-openapi";
import { saveHandler } from "./save.handler";
import { saveRoute } from "./save.route";

const router = new OpenAPIHono();

router.openapi(saveRoute, saveHandler);

export default router;
