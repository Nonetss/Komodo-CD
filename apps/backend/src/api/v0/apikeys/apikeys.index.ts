import { OpenAPIHono } from "@hono/zod-openapi";
import {
	createApiKeyHandler,
	deleteApiKeyHandler,
	listApiKeysHandler,
} from "./apikeys.handler";
import {
	createApiKeyRoute,
	deleteApiKeyRoute,
	listApiKeysRoute,
} from "./apikeys.route";

const router = new OpenAPIHono();

router.openapi(listApiKeysRoute, listApiKeysHandler);
router.openapi(createApiKeyRoute, createApiKeyHandler);
router.openapi(deleteApiKeyRoute, deleteApiKeyHandler);

export default router;
