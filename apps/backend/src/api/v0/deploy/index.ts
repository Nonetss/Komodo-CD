import { OpenAPIHono } from "@hono/zod-openapi";
import credentialsRoute from "@/api/v0/deploy/credentials/index";
import triggerRoute from "@/api/v0/deploy/trigger/trigger.index";

const app = new OpenAPIHono();

app.route("/deploy", triggerRoute);
app.route("/deploy", credentialsRoute);

export default app;
