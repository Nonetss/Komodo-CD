import { OpenAPIHono } from "@hono/zod-openapi";
import v0 from "@/api/v0";

const app = new OpenAPIHono();
app.route("/api", v0);

export default app;
