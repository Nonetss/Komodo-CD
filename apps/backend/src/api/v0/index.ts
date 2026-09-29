import { OpenAPIHono } from "@hono/zod-openapi";
import apiKeysRoute from "@/api/v0/apikeys/apikeys.index";
import deployRoute from "@/api/v0/deploy";
import historyRoute from "@/api/v0/history/history.index";
import stacksRoute from "@/api/v0/stacks/stacks.index";

const app = new OpenAPIHono();

app.route("/v0", deployRoute);
app.route("/v0/stacks", stacksRoute);
app.route("/v0/apikeys", apiKeysRoute);
app.route("/v0/history", historyRoute);

export default app;
