import { OpenAPIHono } from "@hono/zod-openapi";
import deleteRoute from "@/api/v0/deploy/credentials/delete/delete.index";
import listRoute from "@/api/v0/deploy/credentials/list/list.index";
import saveRoute from "@/api/v0/deploy/credentials/save/save.index";

const app = new OpenAPIHono();
app.route("/credentials", deleteRoute);

app.route("/credentials", listRoute);

app.route("/credentials", saveRoute);

export default app;
